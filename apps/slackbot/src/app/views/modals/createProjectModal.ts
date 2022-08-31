export const createProjectModal = async ({ body, client, ack, logger }) => {
  await ack();
  await client.views.open({
    // Pass a valid trigger_id within 3 seconds of receiving it
    trigger_id: body.trigger_id,
    // View payload
    view: {
      type: "modal",
      // View identifier
      callback_id: "create_project_modal",
      title: {
        type: "plain_text",
        text: "Create New Project",
      },
      blocks: [
        {
          type: "input",
          label: {
            type: "plain_text",
            text: "What should the project's name be?",
          },
          element: {
            type: "plain_text_input",
            action_id: "new_project_title",
          },
        },
        {
          type: "input",
          element: {
            type: "multi_conversations_select",
            placeholder: {
              type: "plain_text",
              text: "Select users",
              emoji: true,
            },
            action_id: "team_members",
            initial_conversations: [body.user.id],
            filter: {
              include: ["im"],
              exclude_bot_users: true,
            },
          },
          label: {
            type: "plain_text",
            text: "Who is on this project's team?",
            emoji: true,
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
