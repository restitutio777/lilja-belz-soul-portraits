// GitHub OAuth, step 1: redirect the editor to GitHub's authorization page.
// Sveltia/Decap CMS opens `${base_url}/auth`; we route /auth here (see vercel.json).
const crypto = require("crypto");

module.exports = (req, res) => {
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  if (!clientId) {
    res.status(500).send("Missing OAUTH_GITHUB_CLIENT_ID environment variable.");
    return;
  }

  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const redirectUri = `${proto}://${host}/callback`;
  const scope = (req.query && req.query.scope) || "repo";
  const state = crypto.randomBytes(12).toString("hex");

  // Remember the state in a short-lived cookie to guard against CSRF.
  res.setHeader(
    "Set-Cookie",
    `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
  );

  const url =
    "https://github.com/login/oauth/authorize" +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${state}`;

  res.writeHead(302, { Location: url });
  res.end();
};
