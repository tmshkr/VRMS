import { app } from "app";
import { getMongoClient } from "lib/mongo";

import { createMeetingModal } from "app/views/modals/createMeetingModal";
import { createProjectModal } from "app/views/modals/createProjectModal";

export const registerActions = () => {
  app.action("meeting_check_in", async ({ body, ack, say }) => {
    await ack();
    console.log(body);
    await say(`<@${body.user.id}> checked in`);
  });

  app.action("create_new_project", createProjectModal);
  app.action("create_new_meeting", createMeetingModal);

  app.action("open_dashboard", async ({ body, ack, say }) => {
    await ack();
  });

  app.action("role_select", async ({ body, client, ack, logger }) => {
    await ack();
    const selectedRole = body.actions[0].selected_option.value;
    const mongoClient = await getMongoClient();
    mongoClient
      .db()
      .collection("onboarding")
      .updateOne(
        { _id: body.user.id },
        { $set: { selectedRole } },
        { upsert: true }
      );

    switch (selectedRole) {
      case "role_data":
        console.log("user selected role_data");
        break;
      case "role_engineering":
        console.log("user selected role_engineering");
        break;
      case "role_product":
        console.log("user selected role_product");
        break;
      case "role_ux":
        console.log("user selected role_ux");
        break;
      default:
        break;
    }
  });

  console.log("⚡️ Actions registered!");
};
