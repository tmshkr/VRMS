import { app } from "app";

import { createMeeting } from "./createMeeting";
import { createProject } from "./createProject";
import { editMeeting } from "./editMeeting";
import { editProject } from "./editProject";

export const registerViewListeners = () => {
  app.view("create_project_modal", createProject);
  app.view("create_meeting_modal", createMeeting);

  app.view("edit_meeting_modal", editMeeting);
  app.view("edit_project_modal", editProject);

  console.log("⚡️ View listeners registered!");
};
