// global-setup.ts
import { chromium, expect, FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("https://localhost:3000");
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
  await page.locator('[data-qa="oauth_submit_button"]').click();
  await page.locator('[data-test="add-to-slack-button"]').click();
  await page.locator('[data-qa="oauth_submit_button"]').click();
  await expect(page.locator("h2")).toContainText("Thank you!");
  // Save signed-in state to 'storageState.json'.
  await page.context().storageState({ path: "storageState.json" });
  await browser.close();
}

export default globalSetup;
