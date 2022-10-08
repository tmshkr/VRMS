import prisma from "common/prisma";
import { createNotificationChannel } from "common/google/calendar/sync";
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
    const { id, calendarId } = job.attrs.data;
    const mongoClient = await getMongoClient();
    await mongoClient
      .db()
      .collection("gcalNotificationChannels")
      .deleteOne({ _id: id });

    const channel = await createNotificationChannel(calendarId);
    job.schedule(new Date(channel.expiration));
    job.save();
  });

  console.log("Agenda jobs registered");
}
