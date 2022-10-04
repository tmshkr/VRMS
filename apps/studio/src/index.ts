import express from "express";
import { jwtDecrypt } from "jose";
import hkdf from "@panva/hkdf";

import { PrismaClient } from "@prisma/client";
const prisma: PrismaClient = new PrismaClient();

const { createProxyMiddleware } = require("http-proxy-middleware");
const Cookies = require("cookies");

const app = express();
const port = 5000;

app.use(async (req, res, next) => {
  const cookies = new Cookies(req, res);
  const cookieName = process.env.NEXTAUTH_URL?.startsWith("https://")
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  try {
    const token = cookies.get(cookieName);
    var payload: any = await decode({
      token,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!payload) {
      console.log({ token });
      throw new Error("No payload");
    }
  } catch (err) {
    console.log(err);
    res.status(401).send("Unauthorized");
    return;
  }

  const { provider_account_id } = payload;
  const app_roles: any = await prisma.user
    .findUnique({
      where: { slack_id: provider_account_id },
      select: { app_roles: true },
    })
    .then((result) => {
      if (!result) return [];
      return result.app_roles.map(({ role }) => role);
    });

  if (app_roles.includes("ADMIN")) {
    next();
  } else res.status(401).send("Unauthorized");
});

app.use(
  createProxyMiddleware({
    target: "http://localhost:5555",
    changeOrigin: true,
  })
);

app.listen(port, () => {
  console.log(`Prisma Studio auth middleware proxy listening on port ${port}`);
});

async function decode(params) {
  const { token, secret } = params;
  if (!token) return null;
  const encryptionSecret = await getDerivedEncryptionKey(secret);
  const { payload } = await jwtDecrypt(token, encryptionSecret, {
    clockTolerance: 15,
  });
  return payload;
}

async function getDerivedEncryptionKey(secret: string | Buffer) {
  return await hkdf(
    "sha256",
    secret,
    "",
    "NextAuth.js Generated Encryption Key",
    32
  );
}
