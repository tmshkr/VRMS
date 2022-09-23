import prisma from "common/prisma";
import Link from "next/link";

export default function Web({ people }) {
  return (
    <div>
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
  const people =
    await prisma.$queryRaw`SELECT id, real_name, username FROM "User" ORDER BY lower(real_name) ASC`;

  return {
    props: { people },
  };
}
