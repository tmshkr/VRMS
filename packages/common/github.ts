// // Octokit.js
// // https://github.com/octokit/core.js#readme
import { Octokit } from "@octokit/core";
import { createAppAuth } from "@octokit/auth-app";

const appOctokit = new Octokit({
  authStrategy: createAppAuth,
  auth: {
    appId: process.env.GH_APP_ID,
    privateKey: process.env.GH_APP_PRIVATE_KEY,
  },
});

const getOctokit = async () => {
  const auth: any = await appOctokit.auth({
    type: "installation",
    installationId: process.env.GH_APP_INSTALLATION_ID,
  });

  const octokit = new Octokit({
    auth: auth.token,
  });

  return octokit;
};

export const getGitContent = async ({ owner, repo, path }) => {
  const octokit = await getOctokit();
  const result = await octokit.request(
    "GET /repos/{owner}/{repo}/contents/{path}",
    {
      owner,
      repo,
      path,
    }
  );

  return result;
};

export const writeGitContent = async (args) => {
  const { owner, repo, path, content, sha, name, email } = args;
  const octokit = await getOctokit();
  const result = await octokit.request(
    "PUT /repos/{owner}/{repo}/contents/{path}",
    {
      owner,
      repo,
      path,
      message: `update ${path}`,
      content: Buffer.from(content).toString("base64"),
      sha,
      author: {
        name,
        email,
        date: new Date().toISOString(),
      },
    }
  );

  return result;
};
