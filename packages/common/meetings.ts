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

  // Find the earliest upcoming exception that is CONFIRMED,
  // so that we can compare it to the nextInstance
  let earliestConfirmedException = maxDate;
  const exceptionsByInstance = meeting.exceptions.reduce((acc, cur) => {
    acc[cur.instance.toISOString()] = cur;

    if (
      cur.status === "CONFIRMED" &&
      cur.start_time &&
      start < cur.start_time &&
      cur.start_time < earliestConfirmedException
    ) {
      earliestConfirmedException = cur.start_time;
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
    }

    return true;
  });

  const nextInstance = instances.pop();

  return nextInstance && nextInstance < earliestConfirmedException
    ? nextInstance
    : earliestConfirmedException < maxDate
    ? earliestConfirmedException
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
      include: { exceptions: true },
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
