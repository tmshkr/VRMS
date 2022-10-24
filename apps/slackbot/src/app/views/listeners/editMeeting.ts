import prisma from "common/prisma";
import _ from "lodash";
import { getHomeTab } from "app/views/home";
import { getInnerValues } from "utils/getInnerValues";

export const editMeeting = async ({ ack, body, view, client, logger }) => {
  await ack();
  const eventId = BigInt(body.view.private_metadata);
  const { meeting_participants, meeting_channel } = getInnerValues(
    view.state.values
  );

  const meetingEditor = await prisma.user.findUniqueOrThrow({
    where: { slack_id: body.user.id },
    select: { id: true },
  });

  const participants = await prisma.eventParticipant.findMany({
    where: {
      event_id: eventId,
    },
    include: { participant: true },
  });

  const selectedUsers = await prisma.user
    .findMany({
      where: { slack_id: { in: meeting_participants.selected_conversations } },
      select: { id: true, slack_id: true },
    })
    .then((users) =>
      users.map(({ id, slack_id }) => ({
        user_id: id,
        participant: { slack_id },
      }))
    );

  const newParticipants = _.differenceBy(
    selectedUsers,
    participants,
    ({ participant }) => participant.slack_id
  );
  const removedParticipants = _.differenceBy(
    participants.filter((participant) => participant.is_active),
    selectedUsers,
    ({ participant }) => participant.slack_id
  );
  const returningParticipants = _.intersectionBy(
    participants.filter((participant) => !participant.is_active),
    selectedUsers,
    ({ participant }) => participant.slack_id
  );

  await prisma.event.update({
    where: { id: eventId },
    data: {
      slack_channel_id: meeting_channel.selected_channel,
      participants: {
        createMany: {
          data: newParticipants.map(({ user_id }) => ({
            user_id,
            added_by_id: meetingEditor.id,
            event_time: new Date(0),
          })),
        },
        updateMany: {
          where: {
            user_id: { in: removedParticipants.map(({ user_id }) => user_id) },
            event_time: new Date(0),
          },
          data: {
            is_active: false,
          },
        },
      },
    },
  });

  await prisma.eventParticipant.updateMany({
    where: {
      user_id: { in: returningParticipants.map(({ user_id }) => user_id) },
      event_id: eventId,
      event_time: new Date(0),
    },
    data: {
      is_active: true,
    },
  });

  const home = await getHomeTab(body.user.id, body.user.team_id);
  await client.views.publish(home);
};
