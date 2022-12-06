describe("Sign in to Slack", () => {
  it("signs in to the web dashboard with Slack", () => {
    cy.visit(Cypress.env("NEXTAUTH_URL"));
    cy.get('[data-cy="signin"]').click();
    cy.contains("Sign in with Slack").click();
    cy.location("search")
      .should("contain", "redir=")
      .then((search) => {
        cy.login(search);
      });
    cy.get('[data-qa="oauth_submit_button"]').click();
    cy.get('[data-cy="user-email"]').should(
      "contain",
      Cypress.env("TEST_SLACK_USERNAME")
    );
  });
});
