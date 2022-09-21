require("dotenv").config({ path: "../../.env" });

import { PrismaClient } from "@prisma/client";
const prisma: PrismaClient = new PrismaClient();
import { getMongoClient } from "./mongo";
import { getEvents } from "./google";
import dayjs from "dayjs";

export async function syncMeetings() {
  const mongoClient = await getMongoClient();
  const doc = await mongoClient
    .db()
    .collection("config")
    .findOne({ _id: "GCAL_SYNC_TOKEN" });

  const { items, nextSyncToken } = await getEvents(
    process.env.GOOGLE_CALENDAR_ID,
    doc?.syncToken
  );

  await mongoClient
    .db()
    .collection("config")
    .updateOne(
      { _id: "GCAL_SYNC_TOKEN" },
      {
        $set: { syncToken: nextSyncToken, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
  await mongoClient.close();

  const events = items.reduce((acc, cur) => {
    acc[cur.id] = cur;
    return acc;
  }, {});

  const meetings = await prisma.meeting.findMany({
    where: { gcal_event_id: { in: Object.keys(events) } },
  });

  for (const meeting of meetings) {
    const event = events[meeting.gcal_event_id];

    if (event.status === "cancelled") {
      const result = await prisma.meeting.delete({
        where: { gcal_event_id: event.id },
      });
      console.log("deleted", result);
      continue;
    }

    const eventStartTime = dayjs(event.start.dateTime);
    const meetingStartTime = dayjs(meeting.start_date);

    const update: any = {};

    if (!eventStartTime.isSame(meetingStartTime)) {
      console.log(`updating meeting ${meeting.id} start_date`);
      update.start_date = eventStartTime.toDate();
    }

    if (Object.keys(update).length > 0) {
      await prisma.meeting.update({
        where: { gcal_event_id: event.id },
        data: update,
      });
    }
  }
}

syncMeetings();
