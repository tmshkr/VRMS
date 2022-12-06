/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject = any> {
    dashboardLogin(): Chainable<any>;
  }
}

Cypress.Commands.add("dashboardLogin", () => {
  cy.session(Cypress.env("TEST_SLACK_USERNAME"), () => {
    cy.visit(Cypress.env("NEXTAUTH_URL"));
    cy.get('[data-cy="signin"]').click();
    cy.contains("Sign in with Slack").click();

    cy.origin(`slack.com`, () => {
      cy.location("search")
        .should("contain", "redir=")
        .then((search) => {
          cy.visit(
            `https://meetbot-hq.slack.com/sign_in_with_password${search}`
          );
        });
    });

    cy.origin(`meetbot-hq.slack.com`, () => {
      cy.get('[data-qa="login_email"]').type(
        Cypress.env("TEST_SLACK_USERNAME")
      );
      cy.get('[data-qa="login_password"]').type(
        Cypress.env("TEST_SLACK_PASSWORD")
      );
      cy.get('[data-qa="signin_button"]').click();
      cy.get('[data-qa="oauth_submit_button"]').click();
    });

    cy.get('[data-cy="user-email"]').should(
      "contain",
      Cypress.env("TEST_SLACK_USERNAME")
    );

    // Install Slack app
    cy.get('[data-cy="add-to-slack-button"]').click();

    cy.origin(`meetbot-hq.slack.com`, () => {
      cy.get('[data-qa="oauth_submit_button"]').click();
    });
  });
});
