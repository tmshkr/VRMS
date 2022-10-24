import prisma from "common/prisma";
import dayjs from "common/dayjs";
import { generateEventLink } from "common/google/calendar";
import { getNextOccurrence } from "common/events";
import axios from "axios";

export const getHomeTab = async (slack_id: string, slack_team_id: string) => {
  const { team_assignments, event_assignments, timezone } =
    await prisma.user.findUniqueOrThrow({
      where: { slack_id_slack_team_id: { slack_id, slack_team_id } },
      include: {
        team_assignments: {
          orderBy: { created_at: "asc" },
          select: { project: true },
        },
        event_assignments: {
          where: { event: { status: "CONFIRMED" } },
          orderBy: { event: { start_time: "asc" } },
          select: {
            event: {
              include: {
                exceptions: true,
                project: {
                  select: {
                    gcal_calendar_id: true,
                  },
                },
              },
            },
          },
        },
      },
    });

  return {
    user_id: slack_id,
    view: {
      type: "home",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `:house: Welcome to Meetbot`,
            emoji: true,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `Here you'll find an overview of your projects and upcoming meetings.`,
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "Open Dashboard",
            },
            url: process.env.NEXTAUTH_URL,
            action_id: "open_dashboard",
            style: "primary",
          },
        },
        {
          type: "divider",
        },
        {
          type: "header",
          text: {
            type: "plain_text",
            text: ":open_file_folder: My Projects",
            emoji: true,
          },
        },
        {
          type: "section",
          text: {
            type: "plain_text",
            text: "Projects you're working on",
            emoji: true,
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: ":heavy_plus_sign: New Project",
              emoji: true,
            },
            action_id: "create_new_project",
          },
        },
        ...team_assignments.map(({ project }) => renderProject(project)),
        {
          type: "divider",
        },
        {
          type: "header",
          text: {
            type: "plain_text",
            text: ":calendar: Upcoming Meetings",
            emoji: true,
          },
        },
        {
          type: "section",
          text: {
            type: "plain_text",
            text: "Meetings for projects",
            emoji: true,
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: ":heavy_plus_sign: New Meeting",
              emoji: true,
            },
            action_id: "create_new_meeting",
          },
        },
        ...event_assignments
          .map(({ event }) => renderMeeting(event, timezone))
          .filter((block) => !!block)
          .sort((a: any, b: any) => {
            const { date: aDate } = JSON.parse(a.block_id);
            const { date: bDate } = JSON.parse(b.block_id);
            return dayjs(aDate).isBefore(bDate) ? -1 : 1;
          }),
        {
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: await getQOTD(),
          },
        },
      ],
    },
  };
};

function renderProject(project) {
  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*<${process.env.NEXTAUTH_URL}/projects/${project.slug}|${project.name}>*\n${project.description}`,
    },
    accessory: {
      type: "overflow",
      options: [
        {
          text: {
            type: "plain_text",
            text: ":gear: Edit Project",
            emoji: true,
          },
          value: project.id.toString(),
        },
      ],
      action_id: "edit_project",
    },
  };
}

function renderMeeting(event, userTimezone) {
  const { startTime: nextMeeting, originalStartTime } =
    getNextOccurrence(event);

  return nextMeeting
    ? {
        block_id: JSON.stringify({ event_id: event.id, date: nextMeeting }),
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*<${process.env.NEXTAUTH_URL}/meetings/${event.slug}|${
            event.title
          }>*\n${dayjs(nextMeeting)
            .tz(userTimezone)
            .format("dddd, MMMM D, h:mm a")}\n<${generateEventLink(
            event.gcal_event_id,
            originalStartTime,
            event.project.gcal_calendar_id
          )}|Add to Calendar>`,
        },
        accessory: {
          type: "overflow",
          options: [
            {
              text: {
                type: "plain_text",
                text: ":gear: Edit Meeting",
                emoji: true,
              },
              value: event.id.toString(),
            },
          ],
          action_id: "edit_meeting",
        },
      }
    : null;
}

let qotd;
async function getQOTD() {
  const getDate = () => dayjs().tz("US/Central").format("YYYYMMDD");
  if (qotd?.updated === getDate()) {
    return qotd.text;
  }

  const [quote] = await axios
    .get("https://zenquotes.io/api/today")
    .then((res) => res.data);

  qotd = {
    text: `_${quote.q}_\n${quote.a}`,
    updated: getDate(),
  };
  return qotd.text;
}
