import prisma from "lib/prisma";
import { getMongoClient } from "lib/mongo";
import { withUser } from "lib/withUser";

async function handler(req, res) {
  if (req.method !== "PUT") {
    res.status(405).send("Method not allowed");
    return;
  }

  const { readme, headline } = req.body;
  if (!readme && !headline) {
    res.status(400).json({ message: "Must include a valid field" });
    return;
  }

  const { vrms_user } = req;
  try {
    if (headline) {
      await prisma.user.update({
        where: {
          id: vrms_user.id,
        },
        data: { headline },
      });
    }
    if (readme) {
      const mongoClient = await getMongoClient();
      mongoClient
        .db()
        .collection("userReadmes")
        .updateOne(
          { user_id: vrms_user.id },
          { $set: { readme } },
          { upsert: true }
        );
    }

    res.send({ success: true });
  } catch (err) {
    res
      .status(500)
      .send({ errorMessage: "There was a problem updating your profile" });
  }
}

export default withUser(handler);
