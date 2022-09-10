import Head from "next/head";
import { useRef } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import prisma from "lib/prisma";
import Markdown from "marked-react";

const MarkdownEditor = dynamic(() => import("components/MarkdownEditor"), {
  ssr: false,
});

export default function UserProfile(props) {
  const { user } = props;
  const easyMDEref = useRef(null);
  const sumbitReadme = async () => {
    const { data } = await axios.put("/api/user/readme", {
      readme: easyMDEref.current.value(),
    });
    console.log(data);
  };

  return (
    <div>
      <div className="flex">
        <img className="max-w-xs rounded-md" src={user.profile_image} />
        <div className="px-4">
          <h2 className="mt-0">{user.real_name}</h2>
          <p>meetings...</p>``
          <p>projects...</p>
        </div>
      </div>
      <Markdown>{user.readme}</Markdown>
      <MarkdownEditor easyMDEref={easyMDEref} />
      <button onClick={sumbitReadme}>Submit</button>
    </div>
  );
}

export async function getServerSideProps(context) {
  const { username } = context.params;
  const select = {
    id: true,
    profile_image: true,
    readme: true,
    real_name: true,
    username: true,
  };
  let user;

  if (Number(username)) {
    const id = Number(username);
    user = await prisma.user.findUnique({
      where: { id },
      select,
    });
  } else {
    user = await prisma.user.findUnique({
      where: { username },
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
      user,
    },
  };
}
