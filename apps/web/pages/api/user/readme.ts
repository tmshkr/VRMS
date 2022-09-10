// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import prisma from "lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const nextToken: any = await getToken({ req });

  if (!nextToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const { provider, provider_account_id } = nextToken;

  const readme = await prisma.account
    .update({
      where: {
        provider_provider_account_id: {
          provider,
          provider_account_id,
        },
      },
      data: { user: { update: { readme: req.body.readme } } },
      select: { user: { select: { readme: true } } },
    })
    .then(({ user }) => user.readme);

  res.send({ readme });
}
