import { app } from "app";
import { getBlocks } from "utils/getBlocks";

export const registerCommands = () => {
  app.command("/onboard", async ({ ack, body, client, logger }) => {
    await ack();
    try {
      const reply: any = await getBlocks("onboarding/0-welcome.md");
      await client.chat.postMessage({
        channel: body.user_id,
        text: reply.text,
        blocks: reply.blocks,
      });
    } catch (error) {
      logger.error(error);
    }
  });

  console.log("⚡️ Commands registered!");
};
