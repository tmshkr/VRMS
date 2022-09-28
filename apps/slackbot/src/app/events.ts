import { app } from "app";
import { getHomeTab } from "./views/home";
import prisma from "common/prisma";
import cuid from "cuid";
const slugify = require("slugify");

export const registerEvents = () => {
  app.event("app_home_opened", async ({ body, event, client, logger }) => {
    if (event.tab === "home") {
      try {
        const home = await getHomeTab(event.user, body.team_id);
        const result = await client.views.publish(home);
        logger.info(result);
      } catch (error) {
        logger.error(error);
      }
    }
  });
  app.event("team_join", async ({ event, client, logger, team_id }) => {
    const { user } = event;
    if (!user.is_bot) {
      await prisma.user.create({
        data: {
          slack_id: user.id,
          slack_team_id: user.team_id,
          first_name: user.profile.first_name,
          last_name: user.profile.last_name,
          real_name: user.real_name,
          email: user.profile.email,
          profile_image: user.profile.image_512,
          timezone: user.tz,
          username: `${slugify(user.real_name.toLowerCase())}-${cuid.slug()}`,
        },
      });
      console.log(`added user ${user.id}`);
    }
  });

  app.event("user_profile_changed", async ({ event, client, logger }) => {
    const { user } = event;
    if (!user.is_bot) {
      await prisma.user.update({
        where: {
          slack_id_slack_team_id: {
            slack_id: user.id,
            slack_team_id: user.team_id,
          },
        },
        data: {
          first_name: user.profile.first_name,
          last_name: user.profile.last_name,
          real_name: user.real_name,
          email: user.profile.email,
          profile_image: user.profile.image_512,
          timezone: user.tz,
        },
      });
      console.log(`updated user ${user.id}`);
    }
  });

  console.log("⚡️ Events registered!");
};
