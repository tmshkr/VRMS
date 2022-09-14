import { getMongoClient } from "lib/mongo";
import { withUser } from "src/middleware/withUser";
import { removeEmpty } from "common/utils/object";

import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

const router = createRouter<NextApiRequest, NextApiResponse>();
router.use(withUser).get(handleGet).put(handlePut);

async function handleGet(req, res) {
  return res.json({ user: req.vrms_user });
}

async function handlePut(req, res) {
  const { readme, headline } = req.body;
  if (!readme && !headline) {
    res.status(400).json({ message: "Must include a valid field" });
    return;
  }

  try {
    const { vrms_user } = req;
    const mongoClient = await getMongoClient();
    await mongoClient
      .db()
      .collection("userProfiles")
      .updateOne(
        { _id: vrms_user.id },
        {
          $set: removeEmpty({ readme, headline, updatedAt: new Date() }),
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );

    res.status(200).json({ success: true });
    return;
  } catch (err) {
    res
      .status(500)
      .send({ errorMessage: "There was a problem updating your profile" });
  }
}

export default router.handler({
  onError: (err: any, req, res) => {
    console.error(err.stack);
    res.status(500).end("Something broke!");
  },
  onNoMatch: (req, res) => {
    res.status(404).end("Page is not found");
  },
});
