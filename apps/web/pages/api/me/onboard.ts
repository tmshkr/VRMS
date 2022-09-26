import prisma from "common/prisma";
import { withUser } from "src/middleware/withUser";
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

const router = createRouter<NextApiRequest, NextApiResponse>();
router.use(withUser).put(async (req: any, res) => {
  await prisma.user.update({
    where: { id: req.vrms_user.id },
    data: {
      completed_onboarding: true,
    },
  });
  res.json({ success: true });
});

export default router.handler({
  onError: (err: any, req, res) => {
    console.error(err.stack);
    res.status(500).end("Something broke!");
  },
  onNoMatch: (req, res) => {
    res.status(404).end("Page is not found");
  },
});
