require("dotenv").config({ path: "../../.env" });

import { PrismaClient } from "@prisma/client";
const prisma: PrismaClient = new PrismaClient();
import { getMongoClient } from "common/mongo";
import { getEvents, getAuth } from "./index";
import dayjs from "common/dayjs";
const { google } = require("googleapis");

enum EventType {
  meeting = "meeting",
  meetingException = "meetingException",
}

export async function syncMeetings() {
  const mongoClient = await getMongoClient();
  const doc = await mongoClient
    .db()
    .collection("config")
    .findOne({ _id: "GCAL_SYNC_TOKEN" });

  const { items, nextSyncToken } = await getEvents(
    process.env.GOOGLE_CALENDAR_ID,
    doc?.syncToken
  );

  console.log(items);

  const events = {};
  const exceptions = {};

  for (const item of items) {
    if (/_/.test(item.id)) {
      exceptions[item.id] = item;
    } else {
      events[item.id] = item;
    }
  }
  console.log({ events, exceptions });

  handleUpdate(EventType.meeting, events);
  handleUpdate(EventType.meetingException, exceptions);

  await mongoClient
    .db()
    .collection("config")
    .updateOne(
      { _id: "GCAL_SYNC_TOKEN" },
      {
        $set: { syncToken: nextSyncToken, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
}

async function handleUpdate(eventType: EventType, events) {
  const eventIds = Object.keys(events);
  let records;
  if (eventType === EventType.meeting) {
    records = await prisma.meeting.findMany({
      where: { gcal_event_id: { in: eventIds } },
    });
  } else if (eventType === EventType.meetingException) {
    records = await prisma.meetingException.findMany({
      where: { gcal_event_id: { in: eventIds } },
    });
  }

  // find the events that weren't found in the database,
  // so that we can create them, as long as they have a vrms_meeting_id
  const eventsToCreate = new Set(eventIds);
  for (const meeting of records) {
    if (eventsToCreate.has(meeting.gcal_event_id)) {
      eventsToCreate.delete(meeting.gcal_event_id);
    }
  }

  eventsToCreate.forEach(async (eventId) => {
    const event = events[eventId];
    const meeting_id = Number(event.extendedProperties.private.vrms_meeting_id);
    if (meeting_id) {
      if (eventType === EventType.meeting) {
        // await prisma.meeting.create({
        //   data: {å
        //     gcal_event_id: String(event.id),
        //   },
        // });
      } else if (eventType === EventType.meetingException) {
        await prisma.meetingException.create({
          data: {
            instance: new Date(event.originalStartTime.dateTime),
            meeting_id,
            gcal_event_id: String(event.id),
            start_date: new Date(event.start.dateTime),
            title: event.summary,
            description: event.description,
          },
        });
      }
    }
  });

  for (const record of records) {
    const event = events[record.gcal_event_id];

    const eventStartTime = dayjs(event.start.dateTime);
    const meetingStartTime = dayjs(record.start_date);

    const update: any = {};

    if (event.status.toUpperCase() !== record.status) {
      update.status = event.status.toUpperCase();
    }

    if (!eventStartTime.isSame(meetingStartTime)) {
      update.start_date = eventStartTime.toDate();
      if (event.recurrence && event.recurrence[0]) {
        update.rrule = `DTSTART;TZID=America/Los_Angeles:${eventStartTime
          .tz("America/Los_Angeles")
          .format("YYYYMMDDTHHmmss")}\n${event.recurrence[0]}`;
      }
    }

    if (event.summary !== record.title) {
      update.title = event.summary;
    }

    if (event.description !== record.description) {
      update.description = event.description;
    }

    if (Object.keys(update).length > 0) {
      if (eventType === EventType.meeting) {
        await prisma.meeting.update({
          where: { gcal_event_id: event.id },
          data: update,
        });
      } else if (eventType === EventType.meetingException) {
        await prisma.meetingException.update({
          where: { gcal_event_id: event.id },
          data: update,
        });
      }
    }
  }
}

async function createWatchChannel() {
  const calendar = google.calendar({ version: "v3", auth: getAuth() });
  const { data } = await calendar.events.watch({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    requestBody: {
      id: Date.now(),
      type: "web_hook",
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
