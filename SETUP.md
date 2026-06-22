# Setup & Betrieb

Diese Seite ist eine statische Website (gebaut mit [Eleventy](https://www.11ty.dev/))
mit einem kleinen, Git-basierten Redaktionssystem ([Sveltia CMS](https://sveltiacms.app/))
unter `/admin`. Alle Inhalte liegen in **einer** Datei: `src/_data/site.json`.

Der Ablauf in einem Satz: Im `/admin` Texte/Bilder ändern → Sveltia committet die
Änderung ins Git-Repo → Vercel baut die Seite automatisch neu. Kein Server, keine
Datenbank, keine laufenden Kosten.

```
src/
  index.njk          Template, liest die Inhalte aus site.json
  _data/site.json    ← alle Texte und Bilder der Seite
  admin/
    index.html       lädt Sveltia CMS
    config.yml       definiert die Felder im Editor
  styles.css, script.js, images/, ...
.eleventy.js         Build-Konfiguration (src → _site)
```

## 1. Lokal entwickeln und Inhalte testen (ohne Login)

Sveltia kann lokal direkt die Dateien im Ordner bearbeiten – **ohne** GitHub-Login.
Voraussetzung: ein Chromium-Browser (Chrome, Edge, Brave); Firefox/Safari können das
nicht (File System Access API).

```bash
npm install
npm run dev        # startet Eleventy auf http://localhost:8080
```

Dann `http://localhost:8080/admin/` im Chromium-Browser öffnen, „Work with Local
Repository" wählen und den Projektordner freigeben. Änderungen landen sofort in
`src/_data/site.json`; die Live-Seite aktualisiert sich.

## 2. Online-Bearbeitung für die Fotografin (GitHub-Login)

Damit die Fotografin von überall ohne Code arbeiten kann, braucht Sveltia einen
OAuth-Vermittler. Der ist hier **direkt als Vercel-Funktion eingebaut**
(`api/auth.js` + `api/callback.js`) – kein Cloudflare nötig, alles läuft auf der
Vercel-Domain. Die Endpunkte `/auth` und `/callback` sind in `vercel.json` geroutet.

Es bleiben drei einmalige Schritte:

1. **GitHub OAuth App anlegen** unter
   GitHub → Settings → Developer settings → OAuth Apps → *New OAuth App*:
   - *Homepage URL*: die Live-Domain (z. B. `https://soulportraits-six.vercel.app`)
   - *Authorization callback URL*: `https://<deine-domain>/callback`
   - `Client ID` notieren und ein `Client Secret` erzeugen.
2. **Env-Variablen in Vercel setzen** (Project → Settings → Environment Variables):
   - `OAUTH_GITHUB_CLIENT_ID` = die Client ID
   - `OAUTH_GITHUB_CLIENT_SECRET` = das Client Secret
   - Danach einmal neu deployen, damit die Variablen aktiv sind.
3. **`base_url` prüfen:** in `src/admin/config.yml` steht
   `base_url: https://<deine-domain>` – auf die echte Live-Domain setzen, falls
   sie abweicht (sie muss zur Homepage-URL der OAuth App passen).

Danach öffnet die Fotografin `https://deine-domain/admin/`, meldet sich mit GitHub an
und bearbeitet die Inhalte. Jeder Speichervorgang ist ein Git-Commit; Vercel deployt.

> Tipp: Lege der Fotografin einen GitHub-Account an und gib ihm nur **Schreibrechte
> auf dieses eine Repo** (als Collaborator). Mehr Zugriff braucht sie nicht.
>
> Wer lieber keinen eigenen OAuth-Endpunkt betreibt, kann stattdessen den
> [`sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth)-Worker auf
> Cloudflare deployen und `base_url` darauf zeigen lassen – dann werden die
> `api/`-Funktionen nicht gebraucht.

## 3. Als Produkt für weitere Fotografen wiederverwenden

Pro Kunde eine isolierte, eigenständige Website – nichts wird geteilt:

1. Repo kopieren (Template-Repo oder „Use this template" auf GitHub).
2. `repo:` in `src/admin/config.yml` auf das neue Repo zeigen lassen.
3. Branding anpassen: Farben/Schriften in `styles.css`, Inhalte in
   `src/_data/site.json` (oder bequem über `/admin`), Bilder in `src/images/`,
   `og.jpg` und `favicon.svg` austauschen.
4. Bei Vercel als neues Projekt importieren (Build-Command und Output-Verzeichnis
   stehen schon in `vercel.json`). Eigene Domain verbinden – auf Vercel kostenlos.
5. Eigene OAuth-App + Authenticator pro Kunde (siehe Schritt 2), oder einen
   gemeinsamen Authenticator, dessen Callback du um die neue Domain ergänzt.

So bleibt jede Seite getrennt, du brandest nur das Frontend, und es fallen keine
laufenden CMS-Gebühren an.

## Vor dem Livegang ersetzen (Platzhalter)

- **Bilder:** alles in `src/images/` sind Unsplash-Platzhalter. Durch echte Arbeiten
  ersetzen. Beim Hochladen über `/admin` für Galeriebilder Breite/Höhe in Pixeln
  eintragen (verhindert Layout-Sprünge).
- **E-Mail:** Feld „Marke → E-Mail" im `/admin`.
- **Impressum & Datenschutz:** Feld „Fußzeile & Recht". In Deutschland Pflicht –
  vollständig und rechtskonform ausfüllen.
- **Seiten-URL:** Feld „Meta & SEO → Seiten-URL" auf die echte Domain setzen.

## Bekannte Prototyp-Grenzen (mögliche nächste Schritte)

- **Bildmaße und Blur-up:** Für neu hochgeladene Galeriebilder müssen Breite/Höhe
  derzeit von Hand eingetragen werden, und der weiche Blur-up-Platzhalter wird nicht
  automatisch erzeugt. Das ließe sich mit [`@11ty/eleventy-img`](https://www.11ty.dev/docs/plugins/image/)
  beim Build automatisieren, sodass im Editor nur noch Bild + Alt-Text nötig sind.
- **Impressum als HTML:** aktuell ein HTML-Textfeld. Für nicht-technische Kunden
  ließe sich das in einzelne Felder (Name, Straße, …) aufteilen.
