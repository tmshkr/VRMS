import { getToken } from "next-auth/jwt";
import { NextSeo } from "next-seo";
import prisma from "common/prisma";
import { getNextOccurrence } from "common/events";
import dayjs from "common/dayjs";

const MeetingCheckinPage = (props: any) => {
  const { meeting, message } = props;
  return (
    <>
      <NextSeo title={meeting.title} />
      <h1>{meeting.title}</h1>
      <p>{message}</p>
    </>
  );
};

export default MeetingCheckinPage;

export async function getServerSideProps(context) {
  const { req, res } = context;
  const { slug } = context.params;

  const nextToken: any = await getToken({ req });
  if (!nextToken) {
    return {
      redirect: {
        destination: `/api/auth/signin?callbackUrl=${req.url}`,
        permanent: false,
      },
    };
  }

  const { provider_account_id } = nextToken;
  const user = await prisma.user.findUniqueOrThrow({
    where: { slack_id: provider_account_id },
    select: {
      id: true,
      slack_id: true,
    },
  });

  const meeting = await prisma.event.findUnique({
    where: { slug },
    include: {
      exceptions: {
        orderBy: { start_time: "asc" },
      },
    },
  });

  if (!meeting) {
    return {
      redirect: {
        destination: `/meetings`,
        permanent: false,
      },
    };
  }

  // 30 minute checkin window
  const checkinWindowStart = dayjs().subtract(15, "minute");
  const checkinWindowEnd = dayjs().add(15, "minute");

  const { startTime: event_time } = getNextOccurrence(
    meeting,
    checkinWindowStart.toDate()
  );

  if (!event_time) {
    return {
      props: {
        meeting: { title: meeting.title },
        message: "It looks like there are no more meetings scheduled",
      },
    };
  }

  if (
    !checkinWindowStart.isSameOrBefore(event_time) ||
    !checkinWindowEnd.isSameOrAfter(event_time)
  ) {
    return {
      props: {
        meeting: { title: meeting.title },
        message: "It looks like you're outside the checkin window",
      },
    };
  }

  let message;
  try {
    await prisma.eventCheckin.create({
      data: {
        event_id: meeting.id,
        user_id: user.id,
        event_time,
      },
    });
    message = "Thanks for checking in!";
  } catch (err: any) {
    if (err.code === "P2002") {
      message = "It looks like you've already checked in to this meeting";
    } else {
      console.error(err);
      message = "There was a problem checking you in";
    }
  }

  return {
    props: {
      meeting: { title: meeting.title },
      message,
    },
  };
}
