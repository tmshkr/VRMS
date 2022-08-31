if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const { App } = require("@slack/bolt");
import { PrismaClient } from "@prisma/client";
const prisma: PrismaClient = new PrismaClient();

// Initialize app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
});

(async () => {
  console.log("fetching users");
  const users = await app.client.users.list().then((res) => {
    return res.members
      .filter((user) => user.is_bot === false && user.name !== "slackbot")
      .map((user) => {
        return {
          slack_id: user.id,
          real_name: user.real_name,
          email: user.profile.email,
          profile_image: user.profile.image_512,
        };
      });
  });

  const { count } = await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });
  console.log(`created ${count} users`);
})();
