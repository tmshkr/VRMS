import { rrulestr } from "rrule";
import { Meeting, MeetingException } from "@prisma/client";
/*
  Returns the next occurrence of a meeting, or undefined if there are no more occurrences.
  MeetingException[] where: { status: "CONFIRMED" },
                     orderBy: { start_time: "asc" }
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

  const [nextInstance] = rule.between(
    start,
    maxDate,
    false,
    (date, i) => i === 0
  );

  const exception = meeting.exceptions.find(
    (e) =>
      start < e.start_time &&
      (!nextInstance ||
        e.start_time < nextInstance ||
        e.instance.valueOf() === nextInstance.valueOf())
  );

  return exception ? exception.start_time : nextInstance;
}
