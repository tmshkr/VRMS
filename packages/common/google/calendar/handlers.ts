import prisma from "common/prisma";
import { patchCalendarEvent } from "common/google/calendar";
import { scheduleNextCheckin } from "common/events";
import { getSlug } from "common/slug";
import { createUpdate, generateRRuleFromEvent } from "./utils";

export async function handleEvents(gcalEvents) {
  const gcalEventIds = Object.keys(gcalEvents);
  if (gcalEventIds.length === 0) return;
  const events = await prisma.event.findMany({
    where: { gcal_event_id: { in: gcalEventIds } },
  });

  // create a new Meeting if it wasn't found in the database
  const toCreate = new Set(gcalEventIds);
  for (const record of events) {
    toCreate.delete(record.gcal_event_id);
  }

  toCreate.forEach((eventId) => handleCreateEvent(gcalEvents, eventId));

  for (const record of events) {
    const gcalEvent = gcalEvents[record.gcal_event_id];
    await prisma.event.update({
      where: { gcal_event_id: gcalEvent.id },
      data: createUpdate(gcalEvent),
    });

    scheduleNextCheckin(record.id);
  }
}

export async function handleExceptions(gcalEvents) {
  const gcalEventIds = Object.keys(gcalEvents);
  if (gcalEventIds.length === 0) return;
  const eventExceptions = await prisma.eventException.findMany({
    where: { gcal_event_id: { in: gcalEventIds } },
  });

  // create a new EventException if it wasn't found in the database
  const toCreate = new Set(gcalEventIds);
  for (const record of eventExceptions) {
    toCreate.delete(record.gcal_event_id);
  }

  toCreate.forEach((eventId) =>
    handleCreateEventException(gcalEvents, eventId)
  );

  for (const record of eventExceptions) {
    const gcalEvent = gcalEvents[record.gcal_event_id];
    await prisma.eventException.update({
      where: { gcal_event_id: gcalEvent.id },
      data: createUpdate(gcalEvent),
    });

    scheduleNextCheckin(record.event_id);
  }
}

export async function handleCreateEvent(gcalEvents, gcalEventId) {
  const gcalEvent = gcalEvents[gcalEventId];
  const event_id = BigInt(
    gcalEvent.extendedProperties?.private?.meetbot_event_id
  );

  if (!event_id) return;

  const oldEvent = await prisma.event.findUnique({
    where: {
      id: event_id,
    },
    include: {
      participants: {
        where: { event_time: new Date(0) },
        select: {
          user_id: true,
          event_time: true,
          added_by_id: true,
          is_active: true,
        },
      },
      project: {
        select: {
          gcal_calendar_id: true,
        },
      },
    },
  });

  if (!oldEvent) {
    console.log("event not found", { event_id });
    return;
  }

  const newEvent = await prisma.event.create({
    data: {
      created_by_id: oldEvent.created_by_id,
      end_time: new Date(gcalEvent.end.dateTime),
      gcal_event_id: gcalEvent.id,
      project_id: oldEvent.project_id,
      slack_channel_id: oldEvent.slack_channel_id,
      slack_team_id: oldEvent.slack_team_id,
      rrule: generateRRuleFromEvent(gcalEvent),
      start_time: new Date(gcalEvent.start.dateTime),
      title: gcalEvent.summary,
      description: gcalEvent.description,
      slug: getSlug(gcalEvent.summary),
      participants: { create: oldEvent.participants },
    },
  });

  await patchCalendarEvent(gcalEvent.id, oldEvent.project.gcal_calendar_id, {
    extendedProperties: {
      private: {
        meetbot_event_id: newEvent.id.toString(),
        meetbot_project_id: newEvent.project_id.toString(),
      },
    },
  });

  scheduleNextCheckin(newEvent.id, newEvent.start_time);
}

export async function handleCreateEventException(gcalExceptions, gcalEventId) {
  const gcalEvent = gcalExceptions[gcalEventId];
  const record = await prisma.event.findUnique({
    where: { gcal_event_id: gcalEvent.recurringEventId },
  });

  if (!record) {
    console.log("event not found", {
      gcal_event_id: gcalEvent.recurringEventId,
    });
    return;
  }

  const row = {
    event_id: record.id,
    original_start_time: gcalEvent.originalStartTime.dateTime,
    start_time: gcalEvent.start?.dateTime,
    end_time: gcalEvent.end?.dateTime,
    gcal_event_id: gcalEvent.id,
    title: gcalEvent.summary,
    description: gcalEvent.description,
    status: gcalEvent.status.toUpperCase(),
  };

  await prisma.eventException.upsert({
    where: {
      event_id_original_start_time: {
        event_id: record.id,
        original_start_time: new Date(gcalEvent.originalStartTime.dateTime),
      },
    },
    create: row,
    update: row,
  });

  scheduleNextCheckin(record.id);
}
