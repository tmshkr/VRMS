/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject = any> {
    login(username, password): Chainable<any>;
  }
}

Cypress.Commands.add("login", (username, password) => {
  cy.visit("https://meetbot-hq.slack.com/");
  cy.get('[data-qa="login_email"]').type(username);
  cy.get('[data-qa="login_password"]').type(password);
  cy.get('[data-qa="signin_button"]').click();
});
