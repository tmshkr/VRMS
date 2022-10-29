import _ from "lodash";
import prisma from "common/prisma";
import { getHomeTab } from "app/views/home";
import { getInnerValues } from "utils/getInnerValues";
import { initSync } from "common/google/calendar/sync";

export const editProject = async ({ ack, body, view, client, logger }) => {
  await ack();

  const projectId = BigInt(body.view.private_metadata);
  const { project_name, team_members, gcal_calendar_id } = getInnerValues(
    view.state.values
  );

  try {
    await initSync(gcal_calendar_id.value);
  } catch (err) {
    console.error(err);
    await client.views
      .open({
        trigger_id: body.trigger_id,
        view: {
          type: "modal",
          close: {
            type: "plain_text",
            text: "Close",
            emoji: true,
          },
          title: {
            type: "plain_text",
            text: "There was a problem",
            emoji: true,
          },
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "There was a problem syncing your calendar.\n\nCheck that the Calendar ID is correct and that calendar@meetbot-hq.iam.gserviceaccount.com is set as a 'Make changes to events' user.",
              },
            },
          ],
        },
      })
      .catch((err) => console.log(err.data));
    return;
  }

  const editor = await prisma.user.findUniqueOrThrow({
    where: {
      slack_id_slack_team_id: {
        slack_id: body.user.id,
        slack_team_id: body.user.team_id,
      },
    },
    select: { id: true },
  });

  const teamMembers = await prisma.teamMember.findMany({
    where: {
      project_id: projectId,
    },
    include: { member: true },
  });

  const selectedUsers = await prisma.user
    .findMany({
      where: { slack_id: { in: team_members.selected_conversations } },
      select: { id: true, slack_id: true },
    })
    .then((users) =>
      users.map(({ id, slack_id }) => ({ user_id: id, member: { slack_id } }))
    );

  const newMembers = _.differenceBy(
    selectedUsers,
    teamMembers,
    ({ member }) => member.slack_id
  );
  const removedMembers = _.differenceBy(
    teamMembers,
    selectedUsers,
    ({ member }) => member.slack_id
  );
  const returningMembers = _.intersectionBy(
    teamMembers.filter((member) => !member.is_active),
    selectedUsers,
    ({ member }) => member.slack_id
  );

  await prisma.project.update({
    where: { id: projectId },
    data: {
      name: project_name.value,
      gcal_calendar_id: gcal_calendar_id.value,
      team_members: {
        createMany: {
          data: newMembers.map(({ user_id }) => ({
            user_id,
            added_by_id: editor.id,
          })),
        },
        updateMany: {
          where: {
            user_id: { in: removedMembers.map(({ user_id }) => user_id) },
          },
          data: {
            is_active: false,
          },
        },
      },
    },
  });

  await prisma.teamMember.updateMany({
    where: {
      user_id: { in: returningMembers.map(({ user_id }) => user_id) },
      project_id: projectId,
    },
    data: {
      is_active: true,
    },
  });

  const home = await getHomeTab(body.user.id, body.user.team_id);
  await client.views.publish(home);
};
