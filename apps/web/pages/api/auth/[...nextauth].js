import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import prisma from "lib/prisma";
import { getMongoClient } from "lib/mongo";

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options

const nextAuthOptions = (req, res) => {
  return {
    providers: [
      GitHubProvider({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
      }),
    ],
    theme: {
      colorScheme: "light",
    },
    callbacks: {
      async signIn(args) {
        return true;
      },
      async redirect(args) {
        const { url, baseUrl } = args;
        return url;
      },
      async session(args) {
        const { session, token } = args;
        const { gh_username, two_factor_authentication } = token;

        session.user.gh_username = gh_username;
        session.user.two_factor_authentication = two_factor_authentication;

        return session;
      },
      async jwt(args) {
        const { token, user, account, profile } = args;

        // account, profile, and user are available during sign in
        if (account && profile && user) {
          const { name, email } = user;
          const {
            provider,
            type,
            providerAccountId: provider_account_id,
            access_token,
            token_type,
            scope,
          } = account;
          const { login: gh_username, two_factor_authentication } = profile;

          token.provider = provider;
          token.provider_account_id = provider_account_id;
          token.gh_username = gh_username;
          token.access_token = access_token;
          token.token_type = token_type;
          token.type = type;
          token.scope = scope;
          token.two_factor_authentication = two_factor_authentication;

          await prisma.account
            .update({
              where: {
                provider_provider_account_id: { provider, provider_account_id },
              },
              data: {
                access_token,
                email,
                gh_username,
                name,
                scope,
                token_type,
                type,
                two_factor_authentication,
              },
            })
            .catch(async (err) => {
              const { meta } = err;
              if (meta.cause === "Record to update not found.") {
                console.log("User logged in without an existing VRMS account");
                // save unconnected account to mongo
                const mongoClient = await getMongoClient();
                mongoClient.db().collection("unconnectedAccounts").updateOne(
                  { provider, provider_account_id },
                  {
                    $set: {
                      provider,
                      provider_account_id,
                      access_token,
                      email,
                      gh_username,
                      name,
                      scope,
                      token_type,
                      type,
                      two_factor_authentication,
                    },
                  },
                  { upsert: true }
                );
              } else {
                console.error(err);
              }
            });
        }

        return token;
      },
    },
  };
};

export default (req, res) => {
  return NextAuth(req, res, nextAuthOptions(req, res));
};
