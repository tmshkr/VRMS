import { getMongoClient } from "common/mongo";
import { getEvents, getAuth } from "./index";
const { google } = require("googleapis");
import { getAgenda } from "common/agenda";
import { handleEvents, handleExceptions } from "./handlers";

export async function syncEvents(calendarId: string) {
  const mongoClient = await getMongoClient();
  const doc = await mongoClient
    .db()
    .collection("gcalSyncTokens")
    .findOne({ _id: calendarId });

  const { items, nextSyncToken } = await getEvents(calendarId, doc?.syncToken);
  console.log(items);

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
    expiration: new Date(Number(data.expiration)),
    createdAt: new Date(),
  };

  const mongoClient = await getMongoClient();
  await mongoClient
    .db()
    .collection("gcalNotificationChannels")
    .insertOne(channel);

  console.log("Google Calendar notification channel created");

  return channel;
}

export async function stopNotificationChannel(id, resourceId) {
  const calendar = google.calendar({ version: "v3", auth: getAuth() });
  await calendar.channels
    .stop({
      requestBody: {
        id,
        resourceId,
      },
    })
    .catch(console.log);

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
    .findOne({ calendarId, expiration: { $gt: new Date() } });

  if (!doc) {
    const channel = await createNotificationChannel(calendarId);
    const agenda = await getAgenda();
    agenda.schedule(channel.expiration, "renewGCalNotificationChannel", {
      id: channel.id,
    });
  }
  console.log("Google Calendar sync initialized");
}
