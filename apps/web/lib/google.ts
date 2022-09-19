import dayjs from "common/dayjs";
export function generateBrowserEventInstanceId(gcal_event_id, nextMeeting) {
  return btoa(
    `${gcal_event_id}_${dayjs(nextMeeting)
      .utc()
      .format("YYYYMMDDTHHmmss[Z]")} ${process.env.GOOGLE_CALENDAR_ID}`
  ).replace(/=/g, "");
}
