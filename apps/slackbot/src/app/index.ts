(BigInt as any).prototype.toJSON = function () {
  return this.toString();
};
const { App } = require("@slack/bolt");
import { installationStore } from "./installationStore";
import { registerActions } from "./actions";
import { registerEvents } from "./events";
import { registerViewListeners } from "./views/listeners";
import { registerCommands } from "./commands";

const appConfig: any = {
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  scopes: [
    "channels:history",
    "channels:join",
    "chat:write",
    "chat:write.public",
    "commands",
    "groups:history",
    "im:history",
    "im:read",
    "im:write",
    "mpim:history",
    "users:read",
    "users:read.email",
  ],
};

if (!process.env.ENABLE_DISTRIBUTION) {
  appConfig.token = process.env.SLACK_BOT_TOKEN;
} else {
  appConfig.port = 8000;
  appConfig.redirectUri = `${process.env.NEXTAUTH_URL}/slack/oauth_redirect`;
  appConfig.stateSecret = process.env.SLACK_STATE_SECRET;
  appConfig.installationStore = installationStore;
  appConfig.installerOptions = {
    redirectUriPath: "/slack/oauth_redirect",
    directInstall: true,
  };
}

export const app = new App(appConfig);

registerActions();
registerEvents();
registerViewListeners();
registerCommands();
