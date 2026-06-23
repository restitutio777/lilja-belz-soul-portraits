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
    arr.forEach((item, i) => {
      const card = el("div", "obj-card");
      const head = el("div", "obj-card-head");
      head.appendChild(el("span", "obj-card-title", (item[spec.itemLabel] || "Eintrag " + (i + 1))));
      const rm = el("button", "mini danger", "Entfernen");
      rm.type = "button";
      rm.addEventListener("click", () => { arr.splice(i, 1); renderAll(); });
      head.appendChild(rm);
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
  if (obj[spec.key]) thumb.src = "/" + String(obj[spec.key]).replace(/^\//, "");
  else thumb.classList.add("empty");
  const right = el("div", "image-meta");
  const path = el("div", "image-path", obj[spec.key] || "— kein Bild —");
  const status = el("span", "image-status");
  const file = el("input");
  file.type = "file";
  file.accept = "image/*";
  const btn = el("button", "mini", "Bild wählen / ersetzen");
  btn.type = "button";
  btn.addEventListener("click", () => file.click());
  file.addEventListener("change", () => handleImage(file, spec, obj, { thumb, path, status }));
  right.appendChild(path);
  right.appendChild(btn);
  right.appendChild(status);
  right.appendChild(file);
  file.style.display = "none";
  row.appendChild(thumb);
  row.appendChild(right);
  wrap.appendChild(row);
  parent.appendChild(wrap);
}

function dataURLtoSmall(img) {
  // ~24px wide blurred LQIP as a JPEG data URL
  const w = 24, h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * w));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  c.getContext("2d").drawImage(img, 0, 0, w, h);
  try { return c.toDataURL("image/jpeg", 0.4); } catch { return ""; }
}

async function handleImage(fileInput, spec, obj, ui) {
  const f = fileInput.files && fileInput.files[0];
  if (!f) return;
  ui.status.textContent = "Lädt hoch …";
  ui.status.className = "image-status";
  const reader = new FileReader();
  reader.onload = async () => {
    const dataURL = reader.result;
    const img = new Image();
    img.onload = async () => {
      if (spec.widthKey) obj[spec.widthKey] = img.naturalWidth;
      if (spec.heightKey) obj[spec.heightKey] = img.naturalHeight;
      if (spec.placeholderKey) obj[spec.placeholderKey] = dataURLtoSmall(img);
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: f.name, dataBase64: dataURL }),
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok) { ui.status.textContent = out.error || "Upload fehlgeschlagen."; ui.status.classList.add("err"); return; }
        obj[spec.key] = out.path;
        ui.thumb.src = "/" + out.path;
        ui.thumb.classList.remove("empty");
        ui.path.textContent = out.path;
        ui.status.textContent = "Hochgeladen ✓";
        ui.status.classList.add("ok");
      } catch {
        ui.status.textContent = "Netzwerkfehler beim Upload.";
        ui.status.classList.add("err");
      }
    };
    img.src = dataURL;
  };
  reader.readAsDataURL(f);
}

// --- views -----------------------------------------------------------------
function showLogin() { $("boot").hidden = true; $("editor").hidden = true; $("logout").hidden = true; $("login").hidden = false; }
function showEditor() {
  $("boot").hidden = true; $("login").hidden = true; $("logout").hidden = false;
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

$("login-form").addEventListener("submit", onLogin);
$("save").addEventListener("click", onSave);
$("logout").addEventListener("click", onLogout);
loadContent();
