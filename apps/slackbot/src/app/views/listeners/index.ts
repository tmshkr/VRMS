import { app } from "app";

import { createProject } from "./createProject";
import { createMeeting } from "./createMeeting";

export const registerViewListeners = () => {
  app.view("create_project_modal", createProject);
  app.view("create_meeting_modal", createMeeting);

  console.log("⚡️ View listeners registered!");
};
