import { defineConfig } from "cypress";
require("dotenv").config();

export default defineConfig({
  chromeWebSecurity: false,
  blockHosts: ["*.google-analytics.com", "*.onetrust.com", "*.cookielaw.org"],
  e2e: {
    setupNodeEvents(on, config) {
      config.env = config.env || {};

      config.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL;
      config.env.TEST_SLACK_USERNAME = process.env.TEST_SLACK_USERNAME;
      config.env.TEST_SLACK_PASSWORD = process.env.TEST_SLACK_PASSWORD;

      return config;
    },
    experimentalSessionAndOrigin: true,
  },
});
