import { getMongoClient } from "lib/mongo";
import { withUser } from "lib/withUser";
import { removeEmpty } from "common/utils/object";

async function handler(req, res) {
  switch (req.method) {
    case "GET":
      handleGet(req, res);
      break;
    case "PUT":
      handlePut(req, res);
      break;
    default:
      res.status(405).send("Method not allowed");
      return;
  }
}

export default withUser(handler);

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
