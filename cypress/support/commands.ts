/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject = any> {
    login(search?: string): Chainable<any>;
  }
}

Cypress.Commands.add("login", (search?: string) => {
  const url = `https://meetbot-hq.slack.com/sign_in_with_password${
    search || ""
  }`;
  cy.visit(url);
  cy.get('[data-qa="login_email"]').type(Cypress.env("TEST_SLACK_USERNAME"));
  cy.get('[data-qa="login_password"]').type(Cypress.env("TEST_SLACK_PASSWORD"));
  cy.get('[data-qa="signin_button"]').click();
});
