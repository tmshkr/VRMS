import type { NextPage } from "next";
import Head from "next/head";
import prisma from "lib/prisma";
import dayjs from "common/dayjs";
import Link from "next/link";
import { getNextOccurrence } from "common/rrule";
import { generateEventLink } from "common/google";

const Meeting: NextPage = (props: any) => {
  const { meeting, nextMeeting, gcalEventLink } = props;

  return (
    <>
      <Head>
        <title>Meeting | VRMS</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <h1>{meeting.title}</h1>
      <p>
        <Link href={`/projects/${meeting.project.id}`}>
          {meeting.project.name}
        </Link>
      </p>
      <h2>📅 Next Meeting</h2>
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
      <h2>👥 Participants</h2>
      {meeting.participants.map(({ participant }) => {
        return (
          <li key={participant.id}>
            <Link href={`/people/${participant.id}`}>
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
  const id = Number(context.params.id);

  if (!id) {
    return {
      notFound: true,
    };
  }

  const meeting = await prisma.meeting.findUnique({
    where: { id },
    select: {
      id: true,
      gcal_event_id: true,
      start_date: true,
      rrule: true,
      slack_channel_id: true,
      title: true,
      project: { select: { id: true, name: true } },
      participants: {
        select: {
          participant: {
            select: {
              id: true,
              real_name: true,
              slack_id: true,
            },
          },
        },
      },
    },
  });

  if (!meeting) {
    return {
      notFound: true,
    };
  }

  const nextMeeting = meeting.rrule
    ? getNextOccurrence(meeting.rrule)
    : meeting.start_date;

  return {
    props: {
      meeting,
      nextMeeting,
      gcalEventLink: generateEventLink(meeting.gcal_event_id, nextMeeting),
    },
  };
}
