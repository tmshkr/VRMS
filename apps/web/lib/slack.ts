const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

export const notifyAccountConnected = async (slack_id, gh_username) => {
  await app.client.chat.postMessage({
    channel: slack_id,
    text: `Your GitHub account is now connected`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Hooray! Your GitHub account <https://github.com/${gh_username}|${gh_username}> is now connected :partying_face:`,
        },
      },
    ],
  });
};
