import type { NextApiRequest, NextApiResponse } from "next";
import { syncMeetings } from "common/google/sync";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log(req.headers);
  await syncMeetings();
  res.status(200).send("OK");
}
