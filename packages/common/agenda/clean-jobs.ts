import prisma from "common/prisma";
import { getAgenda } from ".";

(async () => {
  const meeting_ids = await prisma.meeting
    .findMany({ select: { id: true } })
    .then((data) => data.map(({ id }) => id.toString()));

  const agenda = await getAgenda();
  const numRemoved = await agenda.cancel({
    name: "sendMeetingCheckin",
    "data.meeting_id": { $nin: meeting_ids },
  });
  console.log(`removed ${numRemoved} jobs`);
})();
