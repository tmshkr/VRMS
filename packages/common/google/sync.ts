require("dotenv").config({ path: "../../.env" });

import prisma from "common/prisma";
import { getMongoClient } from "common/mongo";
import { getEvents, getAuth } from "./index";
import dayjs from "common/dayjs";
const { google } = require("googleapis");
import { patchCalendarEvent } from "common/google";

export async function syncMeetings() {
  const mongoClient = await getMongoClient();
  const doc = await mongoClient
    .db()
    .collection("gcalSyncTokens")
    .findOne({ _id: "GCAL_SYNC_TOKEN" });

  const { items, nextSyncToken, ...rest } = await getEvents(
    process.env.GOOGLE_CALENDAR_ID,
    doc?.syncToken
  );
  console.log(items, nextSyncToken, rest);

  const events = {};
  const exceptions = {};
  for (const item of items) {
    if (isException(item)) {
      exceptions[item.id] = item;
    } else {
      events[item.id] = item;
    }
  }

  await handleMeetings(events);
  await handleExceptions(exceptions);

  await mongoClient
    .db()
    .collection("gcalSyncTokens")
    .updateOne(
      { _id: "GCAL_SYNC_TOKEN" },
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

async function handleMeetings(events) {
  const eventIds = Object.keys(events);
  const meetings = await prisma.meeting.findMany({
    where: { gcal_event_id: { in: eventIds } },
  });

  // create a new Meeting if it wasn't found in the database
  const meetingsToCreate = new Set(eventIds);
  for (const meeting of meetings) {
    if (meetingsToCreate.has(meeting.gcal_event_id)) {
      meetingsToCreate.delete(meeting.gcal_event_id);
    }
  }

  meetingsToCreate.forEach((eventId) => handleCreateMeeting(events, eventId));

  for (const meeting of meetings) {
    const event = events[meeting.gcal_event_id];
    if (event.status === "cancelled") {
      await prisma.meeting.update({
        where: { gcal_event_id: event.id },
        data: { status: "CANCELLED" },
      });
      continue;
    }

    const update = createUpdate(event, meeting);

    if (Object.keys(update).length > 0) {
      await prisma.meeting.update({
        where: { gcal_event_id: event.id },
        data: update,
      });
    }
  }
}

function createUpdate(event, record) {
  const update: any = {};

  if (event.status.toUpperCase() !== record.status) {
    update.status = event.status.toUpperCase();
  }

  if (!dayjs(event.start.dateTime).isSame(record.start_time)) {
    update.start_time = event.start.dateTime;
  }

  if (!dayjs(event.end.dateTime).isSame(record.end_time)) {
    update.end_time = event.end.dateTime;
  }

  if (event.recurrence?.[0] !== record.rrule?.split("\n")[1]) {
    update.rrule = `DTSTART;TZID=America/Los_Angeles:${dayjs(
      event.start.dateTime
    )
      .tz("America/Los_Angeles")
      .format("YYYYMMDDTHHmmss")}\n${event.recurrence[0]}`;
  }

  if (event.summary !== record.title) {
    update.title = event.summary;
  }

  if (event.description !== record.description) {
    update.description = event.description;
  }

  return update;
}

async function handleExceptions(events) {
  const eventIds = Object.keys(events);
  const meetingExceptions = await prisma.meetingException.findMany({
    where: { gcal_event_id: { in: eventIds } },
  });

  // create a new MeetingException if it wasn't found in the database
  const meetingExceptionsToCreate = new Set(eventIds);
  for (const meetingException of meetingExceptions) {
    if (meetingExceptionsToCreate.has(meetingException.gcal_event_id)) {
      meetingExceptionsToCreate.delete(meetingException.gcal_event_id);
    }
  }

  meetingExceptionsToCreate.forEach((eventId) =>
    handleCreateException(events, eventId)
  );

  for (const record of meetingExceptions) {
    const event = events[record.gcal_event_id];
    if (event.status === "cancelled") {
      await prisma.meetingException.update({
        where: { gcal_event_id: event.id },
        data: { status: "CANCELLED" },
      });
      continue;
    }

    const update = createUpdate(event, record);

    if (Object.keys(update).length > 0) {
      await prisma.meetingException.update({
        where: { gcal_event_id: event.id },
        data: update,
      });
    }
  }
}

async function handleCreateMeeting(events, eventId) {
  const event = events[eventId];
  const meeting_id = Number(event.extendedProperties?.private?.vrms_meeting_id);
  if (!meeting_id) return;

  const meeting = await prisma.meeting.findUnique({
    where: {
      id: meeting_id,
    },
    // TODO: fetch participants and add them to the new meeting
  });

  if (!meeting) return;

  const newMeeting = await prisma.meeting.create({
    data: {
      created_by_id: meeting.created_by_id,
      end_time: new Date(event.end.dateTime),
      gcal_event_id: event.id,
      project_id: meeting.project_id,
      slack_channel_id: meeting.slack_channel_id,
      rrule: event.recurrence?.[0]
        ? `DTSTART;TZID=America/Los_Angeles:${dayjs(event.start.dateTime)
            .tz("America/Los_Angeles")
            .format("YYYYMMDDTHHmmss")}\n${event.recurrence[0]}`
        : null,
      start_time: new Date(event.start.dateTime),
      title: event.summary,
      type: "SYNCHRONOUS",
      description: event.description,
    },
  });

  await patchCalendarEvent(event.id, {
    extendedProperties: {
      private: {
        vrms_meeting_id: newMeeting.id,
        vrms_project_id: newMeeting.project_id,
      },
    },
  });
  // TODO: handle the Agenda checkin job
}

async function handleCreateException(exceptions, eventId) {
  const event = exceptions[eventId];
  const meeting_id = Number(event.extendedProperties?.private?.vrms_meeting_id);
  if (!meeting_id) return;

  const recurring_event = await prisma.meeting.findUnique({
    where: { id: meeting_id },
  });

  if (!recurring_event) return;

  const meetingException = await prisma.meetingException.create({
    data: {
      recurring_event_id: recurring_event.id,
      original_start_time: new Date(event.originalStartTime.dateTime),
      start_time: new Date(event.start.dateTime),
      end_time: new Date(event.end.dateTime),
      gcal_event_id: event.id,
      title: event.summary,
      description: event.description,
    },
  });
  // TODO: handle the Agenda checkin job
}

async function createWatchChannel() {
  const calendar = google.calendar({ version: "v3", auth: getAuth() });
  const { data } = await calendar.events.watch({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    requestBody: {
      id: Date.now(),
      type: "web_hook",
      token: require("crypto").randomBytes(32).toString("hex"),
      address: process.env.NGROK_URL // ngrok can be used in development
        ? `${process.env.NGROK_URL}/api/google/calendar/watch`
        : `${process.env.NEXTAUTH_URL}/api/google/calendar/watch`,
    },
  });
  return data;
}

async function stopWatchChannel(id, resourceId) {
  const calendar = google.calendar({ version: "v3", auth: getAuth() });
  const { data } = await calendar.channels.stop({
    requestBody: {
      id,
      resourceId,
    },
  });
  console.log(data);
  return data;
}

export async function init() {
  const mongoClient = await getMongoClient();
  const doc = await mongoClient
    .db()
    .collection("gcalWatchChannels")
    .findOne({ expiration: { $gt: Date.now() } });

  if (!doc) {
    const channel = await createWatchChannel();
    channel.expiration = Number(channel.expiration);
    await mongoClient.db().collection("gcalWatchChannels").insertOne(channel);
    // TODO: set up agenda job to refresh channel
  }

  syncMeetings();
}
