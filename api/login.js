// POST /api/login  { email, password }  -> sets a signed session cookie.
const crypto = require("crypto");
const { json, sign, sessionCookie, readBody, SESSION_TTL } = require("./_lib");

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  // Defaults so the admin works immediately on the preview; override with
  // ADMIN_EMAIL / ADMIN_PASSWORD environment variables for production.
  const adminEmail = process.env.ADMIN_EMAIL || "pgj@mailbox.org";
  const adminPassword = process.env.ADMIN_PASSWORD || "pgj@mailbox.org";

  let body;
  try {
    body = await readBody(req);
  } catch {
    return json(res, 400, { error: "Invalid request body." });
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const ok = safeEqual(email, adminEmail.trim().toLowerCase()) && safeEqual(password, adminPassword);

  if (!ok) return json(res, 401, { error: "E-Mail oder Passwort ist falsch." });

  const token = sign({ email, exp: Math.floor(Date.now() / 1000) + SESSION_TTL });
  res.setHeader("Set-Cookie", sessionCookie(token));
  return json(res, 200, { ok: true, email });
};
