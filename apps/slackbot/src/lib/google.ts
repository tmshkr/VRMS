const { google } = require("googleapis");
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON || ""),
  scopes: ["https://www.googleapis.com/auth/calendar.events"],
});

export async function createCalendarEvent(event) {
  const calendar = google.calendar({ version: "v3", auth });
  const { data } = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    conferenceDataVersion: 1,
    resource: event,
  });
  return data;
}
