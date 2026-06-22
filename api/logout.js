// POST /api/logout  -> clears the session cookie.
const { json, sessionCookie } = require("./_lib");

module.exports = async (req, res) => {
  res.setHeader("Set-Cookie", sessionCookie(null));
  return json(res, 200, { ok: true });
};
