import type { NextApiRequest, NextApiResponse } from "next";
import { syncMeetings } from "common/google/sync";
import { getMongoClient } from "common/mongo";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log(req.headers);
  const id = req.headers["x-goog-channel-id"];
  const mongoClient = await getMongoClient();
  const doc = await mongoClient
    .db()
    .collection("gcalNotificationChannels")
    .findOne({ _id: id });
  // check that the id matches
  if (!doc) {
    return res.status(403).send("Forbidden");
  }

  res.status(200).send("OK");
  syncMeetings();
}
