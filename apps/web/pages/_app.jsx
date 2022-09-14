import "../styles/globals.scss";
import { SessionProvider } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { Provider } from "react-redux";
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

  useEffect(() => {
    if (status === "authenticated") {
      dispatch(fetchUser(session.user));

      // if (!user.onboarding_complete) {
      //   router.push("/onboard");
      // }
    } else if (status === "unauthenticated") {
      dispatch(clearUser());
    }
  }, [status]);

  if (status === "loading") {
    return <h1 className="mt-12 text-center">Loading...</h1>;
  }

  return children;
}

function Auth({ pageAuth, children }) {
  // if `{ required: true }` is supplied, `status` can only be "loading" or "authenticated"
  const { data, status } = useSession({ required: true });
  const { allowedRoles } = pageAuth;

  if (status === "loading") {
    return <h1 className="mt-12 text-center">Loading...</h1>;
  }

  if (data.user.vrms_user) {
    const { app_roles } = data.user.vrms_user;

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
