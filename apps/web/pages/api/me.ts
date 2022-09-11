import prisma from "lib/prisma";
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
      await prisma.user.update({
        where: {
          id: vrms_user.id,
        },
        data: { readme },
      });
    }

    res.send({ success: true });
  } catch (err) {
    res
      .status(500)
      .send({ errorMessage: "There was a problem updating your profile" });
  }
}

export default withUser(handler);
