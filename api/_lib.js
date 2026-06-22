// Shared helpers for the editing backend. Files prefixed with "_" are not
// treated as routes by Vercel, only imported by the route handlers.
const crypto = require("crypto");

const COOKIE = "sp_session";
const CONTENT_PATH = "src/_data/site.json";
const SESSION_TTL = 60 * 60 * 8; // 8 hours

// Session signing secret. No fallback: if AUTH_SECRET is unset the backend
// fails closed (no logins, no valid sessions). Set it per deployment.
function secret() {
  return process.env.AUTH_SECRET || null;
}

// Repo and branch default to Vercel's injected Git system variables, so a
// forked copy works with zero config. Override with CONTENT_REPO / CONTENT_BRANCH.
function repo() {
  if (process.env.CONTENT_REPO) return process.env.CONTENT_REPO;
  const owner = process.env.VERCEL_GIT_REPO_OWNER;
  const slug = process.env.VERCEL_GIT_REPO_SLUG;
  if (owner && slug) return `${owner}/${slug}`;
  return "restitutio777/lilja-belz-soul-portraits";
}
function branch() {
  return process.env.CONTENT_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || "main";
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
  const key = secret();
  if (!key) throw new Error("AUTH_SECRET is not set");
  const payload = b64url(JSON.stringify(payloadObj));
  const mac = b64url(crypto.createHmac("sha256", key).update(payload).digest());
  return `${payload}.${mac}`;
}
function verify(token) {
  const key = secret();
  if (!key || !token || !token.includes(".")) return null;
  const [payload, mac] = token.split(".");
  const expected = b64url(crypto.createHmac("sha256", key).update(payload).digest());
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

// Public read: no token needed (the repo is public). Used to load the editor.
async function readPublicContent() {
  const url = `https://raw.githubusercontent.com/${repo()}/${branch()}/${CONTENT_PATH}`;
  const res = await fetch(url, { headers: { "User-Agent": "soulportraits-editor" }, cache: "no-store" });
  if (!res.ok) throw new Error(`Public read failed: ${res.status}`);
  return res.json();
}

// Authenticated read: returns the file plus its sha (needed to commit).
async function readContent() {
  const res = await gh(`/repos/${repo()}/contents/${CONTENT_PATH}?ref=${encodeURIComponent(branch())}`);
  if (!res.ok) throw new Error(`GitHub read failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const text = Buffer.from(data.content, "base64").toString("utf8");
  return { json: JSON.parse(text), sha: data.sha };
}

// Commit an arbitrary file (e.g. an uploaded image). base64Content is the
// file's bytes already base64-encoded. Pass sha to update an existing file.
async function putFile(repoPath, base64Content, message, sha) {
  const body = { message, content: base64Content, branch: branch() };
  if (sha) body.sha = sha;
  const res = await gh(`/repos/${repo()}/contents/${encodeURI(repoPath)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GitHub upload failed: ${res.status} ${await res.text()}`);
  return res.json();
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
  readPublicContent,
  writeContent,
  putFile,
  readBody,
  SESSION_TTL,
};
