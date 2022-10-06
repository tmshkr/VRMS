import prisma from "common/prisma";
import { RRule } from "rrule";
import { getPseudoUTC } from "common/rrule";
import dayjs from "common/dayjs";
import { getHomeTab } from "app/views/home";
import { getInnerValues } from "utils/getInnerValues";
import { createCalendarEvent, patchCalendarEvent } from "common/google";
import { scheduleNextCheckin } from "common/meetings";
import { getSlug } from "common/slug";

export const createMeeting = async ({ ack, body, view, client, logger }) => {
  await ack();
  const {
    meeting_title,
    meeting_description,
    meeting_project,
    meeting_participants,
    meeting_channel,
    meeting_datepicker,
    meeting_timepicker,
    meeting_duration,
    meeting_frequency,
  } = getInnerValues(view.state.values);

  const meetingCreator = await prisma.user.findUniqueOrThrow({
    where: {
      slack_id_slack_team_id: {
        slack_id: body.user.id,
        slack_team_id: body.user.team_id,
      },
    },
    select: { id: true, timezone: true },
  });

  const { gcal_calendar_id } = await prisma.project.findUniqueOrThrow({
    where: { id: BigInt(meeting_project.selected_option.value) },
    select: { gcal_calendar_id: true },
  });

  const start_time = dayjs.tz(
    `${meeting_datepicker.selected_date} ${meeting_timepicker.selected_time}`,
    meetingCreator.timezone
  );

  let rule;
  switch (meeting_frequency.selected_option.value) {
    case "1 week":
      rule = new RRule({
        freq: RRule.WEEKLY,
        interval: 1,
        dtstart: getPseudoUTC(start_time),
        tzid: meetingCreator.timezone,
      });
      break;
    case "2 weeks":
      rule = new RRule({
        freq: RRule.WEEKLY,
        interval: 2,
        dtstart: getPseudoUTC(start_time),
        tzid: meetingCreator.timezone,
      });
      break;

    default:
      break;
  }

  const participants = await prisma.user.findMany({
    where: {
      slack_id: {
        in: meeting_participants.selected_conversations,
      },
    },
    select: { id: true, email: true, slack_id: true },
  });

  const gcalEvent = await createCalendarEvent(
    {
      summary: meeting_title.value,
      description: meeting_description.value,
      start: {
        dateTime: start_time,
        timeZone: meetingCreator.timezone,
      },
      end: {
        dateTime: start_time.add(
          Number(meeting_duration.selected_option.value),
          "minutes"
        ),
        timeZone: meetingCreator.timezone,
      },
      recurrence: [rule?.toString().split("\n")[1]],
    },
    gcal_calendar_id
  );

  const newMeeting = await prisma.meeting.create({
    data: {
      created_by_id: meetingCreator.id,
      end_time: start_time
        .add(Number(meeting_duration.selected_option.value), "minutes")
        .toDate(),
      gcal_event_id: gcalEvent.id,
      project_id: BigInt(meeting_project.selected_option.value),
      rrule: rule?.toString(),
      slack_channel_id: meeting_channel.selected_channel,
      slack_team_id: body.user.team_id,
      start_time: start_time.toDate(),
      title: meeting_title.value,
      description: meeting_description.value,
      slug: getSlug(meeting_title.value),
      participants: {
        create: participants.map(({ id }) => ({
          user_id: id,
          added_by_id: meetingCreator.id,
          meeting_time: new Date(0),
        })),
      },
    },
  });

  await patchCalendarEvent(gcalEvent.id, gcal_calendar_id, {
    extendedProperties: {
      private: {
        mb_meeting_id: newMeeting.id.toString(),
        mb_project_id: newMeeting.project_id.toString(),
      },
    },
  });

  scheduleNextCheckin(newMeeting.id, newMeeting.start_time);

  for (const { slack_id } of participants) {
    await client.chat.postMessage({
      channel: slack_id,
      text: `<@${body.user.id}> invited you to a meeting!`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `<@${body.user.id}> invited you to a meeting!`,
          },
        },
      ],
    });
  }

  if (
    participants.length !== meeting_participants.selected_conversations.length
  ) {
    await client.chat.postMessage({
      channel: body.user.id,
      text: `It looks like you selected a Slack Connect user. Unfortunately, Slack Connect users are not currently supported.`,
    });
  }

  const home = await getHomeTab(body.user.id, body.user.team_id);
  await client.views.publish(home);
};
