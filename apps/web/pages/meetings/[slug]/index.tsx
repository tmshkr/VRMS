import type { NextPage } from "next";
import { NextSeo } from "next-seo";
import prisma from "common/prisma";
import dayjs from "common/dayjs";
import Link from "next/link";
import { getNextOccurrence } from "common/events";
import { generateEventLink } from "common/google/calendar";

const Meeting: NextPage = (props: any) => {
  const { meeting, nextMeeting, gcalEventLink } = props;

  return (
    <>
      <NextSeo title={meeting.title} />
      <h1>{meeting.title}</h1>
      <p>
        <Link href={`/projects/${meeting.project.slug}`}>
          {meeting.project.name}
        </Link>
      </p>
      <h2>📅 Next Meeting</h2>
      {nextMeeting && (
        <p suppressHydrationWarning>
          {dayjs(nextMeeting).format("MMM D, h:mm a")}
          <br />
          <a
            href={gcalEventLink}
            target="_blank"
            rel="noopener noreferrer"
            suppressHydrationWarning
          >
            Add to Calendar
          </a>
        </p>
      )}
      <h2>👥 Participants</h2>
      {meeting.participants.map(({ participant }) => {
        return (
          <li key={participant.username}>
            <Link href={`/people/${participant.username}`}>
              {participant.real_name}
            </Link>
          </li>
        );
      })}
    </>
  );
};

export default Meeting;

export async function getServerSideProps(context) {
  const { slug } = context.params;

  const meeting = await prisma.event.findUnique({
    where: { slug },
    include: {
      exceptions: {
        orderBy: { start_time: "asc" },
      },
      project: { select: { name: true, gcal_calendar_id: true, slug: true } },
      participants: {
        select: {
          participant: {
            select: {
              real_name: true,
              slack_id: true,
              username: true,
            },
          },
        },
        where: { is_active: true },
      },
    },
  });

  if (!meeting) {
    return {
      notFound: true,
    };
  }

  const { startTime: nextMeeting, originalStartTime } =
    getNextOccurrence(meeting);

  return {
    props: {
      meeting,
      nextMeeting,
      gcalEventLink: generateEventLink(
        meeting.gcal_event_id,
        originalStartTime,
        meeting.project.gcal_calendar_id
      ),
    },
  };
}
