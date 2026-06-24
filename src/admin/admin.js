// Custom editing backend, client side. Schema-driven editor for the whole
// site.json. Talks to /api/login, /api/logout, /api/content, /api/upload.

// Field types: text, textarea, listText (array of strings),
// objectList (array of objects), object (nested), image (path + auto
// width/height/placeholder via widthKey/heightKey/placeholderKey).
const SCHEMA = [
  { title: "Marke", key: "brand", fields: [
    { key: "name", label: "Name", type: "text" },
    { key: "tagline", label: "Untertitel", type: "text" },
    { key: "email", label: "E-Mail", type: "text" },
  ]},
  { title: "Meta & SEO", key: "meta", fields: [
    { key: "title", label: "Seitentitel", type: "text" },
    { key: "description", label: "Beschreibung (Suchmaschine)", type: "textarea" },
    { key: "site_url", label: "Seiten-URL", type: "text" },
    { key: "theme_color", label: "Theme-Farbe", type: "text" },
    { key: "og_title", label: "OG-Titel (Social)", type: "text" },
    { key: "og_description", label: "OG-Beschreibung", type: "textarea" },
    { key: "og_image_alt", label: "OG-Bild Alt-Text", type: "text" },
    { key: "twitter_description", label: "Twitter-Beschreibung", type: "textarea" },
  ]},
  { title: "Hero (Startbereich)", key: "hero", fields: [
    { key: "eyebrow", label: "Eyebrow", type: "text" },
    { key: "title_line1", label: "Titel, Zeile 1", type: "text" },
    { key: "title_line2", label: "Titel, Zeile 2", type: "text" },
    { key: "lead", label: "Einleitung", type: "textarea" },
    { key: "image", label: "Bild", type: "image", widthKey: "image_width", heightKey: "image_height" },
    { key: "image_alt", label: "Bild Alt-Text", type: "text" },
  ]},
  { title: "Worum es geht", key: "intro", fields: [
    { key: "eyebrow", label: "Eyebrow", type: "text" },
    { key: "paragraphs", label: "Absätze", type: "listText" },
  ]},
  { title: "Portfolio", key: "portfolio", fields: [
    { key: "eyebrow", label: "Eyebrow", type: "text" },
    { key: "title", label: "Titel", type: "text" },
    { key: "note", label: "Notiz", type: "textarea" },
    { key: "flow_intro", label: "Übergangstext (davor)", type: "text" },
    { key: "items", label: "Bilder", type: "objectList", itemLabel: "alt", item: [
      { key: "image", label: "Bild", type: "image", widthKey: "width", heightKey: "height", placeholderKey: "placeholder" },
      { key: "alt", label: "Alt-Text", type: "text" },
    ]},
  ]},
  { title: "Ablauf", key: "ablauf", fields: [
    { key: "eyebrow", label: "Eyebrow", type: "text" },
    { key: "title", label: "Titel", type: "text" },
    { key: "flow_intro", label: "Übergangstext (davor)", type: "text" },
    { key: "steps", label: "Schritte", type: "objectList", itemLabel: "title", item: [
      { key: "title", label: "Titel", type: "text" },
      { key: "text", label: "Text", type: "textarea" },
    ]},
  ]},
  { title: "Der Raum", key: "raum", fields: [
    { key: "eyebrow", label: "Eyebrow", type: "text" },
    { key: "title", label: "Titel", type: "text" },
    { key: "flow_intro", label: "Übergangstext (davor)", type: "text" },
    { key: "paragraphs", label: "Absätze", type: "listText" },
    { key: "image_detail", label: "Bild, Detail", type: "object", fields: [
      { key: "image", label: "Bild", type: "image", widthKey: "width", heightKey: "height" },
      { key: "alt", label: "Alt-Text", type: "text" },
    ]},
    { key: "image_main", label: "Bild, groß", type: "object", fields: [
      { key: "image", label: "Bild", type: "image", widthKey: "width", heightKey: "height" },
      { key: "alt", label: "Alt-Text", type: "text" },
    ]},
  ]},
  { title: "Über mich", key: "about", fields: [
    { key: "eyebrow", label: "Eyebrow", type: "text" },
    { key: "title", label: "Titel", type: "text" },
    { key: "image", label: "Bild", type: "image", widthKey: "image_width", heightKey: "image_height" },
    { key: "image_alt", label: "Bild Alt-Text", type: "text" },
    { key: "paragraphs", label: "Absätze", type: "listText" },
    { key: "quote", label: "Zitat", type: "textarea" },
  ]},
  { title: "Begleitung & Rahmen", key: "beratung", fields: [
    { key: "eyebrow", label: "Eyebrow", type: "text" },
    { key: "title", label: "Titel", type: "text" },
    { key: "intro", label: "Einleitung", type: "textarea" },
    { key: "facts", label: "Eckdaten", type: "objectList", itemLabel: "term", item: [
      { key: "term", label: "Begriff", type: "text" },
      { key: "description", label: "Beschreibung", type: "textarea" },
    ]},
  ]},
  { title: "Kontakt", key: "kontakt", fields: [
    { key: "eyebrow", label: "Eyebrow", type: "text" },
    { key: "title", label: "Titel", type: "text" },
    { key: "flow_intro", label: "Übergangstext (davor)", type: "text" },
    { key: "text", label: "Text", type: "textarea" },
    { key: "hint", label: "Hinweis", type: "text" },
  ]},
  { title: "Fußzeile & Recht", key: "footer", fields: [
    { key: "impressum_html", label: "Impressum & Datenschutz (HTML)", type: "textarea" },
    { key: "copyright", label: "Copyright", type: "text" },
    { key: "credit", label: "Bildnachweis", type: "text" },
  ]},
];

const state = { content: null, sha: null };
const $ = (id) => document.getElementById(id);

// Freshly uploaded images are committed to the repo but only become reachable
// under /images/<name> after the next deploy (1–2 min). Until then that path
// 404s, so a just-uploaded thumbnail would stay blank. Cache the local data URL
// per uploaded path for this session so previews show instantly, including
// across re-renders (e.g. reordering portfolio items right after uploading).
const uploadedThumbs = {};
function thumbSrc(path) {
  const p = String(path || "");
  if (!p) return "";
  return uploadedThumbs[p] || "/" + p.replace(/^\//, "");
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

// --- rendering -------------------------------------------------------------
function renderAll() {
  const root = $("fields");
  root.innerHTML = "";
  for (const group of SCHEMA) {
    if (state.content[group.key] == null) state.content[group.key] = {};
    const section = el("div", "group");
    section.appendChild(el("h2", null, group.title));
    renderFields(group.fields, state.content[group.key], section);
    root.appendChild(section);
  }
}

function renderFields(specs, obj, parent) {
  for (const spec of specs) renderField(spec, obj, parent);
}

function renderField(spec, obj, parent) {
  const t = spec.type;
  if (t === "text" || t === "textarea") {
    const wrap = el("div", "field");
    const label = el("label", null, spec.label);
    const input = t === "textarea" ? el("textarea") : el("input");
    if (t !== "textarea") input.type = "text";
    input.value = obj[spec.key] != null ? obj[spec.key] : "";
    input.addEventListener("input", () => { obj[spec.key] = input.value; });
    label.appendChild(input);
    wrap.appendChild(label);
    parent.appendChild(wrap);
    return;
  }
  if (t === "image") { renderImage(spec, obj, parent); return; }
  if (t === "object") {
    if (obj[spec.key] == null || typeof obj[spec.key] !== "object") obj[spec.key] = {};
    const card = el("div", "obj-card");
    card.appendChild(el("div", "obj-title", spec.label));
    renderFields(spec.fields, obj[spec.key], card);
    parent.appendChild(card);
    return;
  }
  if (t === "listText") {
    if (!Array.isArray(obj[spec.key])) obj[spec.key] = [];
    const arr = obj[spec.key];
    const block = el("div", "list-block");
    block.appendChild(el("div", "obj-title", spec.label));
    arr.forEach((val, i) => {
      const row = el("div", "list-row");
      const ta = el("textarea");
      ta.value = val != null ? val : "";
      ta.addEventListener("input", () => { arr[i] = ta.value; });
      const rm = el("button", "mini danger", "Entfernen");
      rm.type = "button";
      rm.addEventListener("click", () => { arr.splice(i, 1); renderAll(); });
      row.appendChild(ta); row.appendChild(rm);
      block.appendChild(row);
    });
    const add = el("button", "mini", "+ Absatz");
    add.type = "button";
    add.addEventListener("click", () => { arr.push(""); renderAll(); });
    block.appendChild(add);
    parent.appendChild(block);
    return;
  }
  if (t === "objectList") {
    if (!Array.isArray(obj[spec.key])) obj[spec.key] = [];
    const arr = obj[spec.key];
    const block = el("div", "list-block");
    block.appendChild(el("div", "obj-title", spec.label));
    const imgSpec = spec.item.find((s) => s.type === "image");
    arr.forEach((item, i) => {
      const card = el("div", "obj-card");
      const head = el("div", "obj-card-head");
      // Thumbnail (if the item has an image) so you can see what you're moving/removing
      if (imgSpec && item[imgSpec.key]) {
        const th = el("img", "obj-thumb");
        th.alt = "";
        th.src = thumbSrc(item[imgSpec.key]);
        head.appendChild(th);
      } else if (imgSpec) {
        head.appendChild(el("span", "obj-thumb empty"));
      }
      head.appendChild(el("span", "obj-card-title", (item[spec.itemLabel] || "Eintrag " + (i + 1))));
      // Reorder controls
      const tools = el("div", "obj-tools");
      const up = el("button", "mini ghost", "↑");
      up.type = "button"; up.title = "Nach oben"; up.disabled = i === 0;
      up.addEventListener("click", () => { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); renderAll(); });
      const down = el("button", "mini ghost", "↓");
      down.type = "button"; down.title = "Nach unten"; down.disabled = i === arr.length - 1;
      down.addEventListener("click", () => { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); renderAll(); });
      const rm = el("button", "mini danger", "Entfernen");
      rm.type = "button";
      rm.addEventListener("click", () => {
        if (!window.confirm("Diesen Eintrag wirklich entfernen?")) return;
        arr.splice(i, 1); renderAll();
      });
      tools.appendChild(up); tools.appendChild(down); tools.appendChild(rm);
      head.appendChild(tools);
      card.appendChild(head);
      renderFields(spec.item, item, card);
      block.appendChild(card);
    });
    const add = el("button", "mini", "+ Hinzufügen");
    add.type = "button";
    add.addEventListener("click", () => {
      const fresh = {};
      for (const s of spec.item) {
        if (s.type === "image") { fresh[s.key] = ""; if (s.widthKey) fresh[s.widthKey] = 0; if (s.heightKey) fresh[s.heightKey] = 0; if (s.placeholderKey) fresh[s.placeholderKey] = ""; }
        else fresh[s.key] = "";
      }
      arr.push(fresh); renderAll();
    });
    block.appendChild(add);
    parent.appendChild(block);
    return;
  }
}

function renderImage(spec, obj, parent) {
  const wrap = el("div", "field image-field");
  wrap.appendChild(el("label", "image-label", spec.label));
  const row = el("div", "image-row");
  const thumb = el("img", "thumb");
  thumb.alt = "";
  if (obj[spec.key]) thumb.src = thumbSrc(obj[spec.key]);
  else thumb.classList.add("empty");
  const right = el("div", "image-meta");
  const path = el("div", "image-path", obj[spec.key] || "— kein Bild —");
  const info = el("div", "image-dims");
  const cur = currentDims(obj, spec);
  if (cur) info.textContent = cur; else info.hidden = true;
  const status = el("span", "image-status");
  const file = el("input");
  file.type = "file";
  file.accept = "image/*";
  const btn = el("button", "mini", "Bild wählen / ersetzen");
  btn.type = "button";
  btn.title = "Große Bilder werden automatisch auf max. " + IMG_MAX_EDGE + " px verkleinert und als WebP optimiert.";
  btn.addEventListener("click", () => file.click());
  file.addEventListener("change", () => handleImage(file, spec, obj, { thumb, path, info, status }));
  right.appendChild(path);
  right.appendChild(info);
  right.appendChild(btn);
  right.appendChild(status);
  right.appendChild(file);
  file.style.display = "none";
  row.appendChild(thumb);
  row.appendChild(right);
  wrap.appendChild(row);
  parent.appendChild(wrap);
}

function currentDims(obj, spec) {
  const w = spec.widthKey && obj[spec.widthKey];
  const h = spec.heightKey && obj[spec.heightKey];
  return (w && h) ? `${w} × ${h} px` : "";
}

// --- image processing ------------------------------------------------------
const IMG_MAX_EDGE = 2400;   // longest side in px — anything larger is downscaled
const IMG_MIN_EDGE = 1200;   // below this we warn (may look soft when enlarged)
const IMG_QUALITY = 0.82;    // re-encode quality for lossy formats
// Vector and animated formats are uploaded untouched (a canvas would rasterise
// or flatten them).
const IMG_PASSTHROUGH = ["image/svg+xml", "image/gif"];

function fmtBytes(n) {
  if (n == null) return "";
  if (n < 1024) return n + " B";
  if (n < 1048576) return Math.round(n / 1024) + " KB";
  return (n / 1048576).toFixed(1) + " MB";
}
function dataURLBytes(u) {
  const i = u.indexOf(",");
  const b64 = i >= 0 ? u.slice(i + 1) : u;
  return Math.floor((b64.length * 3) / 4);
}
function extForType(type) {
  return type === "image/webp" ? "webp"
    : type === "image/png" ? "png"
    : type === "image/gif" ? "gif"
    : type === "image/svg+xml" ? "svg" : "jpg";
}
function withExt(name, ext) {
  const dot = name.lastIndexOf(".");
  return (dot > 0 ? name.slice(0, dot) : name) + "." + ext;
}
function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error || new Error("Datei konnte nicht gelesen werden."));
    r.readAsDataURL(file);
  });
}
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error("Bild konnte nicht gelesen werden."));
    im.src = src;
  });
}

// ~24px wide blurred LQIP as a JPEG data URL (the front-end blur-up source).
function dataURLtoSmall(img) {
  const w = 32, h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * w));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  c.getContext("2d").drawImage(img, 0, 0, w, h);
  try { return c.toDataURL("image/jpeg", 0.4); } catch { return ""; }
}

// Downscale to IMG_MAX_EDGE and re-encode (WebP, JPEG fallback) via canvas.
function reencode(img) {
  const sw = img.naturalWidth, sh = img.naturalHeight;
  const scale = Math.min(1, IMG_MAX_EDGE / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);
  let type = "image/webp";
  let dataURL = c.toDataURL(type, IMG_QUALITY);
  if (dataURL.slice(0, 15) !== "data:image/webp") { // browser can't encode WebP
    type = "image/jpeg";
    dataURL = c.toDataURL(type, IMG_QUALITY);
  }
  return { dataURL, width: w, height: h, type, bytes: dataURLBytes(dataURL) };
}

async function handleImage(fileInput, spec, obj, ui) {
  const f = fileInput.files && fileInput.files[0];
  if (!f) return;
  ui.status.className = "image-status";
  ui.status.textContent = "Verarbeite Bild …";
  try {
    const srcURL = await readAsDataURL(f);
    const img = await loadImage(srcURL);
    const srcW = img.naturalWidth, srcH = img.naturalHeight, srcBytes = f.size;

    if (spec.placeholderKey) obj[spec.placeholderKey] = dataURLtoSmall(img);

    // Optimise raster images; pass vectors/GIFs (and undecodable files) through.
    let up = { dataURL: srcURL, width: srcW, height: srcH, type: f.type || "image/jpeg", bytes: srcBytes, optimized: false };
    if (!IMG_PASSTHROUGH.includes(f.type) && srcW && srcH) {
      const opt = reencode(img);
      const downscaled = Math.max(srcW, srcH) > IMG_MAX_EDGE;
      // Keep the optimised version only when it helps (smaller, or resized).
      if (downscaled || opt.bytes < srcBytes) up = Object.assign(opt, { optimized: true });
    }

    ui.status.textContent = "Lädt hoch …";
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: withExt(f.name, extForType(up.type)), dataBase64: up.dataURL }),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) { ui.status.textContent = out.error || "Upload fehlgeschlagen."; ui.status.classList.add("err"); return; }

    obj[spec.key] = out.path;
    if (spec.widthKey) obj[spec.widthKey] = up.width;
    if (spec.heightKey) obj[spec.heightKey] = up.height;

    // Show the local image right away — /images/<name> isn't deployed yet.
    uploadedThumbs[out.path] = up.dataURL;
    ui.thumb.src = up.dataURL;
    ui.thumb.classList.remove("empty");
    ui.path.textContent = out.path;

    // Dimensions / size (with before→after when optimised, plus a small warning).
    let line = `${up.width} × ${up.height} px · ${extForType(up.type).toUpperCase()} · ${fmtBytes(up.bytes)}`;
    if (up.optimized && (up.width !== srcW || up.height !== srcH || up.bytes < srcBytes)) {
      line += `  (von ${srcW} × ${srcH} px, ${fmtBytes(srcBytes)})`;
    }
    if (f.type !== "image/svg+xml" && up.width && Math.max(up.width, up.height) < IMG_MIN_EDGE) {
      line += "  ⚠ klein – auf großen Bildschirmen evtl. unscharf";
    }
    ui.info.textContent = line;
    ui.info.hidden = false;

    ui.status.textContent = up.optimized ? "Optimiert & hochgeladen ✓" : "Hochgeladen ✓";
    ui.status.classList.add("ok");
  } catch (err) {
    ui.status.textContent = (err && err.message) || "Fehler beim Verarbeiten des Bildes.";
    ui.status.classList.add("err");
  }
}

// --- views -----------------------------------------------------------------
function showLogin() { $("boot").hidden = true; $("editor").hidden = true; $("logout").hidden = true; $("view-site").hidden = true; $("login").hidden = false; }
function showEditor() {
  $("boot").hidden = true; $("login").hidden = true; $("logout").hidden = false; $("view-site").hidden = false;
  const name = state.content && state.content.brand && state.content.brand.name;
  if (name) { $("brand-name").textContent = name; document.title = "Inhalte verwalten · " + name; }
  renderAll();
  $("editor").hidden = false;
}

function setStatus(msg, kind) { const s = $("status"); s.textContent = msg; s.className = "status" + (kind ? " " + kind : ""); }

async function loadContent() {
  const res = await fetch("/api/content", { headers: { Accept: "application/json" } });
  if (res.status === 401) return showLogin();
  if (!res.ok) { $("boot").textContent = "Konnte Inhalte nicht laden."; return; }
  const data = await res.json();
  state.content = data.content; state.sha = data.sha;
  showEditor();
}

async function onLogin(e) {
  e.preventDefault();
  const err = $("login-error"); err.hidden = true;
  const form = e.target; const btn = form.querySelector("button"); btn.disabled = true;
  try {
    const res = await fetch("/api/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email.value, password: form.password.value }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { err.textContent = data.error || "Anmeldung fehlgeschlagen."; err.hidden = false; return; }
    await loadContent();
  } catch { err.textContent = "Netzwerkfehler."; err.hidden = false; }
  finally { btn.disabled = false; }
}

async function onSave() {
  const btn = $("save"); btn.disabled = true; setStatus("Speichert …");
  try {
    const res = await fetch("/api/content", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: state.content, sha: state.sha }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) return showLogin();
    if (!res.ok) { setStatus(data.error || "Speichern fehlgeschlagen.", "err"); return; }
    setStatus("Gespeichert. Die Website wird neu veröffentlicht (1–2 Min).", "ok");
  } catch { setStatus("Netzwerkfehler beim Speichern.", "err"); }
  finally { btn.disabled = false; }
}

async function onLogout() { await fetch("/api/logout", { method: "POST" }); location.reload(); }

// Back-to-top: the editor can get long, so offer a quick way up. Only show
// the button once the page is scrolled down a bit.
const toTop = $("to-top");
function updateToTop() { toTop.hidden = window.scrollY < 400; }
toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
window.addEventListener("scroll", updateToTop, { passive: true });

$("login-form").addEventListener("submit", onLogin);
$("save").addEventListener("click", onSave);
$("logout").addEventListener("click", onLogout);
loadContent();
