import prisma from "common/prisma";
import { createNotificationChannel } from "common/google/sync";
import { sendMeetingCheckin } from "common/slack/notifications";
import { getNextOccurrence } from "common/meetings";

export function registerJobs(agenda) {
  agenda.define("sendMeetingCheckin", async (job) => {
    const { meeting_id } = job.attrs.data;
    const meeting = await prisma.meeting.findUnique({
      where: { id: BigInt(meeting_id) },
      include: {
        exceptions: {
          orderBy: { start_time: "asc" },
        },
      },
    });

    if (!meeting) {
      console.log("meeting not found", { meeting_id });
      return;
    }

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
