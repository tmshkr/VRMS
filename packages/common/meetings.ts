import { rrulestr } from "rrule";
import { Meeting, MeetingException } from "@prisma/client";

export function getNextOccurrence(
  meeting: Meeting & { exceptions: MeetingException[] }
): Date | null {
  const now = new Date();
  if (!meeting.rrule) {
    return now < meeting.start_time ? meeting.start_time : null;
  }

  const rule = rrulestr(meeting.rrule);
  const maxDate = new Date(8640000000000000);

  const [nextInstance] = rule.between(
    now,
    maxDate,
    false,
    (date, i) => i === 0
  );

  const exception = meeting.exceptions.find(
    ({ start_time }) => now < start_time && start_time < nextInstance
  );

  return exception ? exception.start_time : nextInstance;
}
