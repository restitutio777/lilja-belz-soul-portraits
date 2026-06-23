// GET  /api/content  -> { content, sha }   (current site.json from GitHub)
// PUT  /api/content  { content, sha }       -> commits the new content
// Both require a valid session.
const { json, getSession, readContent, readPublicContent, writeContent, readBody } = require("./_lib");

module.exports = async (req, res) => {
  const session = getSession(req);
  if (!session) return json(res, 401, { error: "Nicht angemeldet." });

  try {
    if (req.method === "GET") {
      // With a token, read via the API (works for private repos too); otherwise
      // fall back to the public raw file so a public repo loads without a token.
      if (process.env.CONTENT_GITHUB_TOKEN) {
        const { json: content, sha } = await readContent();
        return json(res, 200, { content, sha });
      }
      const content = await readPublicContent();
      return json(res, 200, { content, sha: null });
    }

    if (req.method === "PUT" || req.method === "POST") {
      if (!process.env.CONTENT_GITHUB_TOKEN) {
        return json(res, 503, {
          error: "Speichern ist noch nicht aktiviert: Es fehlt der GitHub-Token (CONTENT_GITHUB_TOKEN) in Vercel.",
        });
      }
      const body = await readBody(req);
      if (!body || typeof body.content !== "object") {
        return json(res, 400, { error: "Ungültiger Inhalt." });
      }
      // Re-read to get the latest sha (guards against a stale client sha).
      const current = await readContent();
      const result = await writeContent(
        body.content,
        current.sha,
        `Inhalte aktualisiert über Admin (${session.email})`
      );
      return json(res, 200, { ok: true, commit: result.commit && result.commit.sha });
    }

    return json(res, 405, { error: "Method not allowed" });
  } catch (err) {
    return json(res, 500, { error: String(err.message || err) });
  }
};
