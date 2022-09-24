import { rrulestr } from "rrule";
import { Meeting, MeetingException } from "@prisma/client";

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
    ({ instance }) => instance.valueOf() === nextInstance.valueOf()
  );

  if (!exception) {
    return nextInstance;
  }

  if (start < exception.start_time) {
    return exception.start_time;
  }

  return nextInstance ? getNextOccurrence(meeting, nextInstance) : undefined;
}
