import { useEffect } from "react";
import EasyMDE from "easymde";
import "easymde/dist/easymde.min.css";

export default function MarkdownEditor({ easyMDEref, content }) {
  useEffect(() => {
    easyMDEref.current = new EasyMDE({
      element: document.getElementById("editor"),
      autosave: {
        enabled: true,
        uniqueId: "user_readme",
      },
    });
    easyMDEref.current.value(content || "");

    return () => {
      easyMDEref.current.cleanup();
      easyMDEref.current = null;
    };
  }, []);

  return <textarea id="editor"></textarea>;
}
