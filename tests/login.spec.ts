import { test, expect } from "@playwright/test";
import { getMongoClient } from "common/mongo";

test("logs into Slack and installs app", async ({ page }) => {
  await blockHosts(page);

  await page.goto(process.env.NEXTAUTH_URL);
  await page.locator('[data-test="signin-button"]').click();
  await page.getByText("Sign in with Slack").click();
  await page.waitForURL(/.*redir=/);
  const search = await page.url().split("?")[1];
  await page.goto(
    `https://meetbot-hq.slack.com/sign_in_with_password?${search}`
  );
  await page
    .locator('[data-qa="login_email"]')
    .fill(process.env.TEST_SLACK_USERNAME);
  await page
    .locator('[data-qa="login_password"]')
    .fill(process.env.TEST_SLACK_PASSWORD);
  await page.locator('[data-qa="signin_button"]').click();
  await page
    .locator('[data-qa="oauth_submit_button"]')
    .click({ timeout: 60 * 1000 });

  await page.locator('[data-test="add-to-slack-button"]').click();
  await page
    .locator('[data-qa="oauth_submit_button"]')
    .click({ timeout: 60 * 1000 });
  await expect(page.locator("h2")).toContainText(
    /Thank you!|Oops, Something Went Wrong!/
  );
  await expect(await getTeamInstall()).toBeTruthy();
});

async function blockHosts(page) {
  const blockedHosts = [
    /google-analytics\.com/,
    /onetrust\.com/,
    /cookielaw\.org/,
    /doubleclick\.net/,
  ];
  for (const host of blockedHosts) {
    await page.route(host, (route) => route.abort());
  }
}

async function getTeamInstall() {
  const mongoClient = await getMongoClient();
  let tries = 0;

  while (tries < 5) {
    const teamInstall = await mongoClient
      .db()
      .collection("slackTeamInstalls")
      .findOne({ _id: process.env.TEST_SLACK_TEAM_ID });
    if (teamInstall) {
      return teamInstall;
    }
    tries++;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
