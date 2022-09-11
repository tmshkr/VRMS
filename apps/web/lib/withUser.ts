import prisma from "lib/prisma";
import { getToken } from "next-auth/jwt";

export const withUser = (handler) => {
  return async (req, res) => {
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

      return handler(req, res);
    } catch (err) {
      res.status(401).json({ errorMessage: "Unauthorized" });
    }
  };
};
