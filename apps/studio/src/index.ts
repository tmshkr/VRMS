import express from "express";
import { jwtDecrypt } from "jose";
import hkdf from "@panva/hkdf";

import { PrismaClient } from "@prisma/client";
const prisma: PrismaClient = new PrismaClient();

const { createProxyMiddleware } = require("http-proxy-middleware");
const Cookies = require("cookies");

const app = express();
const port = 5000;

// check for role on / and /api routes
app.use([/^\/$/, "/api"], async (req, res, next) => {
  const cookies = new Cookies(req, res);
  const cookieName = process.env.NEXTAUTH_URL?.startsWith("https://")
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
  const token = cookies.get(cookieName);
  const payload: any = await decode({
    token,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { provider, provider_account_id } = payload;
  const app_roles: any = await prisma.account
    .findUnique({
      where: {
        provider_provider_account_id: {
          provider,
          provider_account_id,
        },
      },
      select: { user: { select: { app_roles: true } } },
    })
    .then((result) => {
      if (!result) return [];
      return result.user.app_roles.map(({ role }) => role);
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
