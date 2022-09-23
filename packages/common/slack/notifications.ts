import { app } from "./index";

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
