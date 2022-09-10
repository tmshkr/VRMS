import { useEffect } from "react";
import EasyMDE from "easymde";
import "easymde/dist/easymde.min.css";

export default function MarkdownEditor({ easyMDEref }) {
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const easyMDE = new EasyMDE({
        element: document.getElementById("editor"),
        autosave: {
          enabled: true,
          uniqueId: "user_readme",
        },
      });
      easyMDEref.current = easyMDE;
    }
  }, []);

  return <textarea id="editor"></textarea>;
}
