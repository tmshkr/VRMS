import { rrulestr } from "rrule";
import { Event, EventException } from "@prisma/client";
import { getAgenda } from "common/agenda";
import prisma from "common/prisma";
import dayjs from "dayjs";

/*
  Returns the next instance and startTime of an event,
  or undefined if there are no more occurrences.
*/
export function getNextOccurrence(
  event: Event & { exceptions: EventException[] },
  start = new Date()
): { originalStartTime: Date | undefined; startTime: Date | undefined } {
  if (!event.recurrence) {
    return event.start_time && start < event.start_time
      ? {
          originalStartTime: event.start_time,
          startTime: event.all_day
            ? getAllDayStartTime(event.start_time, event.timezone)
            : event.start_time,
        }
      : { originalStartTime: undefined, startTime: undefined };
  }

  const rule = rrulestr(
    `DTSTART;TZID=${event.timezone}:${dayjs(event.start_time)
      .tz(event.timezone)
      .format("YYYYMMDDTHHmmss")}\n${event.recurrence[0]}`
  );
  const maxDate = new Date(8640000000000000);
  const exceptionsByOriginalStartTime = {};

  // Find the earliest upcoming exception that is CONFIRMED,
  // so that we can compare it to the nextInstance
  let earliestException = { startTime: maxDate, originalStartTime: maxDate };
  for (const e of event.exceptions) {
    if (e.all_day && e.start_time) {
      e.start_time = getAllDayStartTime(e.start_time, event.timezone);
    }
    exceptionsByOriginalStartTime[e.original_start_time.toISOString()] = e;

    if (
      e.status === "CONFIRMED" &&
      e.start_time &&
      start < e.start_time &&
      e.start_time < earliestException.startTime
    ) {
      earliestException = {
        startTime: e.start_time,
        originalStartTime: e.original_start_time,
      };
    }
  }

  let found = false;
  const instances = rule.between(start, maxDate, false, (date, i) => {
    // if `nextInstance` is found, return false to stop the iteration
    if (found) return false;

    // find the next instance that is not cancelled or tentative
    const key = date.toISOString();
    if (
      !exceptionsByOriginalStartTime[key] ||
      exceptionsByOriginalStartTime[key].status === "CONFIRMED"
    ) {
      found = true;
    }

    return true;
  });

  const nextByRule = instances.pop();
  if (!nextByRule)
    return { originalStartTime: undefined, startTime: undefined };

  const nextInstance = exceptionsByOriginalStartTime[nextByRule.toISOString()]
    ? exceptionsByOriginalStartTime[nextByRule.toISOString()].start_time
    : event.all_day
    ? getAllDayStartTime(nextByRule, event.timezone)
    : nextByRule;

  return nextInstance && nextInstance < earliestException.startTime
    ? { originalStartTime: nextByRule, startTime: nextInstance }
    : earliestException.startTime < maxDate
    ? {
        originalStartTime: earliestException.originalStartTime,
        startTime: earliestException.startTime,
      }
    : { originalStartTime: undefined, startTime: undefined };
}

export async function scheduleNextCheckin(
  event_id: bigint,
  sendAt?: Date // provide the Date if known
) {
  let nextRunAt;
  if (sendAt) {
    nextRunAt = sendAt;
  } else {
    const event = await prisma.event.findUniqueOrThrow({
      where: { id: event_id },
      include: { exceptions: true },
    });
    nextRunAt = getNextOccurrence(event).startTime;
  }

  const agenda = await getAgenda();
  const [job] = await agenda.jobs(
    {
      name: "sendMeetingCheckin",
      data: { event_id: event_id.toString() },
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
        event_id: event_id.toString(),
      });
      console.log(`Scheduled job to run at ${nextRunAt}`);
    }
  } else if (job) {
    await job.remove();
    console.log("Removed job");
  }
}

function getAllDayStartTime(date: Date, timezone: string) {
  return dayjs.tz(dayjs(date).format("YYYY-MM-DDT09:mm:ss"), timezone).toDate();
}
