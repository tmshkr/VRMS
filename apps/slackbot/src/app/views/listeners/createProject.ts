import prisma from "common/prisma";
import { getHomeTab } from "app/views/home";
import { getInnerValues } from "utils/getInnerValues";
import { getSlug } from "common/slug";
import { initSync } from "common/google/calendar/sync";

export const createProject = async ({ ack, body, view, client, logger }) => {
  await ack();

  const { project_title, project_description, team_members, gcal_calendar_id } =
    getInnerValues(view.state.values);

  const projectCreator = await prisma.user.findUniqueOrThrow({
    where: {
      slack_id_slack_team_id: {
        slack_id: body.user.id,
        slack_team_id: body.user.team_id,
      },
    },
    select: { id: true },
  });

  const members: any = await prisma.user.findMany({
    where: {
      slack_id: {
        in: team_members.selected_conversations,
      },
    },
    select: { id: true, slack_id: true },
  });

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

  await prisma.project.create({
    data: {
      name: project_title.value,
      description: project_description.value,
      created_by_id: projectCreator.id,
      gcal_calendar_id: gcal_calendar_id.value,
      slack_team_id: body.user.team_id,
      slug: getSlug(project_title.value),
      team_members: {
        create: members.map(({ id, slack_id }) => {
          if (slack_id === body.user.id) {
            return {
              user_id: id,
              role: "OWNER",
              added_by_id: projectCreator.id,
            };
          } else {
            return {
              user_id: id,
              added_by_id: projectCreator.id,
            };
          }
        }),
      },
    },
  });

  const home = await getHomeTab(body.user.id, body.user.team_id);
  await client.views.publish(home);

  // TODO: notify user if they selected a Slack Connect user that it is not currently supported
  for (const { slack_id } of members) {
    await client.chat.postMessage({
      channel: slack_id,
      text: `<@${body.user.id}> has added you to the ${project_title.value} team!`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `<@${body.user.id}> has added you to the *${project_title.value}* team!`,
          },
        },
      ],
    });
  }

  if (members.length !== team_members.selected_conversations.length) {
    await client.chat.postMessage({
      channel: body.user.id,
      text: `It looks like you selected a Slack Connect user. Unfortunately, Slack Connect users are not currently supported.`,
    });
  }
};
