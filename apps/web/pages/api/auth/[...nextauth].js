import NextAuth from "next-auth";
import SlackProvider from "next-auth/providers/slack";
import prisma from "common/prisma";
import { getMongoClient } from "common/mongo";

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options

export default NextAuth({
  providers: [
    SlackProvider({
      clientId: process.env.SLACK_CLIENT_ID,
      clientSecret: process.env.SLACK_CLIENT_SECRET,
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

      return session;
    },
    async jwt(args) {
      const { token, account } = args;

      // account is available during sign in
      if (account) {
        const {
          provider,
          type,
          providerAccountId: provider_account_id,
          access_token,
          token_type,
        } = account;

        token.provider = provider;
        token.provider_account_id = provider_account_id;
        token.access_token = access_token;
        token.token_type = token_type;
        token.type = type;
      }

      return token;
    },
  },
});
