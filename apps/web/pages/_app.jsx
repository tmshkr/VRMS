import "../styles/globals.scss";
import { SessionProvider } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { Provider } from "react-redux";
import { DefaultSeo } from "next-seo";

import { Dashboard } from "components/Dashboard";
import { useEffect } from "react";

import store from "src/store";
import { useAppDispatch, useAppSelector } from "src/store";
import { fetchUser, clearUser, selectUser } from "src/store/user";

// Use of the <SessionProvider> is mandatory to allow components that call
// `useSession()` anywhere in your application to access the `session` object.
export default function App({ Component, pageProps }) {
  return (
    <SessionProvider session={pageProps.session} refetchInterval={0}>
      <Provider store={store}>
        <DefaultSeo
          openGraph={{
            type: "website",
            locale: "en_US",
            url: "https://meetbot.app/",
            site_name: "meetbot.app",
            description: "Meetbot helps you run meetings in Slack.",
          }}
          titleTemplate="%s | Meetbot"
          defaultTitle="Meetbot"
        />
        <Login>
          <Dashboard>
            {Component.auth ? (
              <Auth pageAuth={Component.auth}>
                <Component {...pageProps} />
              </Auth>
            ) : (
              <Component {...pageProps} />
            )}
          </Dashboard>
        </Login>
      </Provider>
    </SessionProvider>
  );
}

function Login({ children }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  useEffect(() => {
    if (status === "authenticated") {
      dispatch(fetchUser(session.user));
    } else if (status === "unauthenticated") {
      dispatch(clearUser());
    }
  }, [status]);

  // useEffect(() => {
  //   if (user && !user.completed_onboarding) {
  //     router.push("/onboard");
  //   }
  // }, [user]);

  return children;
}

function Auth({ pageAuth, children }) {
  // if `{ required: true }` is supplied, `status` can only be "loading" or "authenticated"
  const { data, status } = useSession({ required: true });
  const user = useAppSelector(selectUser);

  const { allowedRoles } = pageAuth;

  if (status === "loading") {
    return <h1 className="mt-12 text-center">Loading...</h1>;
  }

  // if there are no allowedRoles specified,
  // then only require that the user be logged in
  if (!allowedRoles) {
    return children;
  }

  if (user) {
    const { app_roles } = user;

    for (const role of app_roles) {
      if (allowedRoles.includes(role)) {
        return children;
      }
    }
  }

  return (
    <h1 className="mt-12 text-center">
      You are not authorized to access this page
    </h1>
  );
}
