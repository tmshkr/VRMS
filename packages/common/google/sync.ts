require("dotenv").config({ path: "../../.env" });

import { PrismaClient } from "@prisma/client";
const prisma: PrismaClient = new PrismaClient();
import { getMongoClient } from "common/mongo";
import { getEvents, getAuth } from "./index";
import dayjs from "common/dayjs";
const { google } = require("googleapis");

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

  const events = items.reduce((acc, cur) => {
    acc[cur.id] = cur;
    return acc;
  }, {});

  const meetings = await prisma.meeting.findMany({
    where: { gcal_event_id: { in: Object.keys(events) } },
  });

  for (const meeting of meetings) {
    const event = events[meeting.gcal_event_id];

    const eventStartTime = dayjs(event.start.dateTime);
    const meetingStartTime = dayjs(meeting.start_date);

    const update: any = {};

    if (event.status.toUpperCase() !== meeting.status) {
      console.log(`updating meeting ${meeting.id} start_date`);
      update.status = event.status.toUpperCase();
    }

    if (!eventStartTime.isSame(meetingStartTime)) {
      console.log(`updating meeting ${meeting.id} start_date`);
      update.start_date = eventStartTime.toDate();
      if (event.recurrence[0]) {
        update.rrule = `DTSTART;TZID=America/Los_Angeles:${eventStartTime
          .tz("America/Los_Angeles")
          .format("YYYYMMDDTHHmmss")}\n${event.recurrence[0]}`;
      }
    }

    if (event.summary !== meeting.title) {
      console.log(`updating meeting ${meeting.id} title`);
      update.title = event.summary;
    }

    if (event.description !== meeting.description) {
      console.log(`updating meeting ${meeting.id} description`);
      update.description = event.description;
    }

    if (Object.keys(update).length > 0) {
      await prisma.meeting.update({
        where: { gcal_event_id: event.id },
        data: update,
      });
    }
  }
}

// syncMeetings();
// TODO: set up watch channel

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
