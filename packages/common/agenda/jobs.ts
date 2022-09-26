import prisma from "common/prisma";
import { createNotificationChannel } from "common/google/sync";
import { sendMeetingCheckin } from "common/slack/notifications";
import { getNextOccurrence } from "common/meetings";

export function registerJobs(agenda) {
  agenda.define("sendMeetingCheckin", async (job) => {
    const { meeting_id } = job.attrs.data;
    const meeting = await prisma.meeting.findUniqueOrThrow({
      where: { id: meeting_id },
      include: {
        exceptions: {
          orderBy: { start_time: "asc" },
        },
      },
    });

    sendMeetingCheckin(meeting);
    const { startTime: nextRunAt } = getNextOccurrence(meeting);
    if (nextRunAt) {
      job.schedule(nextRunAt);
      job.save();
    } else {
      job.remove();
    }
  });

  agenda.define("renewGCalNotificationChannel", async (job) => {
    const channel = await createNotificationChannel();
    job.schedule(new Date(channel.expiration));
    job.save();
  });

  console.log("Agenda jobs registered");
}
