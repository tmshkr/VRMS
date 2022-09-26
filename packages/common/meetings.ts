import { rrulestr } from "rrule";
import { Meeting, MeetingException } from "@prisma/client";
import { getAgenda } from "common/agenda";
import prisma from "common/prisma";

/*
  Returns the next occurrence of a meeting, or undefined if there are no more occurrences.
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

  let earliestConfirmedException: any = { start_time: maxDate };
  const exceptionsByInstance = meeting.exceptions.reduce((acc, cur) => {
    acc[cur.instance.toISOString()] = cur;

    if (
      cur.status === "CONFIRMED" &&
      cur.start_time &&
      start < cur.start_time &&
      cur.start_time < earliestConfirmedException.start_time
    ) {
      earliestConfirmedException = cur;
    }

    return acc;
  }, {});

  let found = false;
  const instances = rule.between(start, maxDate, false, (date, i) => {
    // if `nextInstance` is found, return false to stop the iteration
    if (found) return false;

    // find the next instance that is not cancelled or tentative
    const key = date.toISOString();
    if (
      !exceptionsByInstance[key] ||
      exceptionsByInstance[key].status === "CONFIRMED"
    ) {
      found = true;
      return true;
    }

    return true;
  });

  const nextInstance = instances?.pop();

  if (nextInstance) {
    const exception = exceptionsByInstance[nextInstance.toISOString()];
    if (exception) {
      return exception.start_time < earliestConfirmedException.start_time
        ? exception.start_time
        : earliestConfirmedException.start_time;
    } else return nextInstance;
  }

  return earliestConfirmedException.start_time < maxDate
    ? earliestConfirmedException.start_time
    : undefined;
}

export async function scheduleNextCheckin(
  meeting_id: number,
  sendAt?: Date // provide the Date if known
) {
  let nextRunAt;
  if (sendAt) {
    nextRunAt = sendAt;
  } else {
    const meeting = await prisma.meeting.findUniqueOrThrow({
      where: { id: meeting_id },
      include: {
        exceptions: {
          orderBy: { start_time: "asc" },
        },
      },
    });
    nextRunAt = getNextOccurrence(meeting);
  }

  const agenda = await getAgenda();
  const [job] = await agenda.jobs(
    {
      name: "sendMeetingCheckin",
      data: { meeting_id },
    },
    undefined,
    1
  );

  if (nextRunAt) {
    if (job) {
      job.schedule(nextRunAt);
      await job.save();
      console.log(`Updated job to run at ${nextRunAt}`);
    } else {
      await agenda.schedule(nextRunAt, "sendMeetingCheckin", {
        meeting_id,
      });
      console.log(`Scheduled job to run at ${nextRunAt}`);
    }
  } else if (job) {
    await job.remove();
    console.log("Removed job");
  }
}
