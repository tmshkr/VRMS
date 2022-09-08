import express from "express";
const { createProxyMiddleware } = require("http-proxy-middleware");
const app = express();
const port = 5000;

// check for role on / and /api routes
app.use((req, res) => {
  res.status(501).send("Auth middleware not yet implemented");
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
