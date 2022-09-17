const { google } = require("googleapis");
import dayjs from "./dayjs";
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON || ""),
  scopes: ["https://www.googleapis.com/auth/calendar.events"],
});

export async function createCalendarEvent(event) {
  const calendar = google.calendar({ version: "v3", auth });
  const { data } = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    resource: event,
  });
  return data;
}

export function generateEventInstanceId(gcal_event_id, nextMeeting) {
  return Buffer.from(
    `${gcal_event_id}_${dayjs(nextMeeting)
      .utc()
      .format("YYYYMMDDTHHmmss[Z]")} ${process.env.GOOGLE_CALENDAR_ID}`
  )
    .toString("base64")
    .replace(/=/g, "");
}
