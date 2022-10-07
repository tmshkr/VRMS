import { rrulestr } from "rrule";
import { Meeting, MeetingException } from "@prisma/client";
import { getAgenda } from "common/agenda";
import prisma from "common/prisma";

/*
  Returns the next instance and startTime of a meeting,
  or undefined if there are no more occurrences.
*/
export function getNextOccurrence(
  meeting: Meeting & { exceptions: MeetingException[] },
  start = new Date()
): { instance: Date | undefined; startTime: Date | undefined } {
  if (!meeting.rrule) {
    return start < meeting.start_time
      ? { instance: meeting.start_time, startTime: meeting.start_time }
      : { instance: undefined, startTime: undefined };
  }

  const rule = rrulestr(meeting.rrule);
  const maxDate = new Date(8640000000000000);
  const exceptionByInstance = {};

  // Find the earliest upcoming exception that is CONFIRMED,
  // so that we can compare it to the nextInstance
  let earliestException = { start_time: maxDate, instance: maxDate };
  for (const e of meeting.exceptions) {
    exceptionByInstance[e.instance.toISOString()] = e;
    if (
      e.status === "CONFIRMED" &&
      e.start_time &&
      start < e.start_time &&
      e.start_time < earliestException.start_time
    ) {
      earliestException = { start_time: e.start_time, instance: e.instance };
    }
  }

  let found = false;
  const instances = rule.between(start, maxDate, false, (date, i) => {
    // if `nextInstance` is found, return false to stop the iteration
    if (found) return false;

    // find the next instance that is not cancelled or tentative
    const key = date.toISOString();
    if (
      !exceptionByInstance[key] ||
      exceptionByInstance[key].status === "CONFIRMED"
    ) {
      found = true;
    }

    return true;
  });

  const nextByRule = instances.pop();
  if (!nextByRule) return { instance: undefined, startTime: undefined };

  const nextInstance = exceptionByInstance[nextByRule.toISOString()]
    ? exceptionByInstance[nextByRule.toISOString()].start_time
    : nextByRule;

  return nextInstance && nextInstance < earliestException.start_time
    ? { instance: nextByRule, startTime: nextInstance }
    : earliestException.start_time < maxDate
    ? {
        instance: earliestException.instance,
        startTime: earliestException.start_time,
      }
    : { instance: undefined, startTime: undefined };
}

export async function scheduleNextCheckin(
  meeting_id: bigint,
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
    nextRunAt = getNextOccurrence(meeting).startTime;
  }

  const agenda = await getAgenda();
  const [job] = await agenda.jobs(
    {
      name: "sendMeetingCheckin",
      data: { meeting_id: meeting_id.toString() },
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
        meeting_id: meeting_id.toString(),
      });
      console.log(`Scheduled job to run at ${nextRunAt}`);
    }
  } else if (job) {
    await job.remove();
    console.log("Removed job");
  }
}
