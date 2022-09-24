import prisma from "common/prisma";
import { createNotificationChannel } from "common/google/sync";
import { sendMeetingCheckin } from "common/slack/notifications";
import { getNextOccurrence } from "common/meetings";

export function registerJobs(agenda) {
  agenda.define("sendMeetingCheckin", async (job) => {
    const { meeting_id } = job.attrs.data;
    const meeting = await prisma.meeting
      .findUnique({
        where: { id: meeting_id },
        include: {
          exceptions: {
            where: { status: "CONFIRMED" },
            orderBy: { start_time: "asc" },
          },
        },
      })
      .then((meeting) => {
        if (!meeting) {
          throw new Error(`Meeting not found: ${meeting_id}`);
        }
        return meeting;
      });
    await sendMeetingCheckin(meeting);

    if (meeting.rrule) {
      const nextRunAt = getNextOccurrence(meeting);
      job.schedule(nextRunAt);
      await job.save();
    }
  });

  agenda.define("renewGCalNotificationChannel", async (job) => {
    const channel = await createNotificationChannel();
    job.schedule(new Date(channel.expiration));
  });

  console.log("Agenda jobs registered");
}
