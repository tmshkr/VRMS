import dayjs from "./dayjs";

/*
Returns the given date as if it was UTC, replacing any timezone offset.
Workaround for https://github.com/jakubroztocil/rrule/issues/501
*/
export function getPseudoUTC(date: dayjs.Dayjs): Date {
  return new Date(date.format().slice(0, -6) + "Z");
}
