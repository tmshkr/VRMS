const { App } = require("@slack/bolt");
import { PrismaClient } from "@prisma/client";
const prisma: PrismaClient = new PrismaClient();
import { getSlug } from "common/slug";

export async function seedUsers(installation) {
  const { team, bot } = installation;
  const app = new App({
    token: bot.token,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
  });

  console.log(`fetching users for workspace ${team}`);
  const users = await app.client.users.list().then((res) => {
    return res.members
      .filter((user) => user.is_bot === false && user.name !== "slackbot")
      .map((user) => {
        // console.log(user);
        return {
          slack_id: user.id,
          slack_team_id: user.team_id,
          first_name: user.profile.first_name,
          last_name: user.profile.last_name,
          real_name: user.real_name,
          email: user.profile.email,
          profile_image: user.profile.image_512,
          timezone: user.tz,
          username: getSlug(user.real_name),
        };
      });
  });

  const { count } = await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });
  console.log(`created ${count} users`);
}
