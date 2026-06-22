// GitHub OAuth, step 2: exchange the code for a token and hand it back to the CMS.
// GitHub redirects here (the OAuth App's callback URL must be https://<domain>/callback).

function page(status, content) {
  // The CMS opener listens for this postMessage handshake (Netlify/Decap protocol).
  const payload = `authorization:github:${status}:${JSON.stringify(content)}`;
  return `<!doctype html><html><body><script>
  (function () {
    function receiveMessage(e) {
      window.opener.postMessage(${JSON.stringify(payload)}, e.origin);
      window.removeEventListener("message", receiveMessage, false);
    }
    window.addEventListener("message", receiveMessage, false);
    window.opener.postMessage("authorizing:github", "*");
  })();
  </script></body></html>`;
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "text/html");

  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;
  const code = req.query && req.query.code;
  const state = req.query && req.query.state;

  const cookie = (req.headers.cookie || "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("oauth_state="));
  const savedState = cookie ? cookie.split("=")[1] : null;

  if (!clientId || !clientSecret) {
    res.status(500).send(page("error", { message: "OAuth env vars are not set." }));
    return;
  }
  if (!code || !state || state !== savedState) {
    res.status(400).send(page("error", { message: "Invalid state or missing code." }));
    return;
  }

  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const data = await response.json();

    if (data.error || !data.access_token) {
      res.status(401).send(page("error", { message: data.error_description || "No token returned." }));
      return;
    }

    res.status(200).send(page("success", { token: data.access_token, provider: "github" }));
  } catch (err) {
    res.status(500).send(page("error", { message: String(err) }));
  }
};
