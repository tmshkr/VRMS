import { app } from "app";

export const sendMeetingCheckin = async (channel, joinUrl) => {
  await app.client.chat.postMessage({
    channel,
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
            text: "Join Meeting",
          },
          action_id: "meeting_check_in",
          url: joinUrl,
        },
      },
    ],
  });
};
