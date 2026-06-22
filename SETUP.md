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
kleinen OAuth-Vermittler. Empfohlen ist der offizielle, kostenlose
**Sveltia CMS Authenticator** auf Cloudflare Workers.

1. **GitHub OAuth App anlegen** unter
   GitHub → Settings → Developer settings → OAuth Apps → *New OAuth App*:
   - *Homepage URL*: die Live-Domain (z. B. `https://soulportraits-six.vercel.app`)
   - *Authorization callback URL*: `https://<dein-worker>.workers.dev/callback`
   - `Client ID` und ein erzeugtes `Client Secret` notieren.
2. **Authenticator deployen:** dem Repo
   [`sveltia/sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth) folgen
   (Deploy auf Cloudflare Workers). `GITHUB_CLIENT_ID` und `GITHUB_CLIENT_SECRET`
   als Worker-Secrets setzen.
3. **`base_url` eintragen:** in `src/admin/config.yml` die auskommentierte Zeile
   aktivieren und auf die Worker-URL setzen:
   ```yaml
   backend:
     name: github
     repo: restitutio777/lilja-belz-soul-portraits
     branch: main
     base_url: https://<dein-worker>.workers.dev
   ```

Danach öffnet die Fotografin `https://deine-domain/admin/`, meldet sich mit GitHub an
und bearbeitet die Inhalte. Jeder Speichervorgang ist ein Git-Commit; Vercel deployt.

> Tipp: Lege der Fotografin einen GitHub-Account an und gib ihm nur **Schreibrechte
> auf dieses eine Repo** (als Collaborator). Mehr Zugriff braucht sie nicht.

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
