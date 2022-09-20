require("dotenv").config({ path: "../../.env" });

import { PrismaClient } from "@prisma/client";
const prisma: PrismaClient = new PrismaClient();
import { getEvents } from "common/google";
import dayjs from "dayjs";

(async () => {
  const { items, ...rest } = await getEvents(process.env.GOOGLE_CALENDAR_ID);
  const events = items.reduce((acc, cur) => {
    acc[cur.id] = cur;
    return acc;
  }, {});

  const meetings = await prisma.meeting.findMany({
    where: { gcal_event_id: { in: Object.keys(events) } },
  });

  for (const meeting of meetings) {
    const event = events[meeting.gcal_event_id];
    const eventStartTime = dayjs(event.start.dateTime);
    const meetingStartTime = dayjs(meeting.start_date);

    if (!eventStartTime.isSame(meetingStartTime)) {
      console.log(`updating meeting ${meeting.id} start time`);
      await prisma.meeting.update({
        where: { gcal_event_id: event.id },
        data: { start_date: eventStartTime.toDate() },
      });
    }
  }
})();
