import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useLocalStorage } from "hooks/useLocalStorage";
import dynamic from "next/dynamic";
import Link from "next/link";
import prisma from "lib/prisma";
import { getMongoClient } from "lib/mongo";
import Markdown from "marked-react";
import { PencilAltIcon, CheckIcon } from "@heroicons/react/outline";
import { useForm } from "react-hook-form";

const MarkdownEditor = dynamic(() => import("components/MarkdownEditor"), {
  ssr: false,
});

const buttonStyles =
  "inline-flex items-center rounded border border-transparent bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2";

export default function UserProfile(props) {
  const { meetings, projects } = props;
  const easyMDEref = useRef(null);
  const [isEditingReadme, setIsEditingReadme] = useState(false);
  const [userProfile, setUserProfile] = useState(props.userProfile);
  const [user] = useLocalStorage("user");
  const canEdit = user?.vrms_user?.id === userProfile.id;

  const saveReadme = async () => {
    const readme = easyMDEref.current.value();
    await axios.put("/api/me", { readme });

    easyMDEref.current.toTextArea();
    easyMDEref.current.cleanup();
    easyMDEref.current = null;

    setUserProfile({ ...userProfile, readme });
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
    setUserProfile({ ...userProfile, headline });
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
        <title>{userProfile.real_name} | VRMS</title>
      </Head>
      <div>
        <img
          className="max-w-full sm:max-w-xs rounded-md m-auto"
          src={userProfile.profile_image}
        />
        <div className="">
          <div className="text-center p-3" suppressHydrationWarning>
            <h2 className="m-0">{userProfile.real_name}</h2>
            {isEditingHeadline ? (
              <form onSubmit={handleSubmit(onSubmitRHF)}>
                <input
                  className="text-center w-full"
                  defaultValue={userProfile.headline}
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
                <p className="m-0">{userProfile.headline} </p>
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
              {projects.map((project) => {
                const { id, name } = project;
                return (
                  <li key={id}>
                    <Link href={`/projects/${id}`}>{name}</Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <h3>Meetings</h3>
            <ul>
              {meetings.map((meeting) => {
                const { id, title } = meeting;
                return (
                  <li key={id}>
                    <Link href={`/meetings/${id}`}>{title}</Link>
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
            <MarkdownEditor
              easyMDEref={easyMDEref}
              content={userProfile.readme}
            />
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
              {userProfile.readme ||
                `# Hello World\nIt looks like ${userProfile.first_name} hasn't filled out their personal README yet`}
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

  const select = {
    id: true,
    first_name: true,
    headline: true,
    profile_image: true,
    real_name: true,
    username: true,
    meeting_assignments: {
      select: { meeting: { select: { id: true, title: true } } },
    },
    team_assignments: {
      select: { project: { select: { id: true, name: true } } },
    },
  };

  // URL slug param can be either a username or a user id
  let user;
  if (Number(slug)) {
    user = await prisma.user.findUnique({
      where: { id: Number(slug) },
      select,
    });
  } else {
    user = await prisma.user.findUnique({
      where: { username: slug },
      select,
    });
  }

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
    headline,
    profile_image,
    real_name,
    username,
    meeting_assignments,
    team_assignments,
  } = user;

  const mongoClient = await getMongoClient();
  const { readme } = await mongoClient
    .db()
    .collection("userReadmes")
    .findOne({ user_id: user.id });

  return {
    props: {
      userProfile: {
        id,
        headline,
        first_name,
        profile_image,
        readme,
        real_name,
        username,
      },
      meetings: meeting_assignments.map(({ meeting }) => meeting),
      projects: team_assignments.map(({ project }) => project),
    },
  };
}
