(BigInt as any).prototype.toJSON = function () {
  return this.toString();
};
const { App } = require("@slack/bolt");
import { getMongoClient } from "common/mongo";
import { registerActions } from "./actions";
import { registerEvents } from "./events";
import { registerViewListeners } from "./views/listeners";
import { registerCommands } from "./commands";

export const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: process.env.SLACK_STATE_SECRET,
  scopes: ["channels:history", "chat:write", "commands"],
  port: 8000,
  redirectUri: process.env.SLACK_INSTALL_REDIRECT_URI,
  installerOptions: {
    redirectUriPath: "/slack/oauth_redirect",
  },
  installationStore: {
    storeInstallation: async (installation) => {
      const mongoClient = await getMongoClient();
      if (
        installation.isEnterpriseInstall &&
        installation.enterprise !== undefined
      ) {
        return await mongoClient
          .db()
          .collection("slackEnterpriseInstalls")
          .updateOne(
            { _id: installation.enterprise.id },
            {
              $set: { ...installation, updatedAt: new Date() },
              $setOnInsert: { createdAt: new Date() },
            },
            { upsert: true }
          );
      }
      if (installation.team !== undefined) {
        return await mongoClient
          .db()
          .collection("slackTeamInstalls")
          .updateOne(
            { _id: installation.team.id },
            {
              $set: { ...installation, updatedAt: new Date() },
              $setOnInsert: { createdAt: new Date() },
            },
            { upsert: true }
          );
      }
      throw new Error("Failed saving installation data to installationStore");
    },
    fetchInstallation: async (installQuery) => {
      const mongoClient = await getMongoClient();
      if (
        installQuery.isEnterpriseInstall &&
        installQuery.enterpriseId !== undefined
      ) {
        return await mongoClient
          .db()
          .collection("slackEnterpriseInstalls")
          .findOne({ _id: installQuery.enterpriseId });
      }
      if (installQuery.teamId !== undefined) {
        return await mongoClient
          .db()
          .collection("slackTeamInstalls")
          .findOne({ _id: installQuery.teamId });
      }
      throw new Error("Failed fetching installation");
    },
    deleteInstallation: async (installQuery) => {
      const mongoClient = await getMongoClient();
      if (
        installQuery.isEnterpriseInstall &&
        installQuery.enterpriseId !== undefined
      ) {
        return await mongoClient
          .db()
          .collection("slackEnterpriseInstalls")
          .deleteOne({ _id: installQuery.enterpriseId });
      }
      if (installQuery.teamId !== undefined) {
        return await mongoClient
          .db()
          .collection("slackTeamInstalls")
          .deleteOne({ _id: installQuery.teamId });
      }
      throw new Error("Failed to delete installation");
    },
  },
});

registerActions();
registerEvents();
registerViewListeners();
registerCommands();
