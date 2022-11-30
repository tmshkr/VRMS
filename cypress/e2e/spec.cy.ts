describe("Sign in to Slack", () => {
  it("signs in to Slack", () => {
    cy.login(
      Cypress.env("TEST_SLACK_USERNAME"),
      Cypress.env("TEST_SLACK_PASSWORD")
    );
  });
});
