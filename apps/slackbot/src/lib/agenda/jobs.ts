import prisma from "lib/prisma";
import { sendMeetingCheckin } from "app/notifications";
import { getNextOccurrence } from "lib/rrule";

export function registerJobs(agenda) {
  agenda.define("sendMeetingCheckin", async (job) => {
    const { meeting_id } = job.attrs.data;
    const { slack_channel_id, rrule, join_url } =
      await prisma.meeting.findUnique({
        where: { id: meeting_id },
      });
    await sendMeetingCheckin(slack_channel_id, join_url);

    if (rrule) {
      const nextRunAt = getNextOccurrence(rrule);
      job.schedule(nextRunAt);
      await job.save();
    }
  });
  console.log("Agenda jobs registered");
}
