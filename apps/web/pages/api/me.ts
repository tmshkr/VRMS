// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import prisma from "lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT") {
    res.status(405).send("Method not allowed");
    return;
  }

  const nextToken: any = await getToken({ req });
  if (!nextToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { readme, headline } = req.body;
  if (!readme && !headline) {
    res.status(400).json({ message: "Must include a valid field" });
    return;
  }

  const { provider, provider_account_id } = nextToken;
  const result = await prisma.account
    .update({
      where: {
        provider_provider_account_id: {
          provider,
          provider_account_id,
        },
      },
      data: { user: { update: { readme, headline } } },
      select: {
        user: {
          select: {
            id: true,
            headline: true,
            profile_image: true,
            readme: true,
            real_name: true,
            username: true,
          },
        },
      },
    })
    .then(({ user }) => user);

  res.send(result);
}
