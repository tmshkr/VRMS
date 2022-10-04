// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "common/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: false,
      real_name: true,
      slack_id: true,
    },
  });

  res.status(200).json(users);
}
