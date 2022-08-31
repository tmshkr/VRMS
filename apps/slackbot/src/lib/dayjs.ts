import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import weekday from "dayjs/plugin/weekday";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("America/Los_Angeles");
dayjs.extend(weekday);
dayjs.extend(isoWeek);

export function findOccurrenceOfWeekday(date: dayjs.Dayjs) {
  let n = 0;
  const month = date.month();
  while (date.month() === month) {
    date = date.subtract(1, "week");
    n++;
  }
  return n > 4 ? -1 : n;
}

export default dayjs;
