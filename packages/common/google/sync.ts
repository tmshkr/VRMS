import prisma from "common/prisma";
import { getMongoClient } from "common/mongo";
import { getEvents, getAuth } from "./index";
import dayjs from "common/dayjs";
const { google } = require("googleapis");
import { patchCalendarEvent } from "common/google";
import { getAgenda } from "common/agenda";
import { scheduleNextCheckin } from "common/events";
import { getSlug } from "common/slug";

export async function syncEvents(calendarId: string) {
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

async function handleEvents(gcalEvents) {
  const gcalEventIds = Object.keys(gcalEvents);
  if (gcalEventIds.length === 0) return;
  const events = await prisma.event.findMany({
    where: { gcal_event_id: { in: gcalEventIds } },
  });

  // create a new Meeting if it wasn't found in the database
  const toCreate = new Set(gcalEventIds);
  for (const record of events) {
    toCreate.delete(record.gcal_event_id);
  }

  toCreate.forEach((eventId) => handleCreateEvent(gcalEvents, eventId));

  for (const record of events) {
    const gcalEvent = gcalEvents[record.gcal_event_id];
    await prisma.event.update({
      where: { gcal_event_id: gcalEvent.id },
      data: createUpdate(gcalEvent),
    });

    scheduleNextCheckin(record.id);
  }
}

function generateRRuleFromEvent(gcalEvent) {
  return gcalEvent.recurrence?.[0]
    ? `DTSTART;TZID=${gcalEvent.start.timeZone}:${dayjs(
        gcalEvent.start.dateTime
      )
        .tz(gcalEvent.start.timeZone)
        .format("YYYYMMDDTHHmmss")}\n${gcalEvent.recurrence[0]}`
    : undefined;
}

function createUpdate(gcalEvent) {
  return {
    status: gcalEvent.status.toUpperCase(),
    start_time: gcalEvent.start?.dateTime,
    end_time: gcalEvent.end?.dateTime,
    rrule: generateRRuleFromEvent(gcalEvent),
    title: gcalEvent.summary,
    description: gcalEvent.description,
  };
}

async function handleExceptions(gcalEvents) {
  const gcalEventIds = Object.keys(gcalEvents);
  if (gcalEventIds.length === 0) return;
  const eventExceptions = await prisma.eventException.findMany({
    where: { gcal_event_id: { in: gcalEventIds } },
  });

  // create a new EventException if it wasn't found in the database
  const toCreate = new Set(gcalEventIds);
  for (const record of eventExceptions) {
    toCreate.delete(record.gcal_event_id);
  }

  toCreate.forEach((eventId) =>
    handleCreateEventException(gcalEvents, eventId)
  );

  for (const record of eventExceptions) {
    const gcalEvent = gcalEvents[record.gcal_event_id];
    await prisma.eventException.update({
      where: { gcal_event_id: gcalEvent.id },
      data: createUpdate(gcalEvent),
    });

    scheduleNextCheckin(record.event_id);
  }
}

async function handleCreateEvent(gcalEvents, gcalEventId) {
  const gcalEvent = gcalEvents[gcalEventId];
  const event_id = BigInt(
    gcalEvent.extendedProperties?.private?.meetbot_event_id
  );

  if (!event_id) return;

  const oldEvent = await prisma.event.findUnique({
    where: {
      id: event_id,
    },
    include: {
      participants: {
        where: { event_time: new Date(0) },
        select: {
          user_id: true,
          event_time: true,
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

  if (!oldEvent) {
    console.log("event not found", { event_id });
    return;
  }

  const newEvent = await prisma.event.create({
    data: {
      created_by_id: oldEvent.created_by_id,
      end_time: new Date(gcalEvent.end.dateTime),
      gcal_event_id: gcalEvent.id,
      project_id: oldEvent.project_id,
      slack_channel_id: oldEvent.slack_channel_id,
      slack_team_id: oldEvent.slack_team_id,
      rrule: generateRRuleFromEvent(gcalEvent),
      start_time: new Date(gcalEvent.start.dateTime),
      title: gcalEvent.summary,
      description: gcalEvent.description,
      slug: getSlug(gcalEvent.summary),
      participants: { create: oldEvent.participants },
    },
  });

  await patchCalendarEvent(gcalEvent.id, oldEvent.project.gcal_calendar_id, {
    extendedProperties: {
      private: {
        meetbot_event_id: newEvent.id.toString(),
        meetbot_project_id: newEvent.project_id.toString(),
      },
    },
  });

  scheduleNextCheckin(newEvent.id, newEvent.start_time);
}

async function handleCreateEventException(gcalExceptions, gcalEventId) {
  const gcalEvent = gcalExceptions[gcalEventId];
  const record = await prisma.event.findUnique({
    where: { gcal_event_id: gcalEvent.recurringEventId },
  });

  if (!record) {
    console.log("event not found", {
      gcal_event_id: gcalEvent.recurringEventId,
    });
    return;
  }

  const row = {
    event_id: record.id,
    original_start_time: gcalEvent.originalStartTime.dateTime,
    start_time: gcalEvent.start?.dateTime,
    end_time: gcalEvent.end?.dateTime,
    gcal_event_id: gcalEvent.id,
    title: gcalEvent.summary,
    description: gcalEvent.description,
    status: gcalEvent.status.toUpperCase(),
  };

  await prisma.eventException.upsert({
    where: {
      event_id_original_start_time: {
        event_id: record.id,
        original_start_time: new Date(gcalEvent.originalStartTime.dateTime),
      },
    },
    create: row,
    update: row,
  });

  scheduleNextCheckin(record.id);
}

export async function createNotificationChannel(calendarId: string) {
  const calendar = google.calendar({ version: "v3", auth: getAuth() });
  const webhookURL = process.env.NGROK_URL // use ngrok in development
    ? `${process.env.NGROK_URL}/api/google/calendar/watch`
    : `${process.env.NEXTAUTH_URL}/api/google/calendar/watch`;

  const { data: listData } = await await calendar.events.list({
    calendarId,
    maxResults: 1,
  });

  if (listData.accessRole !== "writer") {
    throw new Error("Must have write access");
  }

  const { data } = await calendar.events.watch({
    calendarId,
    requestBody: {
      id: require("crypto").randomUUID(),
      type: "web_hook",
      address: webhookURL,
    },
  });

  const channel = {
    ...data,
    _id: data.id,
    address: webhookURL,
    calendarId,
    expiration: Number(data.expiration),
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
    { calendarId, id: channel.id }
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
