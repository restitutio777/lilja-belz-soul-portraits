// Custom editing backend, client side.
// Talks to /api/login, /api/logout, /api/content.

// Curated set of editable fields for this first version. Expand as needed;
// fields not listed here are preserved untouched on save.
const GROUPS = [
  {
    title: "Marke",
    fields: [
      { path: "brand.name", label: "Name", type: "text" },
      { path: "brand.tagline", label: "Untertitel", type: "text" },
      { path: "brand.email", label: "E-Mail", type: "text" },
    ],
  },
  {
    title: "Hero (Startbereich)",
    fields: [
      { path: "hero.eyebrow", label: "Eyebrow", type: "text" },
      { path: "hero.title_line1", label: "Titel, Zeile 1", type: "text" },
      { path: "hero.title_line2", label: "Titel, Zeile 2", type: "text" },
      { path: "hero.lead", label: "Einleitung", type: "textarea" },
    ],
  },
  {
    title: "Kontakt",
    fields: [
      { path: "kontakt.text", label: "Text", type: "textarea" },
      { path: "kontakt.hint", label: "Hinweis", type: "text" },
    ],
  },
];

const state = { content: null, sha: null };

const $ = (id) => document.getElementById(id);
const idFor = (path) => "f_" + path.replace(/\./g, "_");

function getPath(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function setPath(obj, path, value) {
  const keys = path.split(".");
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (o[keys[i]] == null || typeof o[keys[i]] !== "object") o[keys[i]] = {};
    o = o[keys[i]];
  }
  o[keys[keys.length - 1]] = value;
}

function showLogin() {
  $("boot").hidden = true;
  $("editor").hidden = true;
  $("logout").hidden = true;
  $("login").hidden = false;
}

function showEditor() {
  $("boot").hidden = true;
  $("login").hidden = true;
  $("logout").hidden = false;
  renderFields();
  $("editor").hidden = false;
}

function renderFields() {
  const root = $("fields");
  root.innerHTML = "";
  for (const group of GROUPS) {
    const section = document.createElement("div");
    section.className = "group";
    const h = document.createElement("h2");
    h.textContent = group.title;
    section.appendChild(h);

    for (const f of group.fields) {
      const wrap = document.createElement("div");
      wrap.className = "field";
      const label = document.createElement("label");
      label.textContent = f.label;
      const input = f.type === "textarea" ? document.createElement("textarea") : document.createElement("input");
      if (f.type !== "textarea") input.type = "text";
      input.id = idFor(f.path);
      input.value = getPath(state.content, f.path) ?? "";
      label.appendChild(input);
      wrap.appendChild(label);
      section.appendChild(wrap);
    }
    root.appendChild(section);
  }
}

function collectFields() {
  for (const group of GROUPS) {
    for (const f of group.fields) {
      const el = $(idFor(f.path));
      if (el) setPath(state.content, f.path, el.value);
    }
  }
}

function setStatus(msg, kind) {
  const s = $("status");
  s.textContent = msg;
  s.className = "status" + (kind ? " " + kind : "");
}

async function loadContent() {
  const res = await fetch("/api/content", { headers: { Accept: "application/json" } });
  if (res.status === 401) return showLogin();
  if (!res.ok) {
    $("boot").textContent = "Konnte Inhalte nicht laden.";
    return;
  }
  const data = await res.json();
  state.content = data.content;
  state.sha = data.sha;
  showEditor();
}

async function onLogin(e) {
  e.preventDefault();
  const err = $("login-error");
  err.hidden = true;
  const form = e.target;
  const btn = form.querySelector("button");
  btn.disabled = true;
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email.value, password: form.password.value }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      err.textContent = data.error || "Anmeldung fehlgeschlagen.";
      err.hidden = false;
      return;
    }
    await loadContent();
  } catch {
    err.textContent = "Netzwerkfehler.";
    err.hidden = false;
  } finally {
    btn.disabled = false;
  }
}

async function onSave() {
  collectFields();
  const btn = $("save");
  btn.disabled = true;
  setStatus("Speichert …");
  try {
    const res = await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: state.content, sha: state.sha }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) return showLogin();
    if (!res.ok) {
      setStatus(data.error || "Speichern fehlgeschlagen.", "err");
      return;
    }
    setStatus("Gespeichert. Die Website wird neu veröffentlicht.", "ok");
  } catch {
    setStatus("Netzwerkfehler beim Speichern.", "err");
  } finally {
    btn.disabled = false;
  }
}

async function onLogout() {
  await fetch("/api/logout", { method: "POST" });
  location.reload();
}

$("login-form").addEventListener("submit", onLogin);
$("save").addEventListener("click", onSave);
$("logout").addEventListener("click", onLogout);

loadContent();
