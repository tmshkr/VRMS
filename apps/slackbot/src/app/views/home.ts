import prisma from "common/prisma";
import dayjs from "common/dayjs";
import { generateEventLink } from "common/google";
import { getNextOccurrence } from "common/meetings";
import axios from "axios";

export const getHomeTab = async (slack_id: string, slack_team_id: string) => {
  const { team_assignments, meeting_assignments, timezone } =
    await prisma.user.findUniqueOrThrow({
      where: { slack_id_slack_team_id: { slack_id, slack_team_id } },
      include: {
        team_assignments: {
          orderBy: { created_at: "asc" },
          select: { project: true },
        },
        meeting_assignments: {
          where: { meeting: { status: "CONFIRMED" } },
          orderBy: { meeting: { start_time: "asc" } },
          select: {
            meeting: {
              include: {
                exceptions: true,
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
              text: "Create New Project",
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
              text: "Create New Meeting",
              emoji: true,
            },
            action_id: "create_new_meeting",
          },
        },
        ...meeting_assignments
          .map(({ meeting }) => renderMeeting(meeting, timezone))
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
      text: `:small_blue_diamond: ${project.name}`,
    },
  };
}

function renderMeeting(meeting, userTimezone) {
  const { startTime: nextMeeting, instance } = getNextOccurrence(meeting);

  return nextMeeting
    ? {
        block_id: JSON.stringify({ meeting_id: meeting.id, date: nextMeeting }),
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:small_blue_diamond: *${meeting.title}* – ${dayjs(nextMeeting)
            .tz(userTimezone)
            .format("dddd, MMMM D, h:mm a")} – <${generateEventLink(
            meeting.gcal_event_id,
            instance
          )}|Add to Calendar>`,
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
