import { App } from "@slack/bolt";
import { getMongoClient } from "common/mongo";

export const sendMeetingCheckin = async ({
  id,
  slack_channel_id,
  slack_team_id,
}) => {
  const mongoClient = await getMongoClient();
  const installation = await mongoClient
    .db()
    .collection("slackTeamInstalls")
    .findOne({ _id: slack_team_id });

  if (!installation) {
    console.log("no slack team install found", { slack_team_id });
    return;
  }

  const app = new App({
    token: installation.bot.token,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
  });

  await app.client.chat.postMessage({
    channel: slack_channel_id,
    text: `@here it's time to meet!`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `@here it's time to meet!`,
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Check In",
          },
          action_id: "meeting_check_in",
          url: `${process.env.NEXTAUTH_URL}/meetings/${id}/checkin`,
        },
      },
    ],
  });
};
