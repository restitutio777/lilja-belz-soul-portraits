// Shared helpers for the editing backend. Files prefixed with "_" are not
// treated as routes by Vercel, only imported by the route handlers.
const crypto = require("crypto");

const COOKIE = "sp_session";
const CONTENT_PATH = "src/_data/site.json";
const SESSION_TTL = 60 * 60 * 8; // 8 hours

function repo() {
  return process.env.CONTENT_REPO || "restitutio777/lilja-belz-soul-portraits";
}
function branch() {
  return process.env.CONTENT_BRANCH || "main";
}

// --- JSON response helper ---
function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

// --- cookies ---
function readCookie(req, name) {
  const raw = req.headers.cookie || "";
  const hit = raw
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(name + "="));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : null;
}

// --- signed session token (HMAC, no external deps) ---
function b64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function sign(payloadObj) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  const payload = b64url(JSON.stringify(payloadObj));
  const mac = b64url(crypto.createHmac("sha256", secret).update(payload).digest());
  return `${payload}.${mac}`;
}
function verify(token) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || !token || !token.includes(".")) return null;
  const [payload, mac] = token.split(".");
  const expected = b64url(crypto.createHmac("sha256", secret).update(payload).digest());
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const obj = JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    if (!obj.exp || obj.exp < Math.floor(Date.now() / 1000)) return null;
    return obj;
  } catch {
    return null;
  }
}
function sessionCookie(token) {
  const maxAge = token ? SESSION_TTL : 0;
  return `${COOKIE}=${encodeURIComponent(token || "")}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}
function getSession(req) {
  return verify(readCookie(req, COOKIE));
}

// --- GitHub contents API ---
async function gh(path, options = {}) {
  const token = process.env.CONTENT_GITHUB_TOKEN;
  if (!token) throw new Error("CONTENT_GITHUB_TOKEN is not set");
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "soulportraits-editor",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
  });
  return res;
}

async function readContent() {
  const res = await gh(`/repos/${repo()}/contents/${CONTENT_PATH}?ref=${encodeURIComponent(branch())}`);
  if (!res.ok) throw new Error(`GitHub read failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const text = Buffer.from(data.content, "base64").toString("utf8");
  return { json: JSON.parse(text), sha: data.sha };
}

async function writeContent(contentObj, sha, message) {
  const text = JSON.stringify(contentObj, null, 2) + "\n";
  const res = await gh(`/repos/${repo()}/contents/${CONTENT_PATH}`, {
    method: "PUT",
    body: JSON.stringify({
      message: message || "Update site content via admin",
      content: Buffer.from(text, "utf8").toString("base64"),
      sha,
      branch: branch(),
    }),
  });
  if (!res.ok) throw new Error(`GitHub write failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// --- request body parser (Vercel may pass req.body already) ---
async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

module.exports = {
  json,
  readCookie,
  sign,
  verify,
  sessionCookie,
  getSession,
  readContent,
  writeContent,
  readBody,
  SESSION_TTL,
};
