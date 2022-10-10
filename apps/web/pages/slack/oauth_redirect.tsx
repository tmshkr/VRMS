import { useEffect } from "react";
export default function Redirect() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.href = `http://localhost:8000/slack/oauth_redirect${window.location.search}`;
    }
  }, []);
  return <div>Redirecting...</div>;
}
