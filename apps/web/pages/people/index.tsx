import prisma from "lib/prisma";
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
    await prisma.$queryRaw`SELECT id, headline, last_name, profile_image, readme, real_name, username FROM "User" ORDER BY lower(real_name) ASC`;

  return {
    props: { people },
  };
}
