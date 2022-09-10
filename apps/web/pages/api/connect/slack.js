import jwt from "jsonwebtoken";
import { getToken } from "next-auth/jwt";
import { getMongoClient } from "lib/mongo";
import prisma from "lib/prisma";
import { notifyAccountConnected } from "lib/slack";

export default async function handler(req, res) {
  const nextToken = await getToken({ req });

  if (!nextToken) {
    res.redirect(`/api/auth/signin?callbackUrl=${req.url}`);
    return;
  }

  const {
    access_token,
    email,
    name,
    gh_username,
    provider,
    provider_account_id,
    scope,
    token_type,
    type,
    two_factor_authentication,
  } = nextToken;

  if (provider !== "github") {
    res.status(501).send("Provider not implemented");
    return;
  }

  try {
    var { vrms_user_id, slack_id } = jwt.verify(
      req.query.token,
      process.env.NEXTAUTH_SECRET
    );
  } catch (err) {
    console.error(err);
    res.status(400).send("Invalid token");
    return;
  }

  try {
    await prisma.account.create({
      data: {
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
        vrms_user_id,
      },
    });

    console.log("Account connected", {
      vrms_user_id,
      slack_id,
      provider,
      provider_account_id,
      gh_username,
    });

    res.redirect("/");
    notifyAccountConnected(slack_id, gh_username);

    // delete any unconnectedAccount for this user
    const mongoClient = await getMongoClient();
    mongoClient
      .db()
      .collection("unconnectedAccounts")
      .deleteOne({ provider, provider_account_id });
  } catch (err) {
    if (err.code === "P2002") {
      res.send("It looks like this account is already connected");
    } else {
      console.error(err);
      res.status(500).send("There was a problem connecting your account");
    }
  }
}
