import type { NextPage } from "next";
import prisma from "common/prisma";
import { NextSeo } from "next-seo";
import Link from "next/link";

const Projects: NextPage = (props: any) => {
  const { projects } = props;
  return (
    <>
      <NextSeo title="Projects" />
      <h1>Projects</h1>
      <ol>
        {projects.map(({ name, slug }) => (
          <li key={slug}>
            <Link href={`/projects/${slug}`}>{name}</Link>
          </li>
        ))}
      </ol>
    </>
  );
};

export default Projects;

export async function getServerSideProps(context) {
  const projects = await prisma.project.findMany({
    select: { name: true, slug: true },
    where: { is_active: true, visibility: "PUBLIC" },
  });
  return {
    props: { projects },
  };
}
