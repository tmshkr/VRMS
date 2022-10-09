import prisma from "common/prisma";
import {
  createNotificationChannel,
  stopNotificationChannel,
} from "common/google/calendar/sync";
import { sendMeetingCheckin } from "common/slack/notifications";
import { getNextOccurrence } from "common/events";
import { getMongoClient } from "common/mongo";

export function registerJobs(agenda) {
  agenda.define("sendMeetingCheckin", async (job) => {
    const { event_id } = job.attrs.data;
    const event = await prisma.event.findUnique({
      where: { id: BigInt(event_id) },
      include: {
        exceptions: {
          orderBy: { start_time: "asc" },
        },
      },
    });

    if (!event) {
      console.log("event not found", { event_id });
      return;
    }

    sendMeetingCheckin(event);

    const { startTime: nextRunAt } = getNextOccurrence(event);
    if (nextRunAt) {
      job.schedule(nextRunAt);
      job.save();
    } else {
      job.remove();
    }
  });

  agenda.define("renewGCalNotificationChannel", async (job) => {
    const mongoClient = await getMongoClient();
    const { id, calendarId, resourceId } = await mongoClient
      .db()
      .collection("gcalNotificationChannels")
      .findOne({ id: job.attrs.data.id });

    await stopNotificationChannel(id, resourceId);

    const newChannel = await createNotificationChannel(calendarId);
    job.attrs.data.id = newChannel.id;
    job.schedule(new Date(newChannel.expiration));
    job.save();
  });

  console.log("Agenda jobs registered");
}
