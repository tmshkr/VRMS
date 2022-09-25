import { rrulestr } from "rrule";
import { Meeting, MeetingException } from "@prisma/client";
/*
  Returns the next occurrence of a meeting, or undefined if there are no more occurrences.
  MeetingException[] orderBy: { start_time: "asc" }
*/
export function getNextOccurrence(
  meeting: Meeting & { exceptions: MeetingException[] },
  start = new Date()
): Date | undefined {
  if (!meeting.rrule) {
    return start < meeting.start_time ? meeting.start_time : undefined;
  }

  const rule = rrulestr(meeting.rrule);
  const maxDate = new Date(8640000000000000);
  const exceptionsByInstance = meeting.exceptions.reduce((acc, cur) => {
    acc[cur.instance.toISOString()] = cur;
    return acc;
  }, {});

  let found = false;
  const instances = rule.between(start, maxDate, false, (date, i) => {
    if (found) return false;

    const key = date.toISOString();
    if (!(exceptionsByInstance[key]?.status === "CANCELLED")) {
      found = true;
    }

    return true;
  });

  const nextInstance = instances?.pop();

  const exception = meeting.exceptions.find((e) => {
    if (!e.start_time) return false;
    if (e.status !== "CONFIRMED") return false;

    return (
      start < e.start_time &&
      (!nextInstance ||
        e.start_time < nextInstance ||
        e.instance.valueOf() === nextInstance.valueOf())
    );
  });

  return exception?.start_time ? exception.start_time : nextInstance;
}
