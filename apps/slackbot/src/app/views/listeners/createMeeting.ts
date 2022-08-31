import prisma from "lib/prisma";
import { RRule } from "rrule";
import { getFakeUTC } from "lib/rrule";
import dayjs from "lib/dayjs";
import { getAgenda } from "lib/agenda";
import { getHomeTab } from "app/views/home";
import { getInnerValues } from "utils/getInnerValues";
import { createCalendarEvent } from "lib/google";

export const createMeeting = async ({ ack, body, view, client, logger }) => {
  await ack();
  const values = getInnerValues(view.state.values);
  const {
    meeting_title,
    meeting_project,
    meeting_participants,
    meeting_channel,
    meeting_datepicker,
    meeting_timepicker,
    meeting_duration,
    meeting_frequency,
  } = values;

  const start_date = dayjs.tz(
    `${meeting_datepicker.selected_date} ${meeting_timepicker.selected_time}`
  );

  let rule;
  switch (meeting_frequency.selected_option.value) {
    case "1 week":
      rule = new RRule({
        freq: RRule.WEEKLY,
        interval: 1,
        dtstart: new Date(getFakeUTC(start_date)),
        tzid: "America/Los_Angeles",
      });
      break;
    case "2 weeks":
      rule = new RRule({
        freq: RRule.WEEKLY,
        interval: 2,
        dtstart: new Date(getFakeUTC(start_date)),
        tzid: "America/Los_Angeles",
      });
      break;

    default:
      break;
  }

  const meetingCreator = await prisma.user
    .findUnique({
      where: { slack_id: body.user.id },
      select: { id: true },
    })
    .then((user) => {
      if (!user) {
        throw new Error(`Slack user not found: ${body.user.id}`);
      }
      return user;
    });

  const participants = await prisma.user.findMany({
    where: {
      slack_id: {
        in: meeting_participants.selected_conversations,
      },
    },
    select: { id: true, email: true, slack_id: true },
  });

  const gcalEvent = await createCalendarEvent({
    summary: meeting_title.value,
    description: "test meeting description",
    start: {
      dateTime: dayjs(start_date).utc(),
      timeZone: "America/Los_Angeles",
    },
    end: {
      dateTime: dayjs(start_date)
        .utc()
        .add(
          Number(meeting_duration.selected_option.value.split(" ")[0]),
          "minutes"
        ),
      timeZone: "America/Los_Angeles",
    },
    conferenceData: {
      createRequest: { requestId: Date.now() },
    },
    recurrence: [rule?.toString().split("\n")[1]],
    attendees: participants.map(({ email }) => ({ email })),
    extendedProperties: {
      private: {
        vrms_project_id: Number(meeting_project.selected_option.value),
      },
    },
  });

  const newMeeting = await prisma.meeting.create({
    data: {
      created_by_id: meetingCreator.id,
      duration: Number(meeting_duration.selected_option.value.split(" ")[0]),
      gcal_event_id: gcalEvent.id,
      gcal_event_link: gcalEvent.htmlLink,
      join_url: gcalEvent.hangoutLink,
      project_id: Number(meeting_project.selected_option.value),
      rrule: rule?.toString(),
      slack_channel_id: meeting_channel.selected_channel,
      start_date: start_date.utc().format(),
      title: meeting_title.value,
      type: "SYNCHRONOUS",
      participants: {
        create: participants.map(({ id }) => ({
          user_id: id,
          added_by_id: meetingCreator.id,
        })),
      },
    },
  });

  const agenda = await getAgenda();
  await agenda.schedule(start_date.utc().format(), "sendMeetingCheckin", {
    meeting_id: newMeeting.id,
  });

  for (const slack_id of meeting_participants.selected_conversations) {
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

  const home = await getHomeTab(body.user.id);
  await client.views.publish(home);
};
