// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import prisma from "lib/prisma";
import next from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const nextToken = await getToken({ req });

  if (!nextToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const id: any = nextToken.vrms_user_id;
  await prisma.user.update({
    where: { id },
    data: { readme: req.body.readme },
  });
  res.send("OK");
}
