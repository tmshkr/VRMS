import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useLocalStorage } from "hooks/useLocalStorage";
import dynamic from "next/dynamic";
import prisma from "lib/prisma";
import Markdown from "marked-react";
import { PencilAltIcon, CheckIcon } from "@heroicons/react/outline";
import { useForm } from "react-hook-form";

// const classNames = require("classnames");

const MarkdownEditor = dynamic(() => import("components/MarkdownEditor"), {
  ssr: false,
});

const buttonStyles =
  "inline-flex items-center rounded border border-transparent bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2";

export default function UserProfile(props) {
  const easyMDEref = useRef(null);
  const [isEditingReadme, setIsEditingReadme] = useState(false);
  const [userProfile, setUserProfile] = useState(props.userProfile);
  const [user] = useLocalStorage("user");
  const canEdit = user?.vrms_user.id === userProfile.id;
  const sumbitReadme = async () => {
    const { data } = await axios.put("/api/me", {
      readme: easyMDEref.current.value(),
    });

    easyMDEref.current.toTextArea();
    setIsEditingReadme(false);
    setUserProfile(data);
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
    const { data } = await axios.put("/api/me", {
      headline,
    });
    setUserProfile(data);
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
          <p>projects...</p>
          <p>meetings...</p>
        </div>
      </div>
      <div className="w-full px-4" suppressHydrationWarning>
        {isEditingReadme ? (
          <>
            <MarkdownEditor
              easyMDEref={easyMDEref}
              content={userProfile.readme}
            />
            <button className={buttonStyles} onClick={sumbitReadme}>
              Submit
            </button>
          </>
        ) : (
          <>
            <Markdown className="w-full">{userProfile.readme}</Markdown>
            {canEdit && (
              <>
                <button
                  className={buttonStyles}
                  onClick={() => setIsEditingReadme(true)}
                >
                  Edit README
                </button>
                <a
                  className="ml-2"
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://digital.gov/pdf/GSA-TTS_Personal-README-template.pdf"
                >
                  What is a personal README?
                </a>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const { id } = context.params;

  const select = {
    id: true,
    headline: true,
    profile_image: true,
    readme: true,
    real_name: true,
    username: true,
  };
  let user;

  // URL param can be either a username or a user id
  if (Number(id)) {
    user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select,
    });
  } else {
    user = await prisma.user.findUnique({
      where: { username: id },
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

  return {
    props: {
      userProfile: user,
    },
  };
}
