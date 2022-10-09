import prisma from "common/prisma";
import { getToken } from "next-auth/jwt";

export const withUser = async (req, res, next) => {
  const nextToken: any = await getToken({ req });
  if (!nextToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { provider_account_id } = nextToken;

  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { slack_id: provider_account_id },
      select: {
        id: true,
        completed_onboarding: true,
        slack_id: true,
        username: true,
        app_roles: true,
      },
    });

    (user as any).app_roles = user.app_roles.map(({ role }) => role);
    (user as any).id = user.id.toString();
    req.user = user;

    return next();
  } catch (err: any) {
    if (err.name === "NotFoundError") {
      res.status(404).json({ errorMessage: "User not found" });
    } else res.status(401).json({ errorMessage: "Unauthorized" });
  }
};
