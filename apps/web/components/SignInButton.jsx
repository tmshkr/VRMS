import { signIn } from "next-auth/react";
import { Menu } from "@headlessui/react";

export default function SignInButton({ user }) {
  return user ? (
    <div>
      <Menu.Button className="max-w-xs bg-white flex items-center text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        <span className="sr-only">Open user menu</span>
        <div className="mr-4 text-right">
          <div className="text-gray-800">{user.name}</div>
          <div className="text-gray-500">{user.email}</div>
        </div>
        <img
          className="h-8 w-8 rounded-full"
          src={user?.image || undefined}
          alt=""
        />
      </Menu.Button>
    </div>
  ) : (
    <a
      href={`/api/auth/signin`}
      className="text-white py-3 px-4 rounded-md no-underline"
      style={{ background: "var(--hackforla-red)" }}
      onClick={(e) => {
        e.preventDefault();
        signIn();
      }}
    >
      Sign in
    </a>
  );
}
