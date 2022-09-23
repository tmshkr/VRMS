import { rrulestr } from "rrule";
import { Meeting, MeetingException } from "@prisma/client";

export function getNextOccurrence(
  meeting: Meeting & { exceptions: MeetingException[] }
): Date | null {
  console.log(meeting);
  if (!meeting.rrule) {
    return meeting.start_time > new Date() ? meeting.start_time : null;
  }

  const rule = rrulestr(meeting.rrule);
  const maxDate = new Date(8640000000000000);

  const [nextInstance] = rule.between(
    new Date(),
    maxDate,
    false,
    (date, i) => i === 0
  );

  const exception = meeting.exceptions.find(
    ({ instance }) => nextInstance.valueOf() === instance.valueOf()
  );

  return exception ? exception.start_time : nextInstance;
}
