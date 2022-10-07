import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import Link from "next/link";
import prisma from "common/prisma";
import { getMongoClient } from "common/mongo";
import Markdown from "marked-react";
import { PencilAltIcon, CheckIcon } from "@heroicons/react/outline";
import { useForm } from "react-hook-form";

import { useAppDispatch, useAppSelector } from "src/store";
import { selectUser } from "src/store/user";

const MarkdownEditor = dynamic(() => import("components/MarkdownEditor"), {
  ssr: false,
});

const buttonStyles =
  "inline-flex items-center rounded border border-transparent bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2";

export default function ProfilePage(props) {
  const { meetings, projects } = props;
  const easyMDEref = useRef(null);
  const [isEditingReadme, setIsEditingReadme] = useState(false);
  const [profile, setProfile] = useState(props.profile);
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  const canEdit = user?.id === profile.id;

  const saveReadme = async () => {
    const readme = easyMDEref.current.value();
    await axios.put("/api/me", { readme });

    easyMDEref.current.toTextArea();
    easyMDEref.current.cleanup();
    easyMDEref.current = null;

    setProfile({ ...profile, readme });
    setIsEditingReadme(false);
  };

  const cancelReadmeChanges = () => {
    easyMDEref.current.toTextArea();
    easyMDEref.current.cleanup();
    easyMDEref.current = null;

    setIsEditingReadme(false);
  };

  const [isEditingHeadline, setIsEditingHeadline] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setFocus,
  } = useForm();
  const onSubmitRHF = async ({ headline }) => {
    await axios.put("/api/me", { headline });
    setProfile({ ...profile, headline });
    setIsEditingHeadline(false);
  };

  useEffect(() => {
    if (isEditingHeadline) {
      setFocus("headline");
    }
  }, [isEditingHeadline]);

  return (
    <div className="sm:flex">
      <Head>
        <title>{profile.real_name} | VRMS</title>
      </Head>
      <div>
        <img
          className="max-w-full sm:max-w-xs rounded-md m-auto"
          src={profile.profile_image}
        />
        <div className="">
          <div className="text-center p-3" suppressHydrationWarning>
            <h2 className="m-0">{profile.real_name}</h2>
            {isEditingHeadline ? (
              <form onSubmit={handleSubmit(onSubmitRHF)}>
                <input
                  className="text-center w-full"
                  defaultValue={profile.headline}
                  {...register("headline")}
                />
                <button
                  className="block m-auto p-4 cursor-pointer"
                  type="submit"
                >
                  <CheckIcon className="w-6" />
                </button>
              </form>
            ) : (
              <>
                <p className="m-0">{profile.headline} </p>
                {canEdit && (
                  <button
                    className="block m-auto p-4 cursor-pointer"
                    onClick={() => {
                      setIsEditingHeadline(true);
                    }}
                  >
                    <PencilAltIcon className="w-6" />
                  </button>
                )}
              </>
            )}
          </div>
          <div>
            <h3>Projects</h3>
            <ul>
              {projects.map(({ slug, name }) => {
                return (
                  <li key={slug}>
                    <Link href={`/projects/${slug}`}>{name}</Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <h3>Meetings</h3>
            <ul>
              {meetings.map(({ slug, title }) => {
                return (
                  <li key={slug}>
                    <Link href={`/meetings/${slug}`}>{title}</Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
      <div className="w-full px-4" suppressHydrationWarning>
        {isEditingReadme ? (
          <>
            <MarkdownEditor easyMDEref={easyMDEref} content={profile.readme} />
            <button className={buttonStyles} onClick={saveReadme}>
              Save
            </button>
            <button
              onClick={cancelReadmeChanges}
              className="inline-flex items-center rounded border border-transparent bg-indigo-100 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ml-2"
            >
              Cancel
            </button>
            <a
              target="_blank"
              className="block md:inline-block md:ml-2 my-2"
              rel="noopener noreferrer"
              href="https://digital.gov/pdf/GSA-TTS_Personal-README-template.pdf"
            >
              What is a personal README?
            </a>
          </>
        ) : (
          <>
            <Markdown className="w-full">
              {profile.readme ||
                `# Hello World\nIt looks like ${profile.first_name} hasn't filled out their personal README yet`}
            </Markdown>

            {canEdit && (
              <button
                className={buttonStyles}
                onClick={() => setIsEditingReadme(true)}
              >
                Edit README
              </button>
            )}
            <a
              target="_blank"
              className="block sm:inline-block sm:ml-2 my-2"
              rel="noopener noreferrer"
              href="https://digital.gov/pdf/GSA-TTS_Personal-README-template.pdf"
            >
              What is a personal README?
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const { slug } = context.params;

  const user = await prisma.user.findUnique({
    where: { username: slug },
    select: {
      id: true,
      first_name: true,
      profile_image: true,
      real_name: true,
      username: true,
      meeting_assignments: {
        select: { meeting: { select: { slug: true, title: true } } },
      },
      team_assignments: {
        select: { project: { select: { slug: true, name: true } } },
      },
    },
  });

  if (!user) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const {
    id,
    first_name,
    profile_image,
    real_name,
    username,
    meeting_assignments,
    team_assignments,
  } = user;

  const mongoClient = await getMongoClient();
  const doc = await mongoClient
    .db()
    .collection("userProfiles")
    .findOne({ _id: user.id.toString() });

  return {
    props: {
      profile: {
        id: id.toString(),
        headline: doc?.headline || "",
        first_name,
        profile_image,
        readme: doc?.readme || "",
        real_name,
        username,
      },
      meetings: meeting_assignments.map(({ meeting }) => meeting),
      projects: team_assignments.map(({ project }) => project),
    },
  };
}
