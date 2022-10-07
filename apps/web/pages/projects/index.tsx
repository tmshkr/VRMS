import type { NextPage } from "next";
import prisma from "common/prisma";
import Head from "next/head";
import Link from "next/link";

const Projects: NextPage = (props: any) => {
  const { projects } = props;
  return (
    <>
      <Head>
        <title>Projects | VRMS</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
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
  });
  return {
    props: { projects },
  };
}
