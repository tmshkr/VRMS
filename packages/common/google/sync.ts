require("dotenv").config({ path: "../../.env" });

import { PrismaClient } from "@prisma/client";
const prisma: PrismaClient = new PrismaClient();
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
  for (const item of items) {
    events[item.id] = item;
  }

  await handleUpdate(events);

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

async function handleUpdate(events) {
  const eventIds = Object.keys(events);
  const records = await prisma.meeting.findMany({
    where: { gcal_event_id: { in: eventIds } },
  });

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
    const meeting_id = Number(
      event.extendedProperties?.private?.vrms_meeting_id
    );
    if (meeting_id) {
      // get original meeting
      const recurring_event = await prisma.meeting.findUnique({
        where: {
          id: meeting_id,
        },
        // TODO: fetch participants and add them to the new meeting
      });

      // create exception or new meeting
      if (recurring_event) {
        const newMeeting = await prisma.meeting.create({
          data: {
            created_by_id: recurring_event.created_by_id,
            end_time: new Date(event.end.dateTime),
            gcal_event_id: event.id,
            project_id: recurring_event.project_id,
            slack_channel_id: recurring_event.slack_channel_id,
            recurring_event_id: event.recurringEventId
              ? recurring_event.id
              : null,
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
      }

      // TODO: handle the Agenda checkin job
    }
  });

  for (const record of records) {
    const event = events[record.gcal_event_id];
    if (event.status === "cancelled") {
      await prisma.meeting.update({
        where: { gcal_event_id: event.id },
        data: { status: "CANCELLED" },
      });
      continue;
    }

    const eventStartTime = dayjs(event.start.dateTime);
    const eventEndTime = dayjs(event.end.dateTime);

    const meetingStartTime = dayjs(record.start_time);
    const meetingEndTime = dayjs(record.end_time);

    const update: any = {};

    if (event.status.toUpperCase() !== record.status) {
      update.status = event.status.toUpperCase();
    }

    if (!eventStartTime.isSame(meetingStartTime)) {
      update.start_time = eventStartTime.toDate();
    }

    if (!eventEndTime.isSame(meetingEndTime)) {
      update.end_time = eventEndTime.toDate();
    }

    if (event.recurrence?.[0] !== record.rrule?.split("\n")[1]) {
      update.rrule = `DTSTART;TZID=America/Los_Angeles:${eventStartTime
        .tz("America/Los_Angeles")
        .format("YYYYMMDDTHHmmss")}\n${event.recurrence[0]}`;
    }

    if (event.summary !== record.title) {
      update.title = event.summary;
    }

    if (event.description !== record.description) {
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

// init();
