const { google } = require("googleapis");
import dayjs from "common/dayjs";

export function getAuth() {
  const credentials = JSON.parse(
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON || ""
  );
  credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/calendar.events"],
  });
  return auth;
}

export async function createCalendarEvent(event, calendarId: string) {
  const calendar = google.calendar({ version: "v3", auth: getAuth() });
  const { data } = await calendar.events.insert({
    calendarId,
    resource: event,
  });
  return data;
}

export async function patchCalendarEvent(
  eventId: string,
  calendarId: string,
  requestBody
) {
  const calendar = google.calendar({ version: "v3", auth: getAuth() });
  const { data } = await calendar.events.patch({
    eventId,
    calendarId,
    requestBody,
  });
  return data;
}

export function generateEventLink(
  gcalEventId: string,
  eventInstance: Date | undefined,
  calendarId: string
) {
  if (!eventInstance) return;

  const gcalEventLink = new URL("https://www.google.com/calendar/event");
  gcalEventLink.searchParams.set(
    "eid",
    Buffer.from(
      `${gcalEventId}_${dayjs(eventInstance)
        .utc()
        .format("YYYYMMDDTHHmmss[Z]")} ${calendarId}`
    )
      .toString("base64")
      .replace(/=/g, "")
  );

  return gcalEventLink.toString();
}

export async function getEvents(
  calendarId: string,
  syncToken?: string,
  pageToken?: string,
  items: any = []
) {
  const calendar = google.calendar({ version: "v3", auth: getAuth() });
  try {
    var { data } = await calendar.events.list({
      calendarId,
      singleEvents: false,
      syncToken,
      pageToken,
    });
  } catch (err: any) {
    if (err.response?.status === 410) {
      console.log("sync token expired, resetting");
      return getEvents(calendarId);
    } else {
      throw new Error(err);
    }
  }

  if (data.accessRole !== "writer") {
    throw new Error("Must have write access");
  }

  for (const event of data.items) {
    if (event.visibility !== "private") {
      items.push(event);
    }
  }

  data.items = items;

  return data.nextPageToken
    ? getEvents(calendarId, syncToken, data.nextPageToken, items)
    : data;
}
