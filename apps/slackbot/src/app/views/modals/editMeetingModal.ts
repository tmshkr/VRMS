import prisma from "common/prisma";

export const editMeetingModal = async ({ body, client, ack, logger }) => {
  await ack();

  const event = await prisma.event.findUniqueOrThrow({
    where: { id: BigInt(body.actions[0].selected_option.value) },
    include: {
      participants: {
        where: { is_active: true },
        include: { participant: true },
      },
    },
  });

  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: "modal",
      callback_id: "edit_meeting_modal",
      private_metadata: body.actions[0].selected_option.value,
      title: {
        type: "plain_text",
        text: "Edit Meeting",
      },
      blocks: [
        {
          type: "input",
          element: {
            type: "multi_conversations_select",
            placeholder: {
              type: "plain_text",
              text: "Select users",
              emoji: true,
            },
            action_id: "meeting_participants",
            initial_conversations: event?.participants.map(
              ({ participant }) => participant.slack_id
            ),
            filter: {
              include: ["im"],
              exclude_bot_users: true,
              exclude_external_shared_channels: true,
            },
          },
          label: {
            type: "plain_text",
            text: "Who should be in this meeting?",
            emoji: true,
          },
        },
        {
          type: "input",
          element: {
            type: "channels_select",
            placeholder: {
              type: "plain_text",
              text: "Select channel",
            },
            initial_channel: event.slack_channel_id,
            action_id: "meeting_channel",
          },
          label: {
            type: "plain_text",
            text: "Which channel should this meeting be in?",
          },
        },
      ],
      submit: {
        type: "plain_text",
        text: "Submit",
      },
    },
  });
};
