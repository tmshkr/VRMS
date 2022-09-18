import { app } from "app";

export const sendMeetingCheckin = async (channel, meeting_id) => {
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
            text: "Check In",
          },
          action_id: "meeting_check_in",
          url: `${process.env.NEXTAUTH_URL}/meetings/${meeting_id}/checkin`,
        },
      },
    ],
  });
};
