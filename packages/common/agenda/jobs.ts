import prisma from "common/prisma";
import { sendMeetingCheckin } from "common/slack/notifications";
import { getNextOccurrence } from "common/rrule";

export function registerJobs(agenda) {
  agenda.define("sendMeetingCheckin", async (job) => {
    const { meeting_id } = job.attrs.data;
    const { slack_channel_id, rrule } = await prisma.meeting
      .findUnique({
        where: { id: meeting_id },
      })
      .then((meeting) => {
        if (!meeting) {
          throw new Error(`Meeting not found: ${meeting_id}`);
        }
        return meeting;
      });
    await sendMeetingCheckin(slack_channel_id, meeting_id);

    if (rrule) {
      const nextRunAt = getNextOccurrence(rrule);
      job.schedule(nextRunAt);
      await job.save();
    }
  });
  console.log("Agenda jobs registered");
}
