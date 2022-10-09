import prisma from "common/prisma";
import { getAgenda } from ".";

(async () => {
  const event_ids = await prisma.event
    .findMany({ select: { id: true } })
    .then((data) => data.map(({ id }) => id.toString()));

  const agenda = await getAgenda();
  const numRemoved = await agenda.cancel({
    name: "sendMeetingCheckin",
    "data.event_id": { $nin: event_ids },
  });
  console.log(`removed ${numRemoved} jobs`);
})();
