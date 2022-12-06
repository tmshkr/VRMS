import { test, expect } from "@playwright/test";

test("displays logged in user's email", async ({ page }) => {
  await page.goto("https://localhost:3000");
  await expect(page.locator('[data-test="user-email"]')).toContainText(
    process.env.TEST_SLACK_USERNAME
  );
});
