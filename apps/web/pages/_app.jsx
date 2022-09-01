import "../styles/globals.scss";
import { SessionProvider } from "next-auth/react";
import { useSession } from "next-auth/react";
import { Dashboard } from "components/Dashboard";
import Cookies from "js-cookie";

// Use of the <SessionProvider> is mandatory to allow components that call
// `useSession()` anywhere in your application to access the `session` object.
export default function App({ Component, pageProps }) {
  const cookies = Cookies.get();
  if (cookies) {
    const { redirect_to } = cookies;
    if (redirect_to) {
      Cookies.remove("redirect_to");
      window.location.replace(redirect_to);
      return null;
    }
  }

  return (
    <SessionProvider session={pageProps.session} refetchInterval={0}>
      <Dashboard>
        {Component.auth ? (
          <Auth pageAuth={Component.auth}>
            <Component {...pageProps} />
          </Auth>
        ) : (
          <Component {...pageProps} />
        )}
      </Dashboard>
    </SessionProvider>
  );
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
