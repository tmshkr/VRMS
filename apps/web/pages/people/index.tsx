import prisma from "common/prisma";
import Link from "next/link";
import { NextSeo } from "next-seo";

export default function People({ people }) {
  return (
    <div>
      <NextSeo title="People" />
      <h1>People</h1>
      <ol className="child:list-none p-0">
        {people.map(({ id, username, real_name }) => (
          <li key={id}>
            <Link href={`/people/${username || id}`}>{real_name}</Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

export async function getServerSideProps(context) {
  const people = await prisma.user.findMany({
    where: { visibility: "PUBLIC" },
    orderBy: { real_name: "asc" },
    select: { id: true, username: true, real_name: true },
  });

  return {
    props: { people },
  };
}
