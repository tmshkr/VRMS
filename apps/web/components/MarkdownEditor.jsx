import { useEffect } from "react";
import EasyMDE from "easymde";
import "easymde/dist/easymde.min.css";

export default function MarkdownEditor({ easyMDEref }) {
  useEffect(() => {
    easyMDEref.current = new EasyMDE({
      element: document.getElementById("editor"),
      autosave: {
        enabled: true,
        uniqueId: "user_readme",
      },
    });

    return () => {
      easyMDEref.current.cleanup();
      easyMDEref.current = null;
    };
  }, []);

  return <textarea id="editor"></textarea>;
}
