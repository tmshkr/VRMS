import { app } from "app";
import { getMongoClient } from "common/mongo";

import { createMeetingModal } from "app/views/modals/createMeetingModal";
import { createProjectModal } from "app/views/modals/createProjectModal";
import { editProjectModal } from "app/views/modals/editProjectModal";
import { editMeetingModal } from "app/views/modals/editMeetingModal";

export const registerActions = () => {
  app.action("meeting_check_in", async ({ body, ack, say }) => {
    await ack();
    console.log(body);
    await say(`<@${body.user.id}> checked in`);
  });

  app.action("create_new_project", createProjectModal);
  app.action("create_new_meeting", createMeetingModal);

  app.action("edit_project", editProjectModal);
  app.action("edit_meeting", editMeetingModal);

  app.action("open_dashboard", async ({ body, ack, say }) => {
    await ack();
  });

  console.log("⚡️ Actions registered!");
};
