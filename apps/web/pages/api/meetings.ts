(BigInt as any).prototype.toJSON = function () {
  return this.toString();
};
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "common/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const meetings = await prisma.event.findMany({
    where: { visibility: "PUBLIC" },
  });

  res.status(200).json(meetings);
}
