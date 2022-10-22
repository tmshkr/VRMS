import type { NextPage } from "next";
import { NextSeo } from "next-seo";
import Link from "next/link";
import prisma from "common/prisma";
import dayjs from "common/dayjs";
import { getNextOccurrence } from "common/events";
import { generateEventLink } from "common/google/calendar";

const Projects: NextPage = (props: any) => {
  const { project } = props;

  return (
    <>
      <NextSeo title={project.name} />
      <h1>{project.name}</h1>
      <h2>👥 Team Members</h2>
      <ul>
        {project.team_members.map(({ member, position, role }) => {
          return (
            <li key={member.username}>
              <Link href={`/people/${member.username}`}>
                {member.real_name}
              </Link>
            </li>
          );
        })}
      </ul>
      <h3>📅 Upcoming Meetings</h3>
      <ul>
        {project.events.map((meeting) => {
          return meeting.nextMeeting ? (
            <li key={meeting.slug} suppressHydrationWarning>
              <Link href={`/meetings/${meeting.slug}`}>{meeting.title}</Link>
              <br />
              {dayjs(meeting.nextMeeting).format("MMM D, h:mm a")}
              <br />
              <a
                href={meeting.gcalEventLink}
                target="_blank"
                rel="noopener noreferrer"
                suppressHydrationWarning
              >
                Add to Calendar
              </a>
            </li>
          ) : (
            "No upcoming meetings"
          );
        })}
      </ul>
    </>
  );
};

export default Projects;

export async function getServerSideProps(context) {
  const { slug } = context.params;

  const project = await prisma.project.findUnique({
    where: { slug },
    select: {
      name: true,
      gcal_calendar_id: true,
      slug: true,
      events: {
        include: {
          exceptions: {
            orderBy: { start_time: "asc" },
          },
        },
      },
      team_members: {
        select: {
          role: true,
          position: true,
          member: { select: { real_name: true, username: true } },
        },
        where: { is_active: true },
      },
    },
  });

  if (!project) {
    return {
      notFound: true,
    };
  }

  for (const meeting of project.events) {
    const { startTime: nextMeeting, originalStartTime } =
      getNextOccurrence(meeting);

    (meeting as any).nextMeeting = nextMeeting;
    (meeting as any).gcalEventLink = generateEventLink(
      meeting.gcal_event_id,
      originalStartTime,
      project.gcal_calendar_id
    );
  }

  return {
    props: { project },
  };
}
