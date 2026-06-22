// POST /api/upload  { filename, dataBase64 }  -> commits the image to
// src/images/<safe-name> and returns its public path ("images/<safe-name>").
const crypto = require("crypto");
const { json, getSession, putFile, readBody } = require("./_lib");

function safeName(name) {
  const dot = name.lastIndexOf(".");
  let base = (dot > 0 ? name.slice(0, dot) : name).toLowerCase();
  let ext = (dot > 0 ? name.slice(dot + 1) : "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  base = base.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "bild";
  if (!["jpg", "jpeg", "png", "webp", "gif", "avif", "svg"].includes(ext)) ext = "jpg";
  const rand = crypto.randomBytes(3).toString("hex");
  return `${base}-${rand}.${ext}`;
}

module.exports = async (req, res) => {
  const session = getSession(req);
  if (!session) return json(res, 401, { error: "Nicht angemeldet." });
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (!process.env.CONTENT_GITHUB_TOKEN) {
    return json(res, 503, { error: "Upload nicht aktiviert: CONTENT_GITHUB_TOKEN fehlt in Vercel." });
  }

  try {
    const body = await readBody(req);
    let data = body.dataBase64 || "";
    // accept full data URLs too
    const comma = data.indexOf(",");
    if (data.startsWith("data:") && comma !== -1) data = data.slice(comma + 1);
    if (!data || !body.filename) return json(res, 400, { error: "filename und dataBase64 erforderlich." });

    const approxBytes = Math.floor((data.length * 3) / 4);
    if (approxBytes > 8 * 1024 * 1024) {
      return json(res, 413, { error: "Bild zu groß (max. 8 MB). Bitte kleiner exportieren." });
    }

    const name = safeName(body.filename);
    const repoPath = `src/images/${name}`;
    await putFile(repoPath, data, `Bild hochgeladen über Admin (${session.email}): ${name}`);
    return json(res, 200, { ok: true, path: `images/${name}` });
  } catch (err) {
    return json(res, 500, { error: String(err.message || err) });
  }
};
