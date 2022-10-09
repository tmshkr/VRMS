import { getMongoClient } from "common/mongo";
import { seedUsers } from "common/slack/seedUsers";

export const installationStore = {
  storeInstallation: async (installation) => {
    const mongoClient = await getMongoClient();
    seedUsers(installation);
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
    console.log(installQuery);
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
};
