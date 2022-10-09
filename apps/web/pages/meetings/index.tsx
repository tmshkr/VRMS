import type { NextPage } from "next";
import prisma from "common/prisma";
import { NextSeo } from "next-seo";
import Link from "next/link";

const Meetings: NextPage = (props: any) => {
  const { meetings } = props;
  return (
    <>
      <NextSeo title="Meetings" />
      <h1>Meetings</h1>
      <ol>
        {meetings.map(({ slug, title }) => (
          <li key={slug}>
            <Link href={`/meetings/${slug}`}>{title}</Link>
          </li>
        ))}
      </ol>
    </>
  );
};

export default Meetings;

export async function getServerSideProps(context) {
  const meetings = await prisma.event.findMany({
    select: {
      title: true,
      slug: true,
    },
  });
  return {
    props: { meetings },
  };
}
