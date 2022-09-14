import prisma from "lib/prisma";
import { getToken } from "next-auth/jwt";

export const withUser = async (req, res, next) => {
  const nextToken: any = await getToken({ req });
  if (!nextToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { provider, provider_account_id } = nextToken;

  try {
    const vrms_user = await prisma.account
      .findUniqueOrThrow({
        where: {
          provider_provider_account_id: {
            provider,
            provider_account_id,
          },
        },
        select: {
          user: {
            select: {
              id: true,
              slack_id: true,
              username: true,
              app_roles: true,
            },
          },
        },
      })
      .then(({ user }) => {
        return {
          ...user,
          app_roles: user.app_roles.map(({ role }) => role),
        };
      });

    req.vrms_user = vrms_user;

    return next();
  } catch (err: any) {
    if (err.name === "NotFoundError") {
      res.status(404).json({ errorMessage: "User not found" });
    } else res.status(401).json({ errorMessage: "Unauthorized" });
  }
};
