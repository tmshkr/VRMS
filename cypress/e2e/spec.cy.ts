describe("Slack Integration", () => {
  beforeEach(() => {
    cy.dashboardLogin();
    cy.visit(Cypress.env("NEXTAUTH_URL"));
  });

  it("displays the Slack user's email", () => {
    cy.get('[data-cy="user-email"]').should(
      "contain",
      Cypress.env("TEST_SLACK_USERNAME")
    );
  });

  it("still displays the Slack user's email", () => {
    cy.get('[data-cy="user-email"]').should(
      "contain",
      Cypress.env("TEST_SLACK_USERNAME")
    );
  });

  it("installs the Slack app", () => {
    cy.get('[data-cy="add-to-slack-button"]').click();
    cy.get('[data-qa="oauth_submit_button"]').click();
  });
});
