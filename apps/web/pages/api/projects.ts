(BigInt as any).prototype.toJSON = function () {
  return this.toString();
};
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "common/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const projects = await prisma.project.findMany();
  res.status(200).json(projects);
}
