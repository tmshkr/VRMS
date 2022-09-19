const { google } = require("googleapis");
import dayjs from "./dayjs";

function getAuth() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON || ""),
    scopes: ["https://www.googleapis.com/auth/calendar.events"],
  });
  return auth;
}

export async function createCalendarEvent(event) {
  const calendar = google.calendar({ version: "v3", auth: getAuth() });
  const { data } = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    resource: event,
  });
  return data;
}

export function generateEventInstanceId(gcalEventId, startDate) {
  return Buffer.from(
    `${gcalEventId}_${dayjs(startDate).utc().format("YYYYMMDDTHHmmss[Z]")} ${
      process.env.GOOGLE_CALENDAR_ID
    }`
  )
    .toString("base64")
    .replace(/=/g, "");
}

export function generateEventLink(gcalEventId, startDate) {
  const gcalEventLink = new URL("https://www.google.com/calendar/event");
  gcalEventLink.searchParams.set(
    "eid",
    generateEventInstanceId(gcalEventId, startDate)
  );

  return gcalEventLink.toString();
}
