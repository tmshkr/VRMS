import prisma from "common/prisma";

export const editProjectModal = async ({ body, client, ack, logger }) => {
  await ack();

  const projectId = BigInt(body.actions[0].selected_option.value);
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      team_members: { where: { is_active: true }, include: { member: true } },
    },
  });
  if (!project) return;

  await client.views.open({
    trigger_id: body.trigger_id,
    // View payload
    view: {
      type: "modal",
      // View identifier
      callback_id: "edit_project_modal",
      private_metadata: projectId.toString(),
      title: {
        type: "plain_text",
        text: "Edit Project",
      },
      blocks: [
        {
          type: "input",
          label: {
            type: "plain_text",
            text: "Project Name",
          },
          element: {
            type: "plain_text_input",
            action_id: "project_name",
            initial_value: project.name,
          },
        },
        {
          type: "input",
          label: {
            type: "plain_text",
            text: "Google Calendar ID",
          },
          element: {
            type: "plain_text_input",
            action_id: "gcal_calendar_id",
            initial_value: project.gcal_calendar_id,
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
            initial_conversations: project.team_members.map(
              ({ member }) => member.slack_id
            ),
            filter: {
              include: ["im"],
              exclude_bot_users: true,
              exclude_external_shared_channels: true,
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
