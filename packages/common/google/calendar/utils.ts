import dayjs from "common/dayjs";

export function generateRRuleFromEvent(gcalEvent) {
  return gcalEvent.recurrence?.[0]
    ? `DTSTART;TZID=${gcalEvent.start.timeZone}:${dayjs(
        gcalEvent.start.dateTime || gcalEvent.start.date
      )
        .tz(gcalEvent.start.timeZone)
        .format("YYYYMMDDTHHmmss")}\n${gcalEvent.recurrence[0]}`
    : undefined;
}

export function createUpdate(gcalEvent) {
  return {
    status: gcalEvent.status.toUpperCase(),
    start_time: gcalEvent.start?.dateTime || gcalEvent.start?.date,
    end_time: gcalEvent.end?.dateTime || gcalEvent.end?.date,
    rrule: generateRRuleFromEvent(gcalEvent),
    title: gcalEvent.summary,
    description: gcalEvent.description,
  };
}
