import prisma from "common/prisma";
import { getMongoClient } from "common/mongo";
import { getEvents, getAuth } from "./index";
import dayjs from "common/dayjs";
const { google } = require("googleapis");
import { patchCalendarEvent } from "common/google";
import { getAgenda } from "common/agenda";
import { scheduleNextCheckin } from "common/meetings";
import { getSlug } from "common/slug";

export async function syncMeetings(calendarId: string) {
  const mongoClient = await getMongoClient();
  const doc = await mongoClient
    .db()
    .collection("gcalSyncTokens")
    .findOne({ _id: calendarId });

  const { items, nextSyncToken } = await getEvents(calendarId, doc?.syncToken);

  const events = {};
  const exceptions = {};
  for (const item of items) {
    if (isException(item)) {
      exceptions[item.id] = item;
    } else {
      events[item.id] = item;
    }
  }

  await handleEvents(events);
  await handleExceptions(exceptions);

  await mongoClient
    .db()
    .collection("gcalSyncTokens")
    .updateOne(
      { _id: calendarId },
      {
        $set: { syncToken: nextSyncToken, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
}

function isException(event) {
  return /_/.test(event.id);
}

async function handleEvents(events) {
  const eventIds = Object.keys(events);
  if (eventIds.length === 0) return;
  const meetings = await prisma.meeting.findMany({
    where: { gcal_event_id: { in: eventIds } },
  });

  // create a new Meeting if it wasn't found in the database
  const toCreate = new Set(eventIds);
  for (const record of meetings) {
    toCreate.delete(record.gcal_event_id);
  }

  toCreate.forEach((eventId) => handleCreateMeeting(events, eventId));

  for (const record of meetings) {
    const event = events[record.gcal_event_id];
    await prisma.meeting.update({
      where: { gcal_event_id: event.id },
      data: createUpdate(event),
    });

    scheduleNextCheckin(record.id);
  }
}

function generateRRuleFromEvent(event) {
  return event.recurrence?.[0]
    ? `DTSTART;TZID=${event.start.timeZone}:${dayjs(event.start.dateTime)
        .tz(event.start.timeZone)
        .format("YYYYMMDDTHHmmss")}\n${event.recurrence[0]}`
    : undefined;
}

function createUpdate(event) {
  return {
    status: event.status.toUpperCase(),
    start_time: event.start?.dateTime,
    end_time: event.end?.dateTime,
    rrule: generateRRuleFromEvent(event),
    title: event.summary,
    description: event.description,
  };
}

async function handleExceptions(events) {
  const eventIds = Object.keys(events);
  if (eventIds.length === 0) return;
  const meetingExceptions = await prisma.meetingException.findMany({
    where: { gcal_event_id: { in: eventIds } },
  });

  // create a new MeetingException if it wasn't found in the database
  const toCreate = new Set(eventIds);
  for (const record of meetingExceptions) {
    toCreate.delete(record.gcal_event_id);
  }

  toCreate.forEach((eventId) => handleCreateMeetingException(events, eventId));

  for (const record of meetingExceptions) {
    const event = events[record.gcal_event_id];
    await prisma.meetingException.update({
      where: { gcal_event_id: event.id },
      data: createUpdate(event),
    });

    scheduleNextCheckin(record.meeting_id);
  }
}

async function handleCreateMeeting(events, eventId) {
  const event = events[eventId];
  const meeting_id = parseInt(event.extendedProperties?.private?.mb_meeting_id);
  if (!meeting_id) return;

  const oldMeeting = await prisma.meeting.findUnique({
    where: {
      id: meeting_id,
    },
    include: {
      participants: {
        where: { meeting_time: new Date(0) },
        select: {
          user_id: true,
          meeting_time: true,
          added_by_id: true,
          is_active: true,
        },
      },
      project: {
        select: {
          gcal_calendar_id: true,
        },
      },
    },
  });

  if (!oldMeeting) {
    console.log("meeting not found", { meeting_id });
    return;
  }

  const newMeeting = await prisma.meeting.create({
    data: {
      created_by_id: oldMeeting.created_by_id,
      end_time: new Date(event.end.dateTime),
      gcal_event_id: event.id,
      project_id: oldMeeting.project_id,
      slack_channel_id: oldMeeting.slack_channel_id,
      slack_team_id: oldMeeting.slack_team_id,
      rrule: generateRRuleFromEvent(event),
      start_time: new Date(event.start.dateTime),
      title: event.summary,
      description: event.description,
      slug: getSlug(event.summary),
      participants: { create: oldMeeting.participants },
    },
  });

  await patchCalendarEvent(event.id, oldMeeting.project.gcal_calendar_id, {
    extendedProperties: {
      private: {
        mb_meeting_id: newMeeting.id.toString(),
        mb_project_id: newMeeting.project_id.toString(),
      },
    },
  });

  scheduleNextCheckin(newMeeting.id, newMeeting.start_time);
}

async function handleCreateMeetingException(exceptions, eventId) {
  const event = exceptions[eventId];
  const meeting = await prisma.meeting.findUnique({
    where: { gcal_event_id: event.recurringEventId },
  });

  if (!meeting) {
    console.log("meeting not found", { gcal_event_id: event.recurringEventId });
    return;
  }

  const row = {
    meeting_id: meeting.id,
    instance: event.originalStartTime.dateTime,
    start_time: event.start?.dateTime,
    end_time: event.end?.dateTime,
    gcal_event_id: event.id,
    title: event.summary,
    description: event.description,
    status: event.status.toUpperCase(),
  };

  await prisma.meetingException.upsert({
    where: {
      meeting_id_instance: {
        meeting_id: meeting.id,
        instance: new Date(event.originalStartTime.dateTime),
      },
    },
    create: row,
    update: row,
  });

  scheduleNextCheckin(meeting.id);
}

export async function createNotificationChannel(calendarId: string) {
  const calendar = google.calendar({ version: "v3", auth: getAuth() });
  const webhookURL = process.env.NGROK_URL // ngrok can be used in development
    ? `${process.env.NGROK_URL}/api/google/calendar/watch`
    : `${process.env.NEXTAUTH_URL}/api/google/calendar/watch`;

  const { data: listData } = await await calendar.events.list({
    calendarId,
    maxResults: 1,
  });

  if (listData.accessRole !== "writer") {
    throw new Error("Must have write access");
  }

  let { data: channel } = await calendar.events.watch({
    calendarId,
    requestBody: {
      id: require("crypto").randomUUID(),
      type: "web_hook",
      address: webhookURL,
    },
  });

  channel = {
    ...channel,
    expiration: Number(channel.expiration),
    _id: channel.id,
    calendarId,
    address: webhookURL,
    createdAt: new Date(),
  };

  const mongoClient = await getMongoClient();
  await mongoClient
    .db()
    .collection("gcalNotificationChannels")
    .insertOne(channel);

  const agenda = await getAgenda();
  agenda.schedule(
    new Date(channel.expiration),
    "renewGCalNotificationChannel",
    { calendarId }
  );

  console.log("Google Calendar notification channel created");

  return channel;
}

async function stopNotificationChannel(id, resourceId) {
  const calendar = google.calendar({ version: "v3", auth: getAuth() });
  await calendar.channels.stop({
    requestBody: {
      id,
      resourceId,
    },
  });
  const mongoClient = await getMongoClient();
  await mongoClient
    .db()
    .collection("gcalNotificationChannels")
    .deleteOne({ id, resourceId });
  console.log("channel stopped", { id, resourceId });
}

export async function initSync(calendarId) {
  const mongoClient = await getMongoClient();
  const doc = await mongoClient
    .db()
    .collection("gcalNotificationChannels")
    .findOne({ calendarId, expiration: { $gt: Date.now() } });

  if (!doc) {
    await createNotificationChannel(calendarId);
  }
  console.log("Google Calendar sync initialized");
}
