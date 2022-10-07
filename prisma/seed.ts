import { seedUsers } from "common/slack/seedUsers";
seedUsers({
  bot: { token: process.env.SLACK_BOT_TOKEN },
  team: { id: null, name: "dev" },
});
