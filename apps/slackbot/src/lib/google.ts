const { google } = require("googleapis");
const client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);
client.setCredentials(JSON.parse(process.env.GOOGLE_TOKEN));

export async function createCalendarEvent(event) {
  const calendar = google.calendar({ version: "v3", auth: client });
  const { data } = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    conferenceDataVersion: 1,
    resource: event,
  });
  return data;
}
