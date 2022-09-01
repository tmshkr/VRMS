/* This example requires Tailwind CSS v2.0+ */
import { Fragment, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { MenuIcon, XIcon } from "@heroicons/react/outline";
import { getPathRoot } from "utils/path";
import { useLocalStorage } from "hooks/useLocalStorage";
import Logo from "assets/logo-hfla.svg";

import dynamic from "next/dynamic";

const SignInButton = dynamic(() => import("./SignInButton"), {
  ssr: false,
});

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

declare var window: any;
declare var document: any;

export function Dashboard({ children }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useLocalStorage("user", session?.user);
  const pathRoot = getPathRoot(router.pathname);
  const navigation = [
    { name: "Dashboard", href: "/", current: pathRoot === "/" },
    { name: "Meetings", href: "/meetings", current: pathRoot === "/meetings" },
    { name: "Projects", href: "/projects", current: pathRoot === "/projects" },
  ];

  useEffect(() => {
    if (status === "authenticated") {
      const user: any = session.user;
      setUser(user);
      // if (!user.onboarding_complete) {
      //   router.push("/onboard");
      // }
    } else if (status === "unauthenticated") {
      setUser(null);
    }
  }, [status]);

  return (
    <>
      <div className="min-h-full">
        <Disclosure as="nav" className="bg-white border-b border-gray-200">
          {({ open, close }) => {
            if (open) {
              document.documentElement.style.cursor = "pointer";
              window.onclick = close;
            } else if (
              typeof document !== "undefined" &&
              typeof window !== "undefined"
            ) {
              window.onclick = null;
              document.documentElement.style.cursor = null;
            }
            return (
              <>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between h-16">
                    <div className="flex">
                      <div className="flex-shrink-0 flex items-center">
                        <Link href="/">
                          <a className="hover:bg-transparent">
                            <Logo className="w-12 cursor-pointer" />
                          </a>
                        </Link>
                      </div>
                      <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
                        {navigation.map((item) => (
                          <Link key={item.name} href={item.href} passHref>
                            <a
                              className={classNames(
                                item.current
                                  ? "border-indigo-500 text-gray-900"
                                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                                "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium no-underline hover:bg-transparent"
                              )}
                              aria-current={item.current ? "page" : undefined}
                            >
                              {item.name}
                            </a>
                          </Link>
                        ))}
                      </div>
                    </div>
                    <div className="hidden sm:ml-6 sm:flex sm:items-center">
                      {/* Profile dropdown */}
                      <Menu as="div" className="ml-3 relative">
                        <SignInButton user={user} />
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-200"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <Menu.Item>
                              <Link
                                href="/admin"
                                legacyBehavior={false}
                                className="block px-4 py-2 text-sm text-gray-700"
                              >
                                Admin
                              </Link>
                            </Menu.Item>
                            <Menu.Item>
                              <Link
                                href={`/api/auth/signout`}
                                passHref
                                legacyBehavior={false}
                                onClick={(e) => {
                                  e.preventDefault();
                                  signOut();
                                }}
                                className={
                                  "block px-4 py-2 text-sm text-gray-700"
                                }
                              >
                                Sign out
                              </Link>
                            </Menu.Item>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </div>
                    <div className="-mr-2 flex items-center sm:hidden">
                      {/* Mobile menu button */}
                      <Disclosure.Button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <span className="sr-only">Open main menu</span>
                        {open ? (
                          <XIcon className="block h-6 w-6" aria-hidden="true" />
                        ) : (
                          <MenuIcon
                            className="block h-6 w-6"
                            aria-hidden="true"
                          />
                        )}
                      </Disclosure.Button>
                    </div>
                  </div>
                </div>

                <Disclosure.Panel className="sm:hidden">
                  <div className="pt-2 pb-3 space-y-1">
                    {navigation.map((item) => (
                      <Link key={item.name} href={item.href} passHref>
                        <Disclosure.Button
                          key={item.name}
                          as="a"
                          href={item.href}
                          className={classNames(
                            item.current
                              ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                              : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800",
                            "block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                          )}
                          aria-current={item.current ? "page" : undefined}
                        >
                          {item.name}
                        </Disclosure.Button>
                      </Link>
                    ))}
                  </div>
                  <div className="pt-4 pb-3 border-t border-gray-200">
                    <div className="flex items-center px-4">
                      {user && (
                        <>
                          <div className="flex-shrink-0">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={user?.image || undefined}
                              alt=""
                            />
                          </div>
                          <div className="ml-3">
                            <div className="text-base font-medium text-gray-800">
                              {user.name}
                            </div>
                            <div className="text-sm font-medium text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="mt-3 space-y-1">
                      <Disclosure.Button
                        as="a"
                        href={user ? `/api/auth/signout` : `/api/auth/signin`}
                        className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                        onClick={(e) => {
                          e.preventDefault();
                          user ? signOut() : signIn();
                        }}
                      >
                        {user ? "Sign out" : "Sign in"}
                      </Disclosure.Button>
                    </div>
                  </div>
                </Disclosure.Panel>
              </>
            );
          }}
        </Disclosure>

        <div className="py-10">
          <main>
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
              {/* Replace with your content */}
              <div className="px-4 py-8 sm:px-0">{children}</div>
              {/* /End replace */}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
