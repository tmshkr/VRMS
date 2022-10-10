import { useEffect } from "react";
export default function Redirect() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.href = "http://localhost:8000/slack/install";
    }
  }, []);
  return <div>Redirecting...</div>;
}
