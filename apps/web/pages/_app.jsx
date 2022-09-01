import { SessionProvider } from "next-auth/react";
import { Dashboard } from "components/Dashboard";

import "../styles/globals.scss";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <SessionProvider session={session}>
      <Dashboard>
        <Component {...pageProps} />
      </Dashboard>
    </SessionProvider>
  );
}
