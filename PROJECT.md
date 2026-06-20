# Travel Itinerary — Chao's 40th (Hong Kong · Shenzhen · Taipei)

A fun, modern, mobile-friendly website that keeps the whole crew on the same page for
Chao's 40th birthday trip: **Fri 23 Oct → Sun 1 Nov 2026**, across Hong Kong, Shenzhen
and Taipei, wrapped around Taipei Pride.

This file is the running brief — start here whenever you come back to update the site.

## What it is
- A static site (HTML + CSS + vanilla JS) — no build step, deploys straight to GitHub Pages.
- Design direction: **light, glossy, social-feed inspired** (Instagram/TikTok energy) with an
  **interactive map**. Inspired by a travel-app showreel the owner shared.
- Sections: **animated hero** (D3 world-map flight animation — planes flying in from each crew
  city to Hong Kong/Taipei, with pulsing birthday/activity pins) + live countdown, the crew
  (story rings by country), interactive map
  (everyone flying in to Hong Kong → route to Shenzhen → Taipei), day-by-day itinerary feed,
  stays, flights, and shared notes.

## How it's built
```
index.html            # page shell + section markup
assets/styles.css      # all styling (CSS variables at top control the theme)
assets/app.js          # renders everything from the JSON, countdown, Leaflet map
data/itinerary.json    # <-- SINGLE SOURCE OF TRUTH. Edit this to update the trip.
```
- Map: [Leaflet](https://leafletjs.com/) + CARTO light tiles (no API key needed).
- Fonts: Plus Jakarta Sans (Google Fonts).
- Photos: Unsplash URLs in `itinerary.json` (`image` fields). Each has a graceful
  gradient fallback if a link breaks — swap any URL freely.

## Updating the trip
Almost everything lives in `data/itinerary.json`:
- `meta` — title, dates, countdown `startDate` (YYYY-MM-DD), blurb, `invite` (warm hero
  intro copy), `playful` (the one-liner pill), `tripWindow` ("Oct–Nov 2026"), flight ref.
- `destinations` — each city also carries `code` (HKG/SZX/TPE), `mood` (short label used by
  the trip arc + "Why these cities?"), and `why` (the city-card paragraph).
- `fortyThings` — the "Chao's 40 things" mission board items (`{text, emoji}`). Checked state
  is saved per-visitor in `localStorage` (key `chao40-things`); it isn't shared between people.
- `crew` — people grouped by country (drives story rings + crew cards).
- `origins` — where people fly **from** (drives the inbound arcs on the map; lat/lng + colour).
- `destinations` — Hong Kong / Shenzhen / Taipei (map orbs + order).
- `route` — the legs we travel between destinations (drives the solid route line).
- `days` — the day-by-day feed. Each day: `date`, `city`, `flag` (emoji), `kicker`,
  `title`, `summary`, optional `hotel`, optional `image`, `highlight` (bool), and `plans`
  (array of `{time, plan}`).
- `stays`, `flights`, `notes`.

After editing, commit + push to `main` — GitHub Pages redeploys automatically.

## Secure (password-gated) fields
Sensitive booking details (Cathay ref, Airbnb confirmation code + full address) are **encrypted**,
not just hidden. They render as masked `🔒 ••••••` buttons; clicking one opens a password prompt,
and the values decrypt **in the browser** only with the correct password (currently `chao86`).

- The plaintext is **never** in the repo, HTML, or JS — only the ciphertext in `data/secrets.enc.json`.
- Crypto: PBKDF2-SHA256 (250k iterations) → AES-GCM-256. A wrong password fails the GCM auth tag.
- This is client-side gating: strong enough to keep codes out of the page source and casual view,
  but the password is shared with the crew — treat it as "friends-only", not bank-grade.

**To change the password or the secret values**, re-run the one-off generator (kept OUT of the repo
so plaintext never lands in git). Create `/tmp/gen-secrets.mjs`:
```js
import { webcrypto as crypto } from 'node:crypto';
import { writeFileSync } from 'node:fs';
const PASSWORD = 'chao86';                 // <- change me
const ITER = 250000;
const payload = {                          // <- edit values; keys must match data-secret keys in the JSON
  cathay_ref: 'FRQPNF',
  airbnb_confirmation: 'HMHYCZ2R48',
  airbnb_address: 'No. 27, Section 2, Zhongxiao East Road 3, Meihua Village, Taipei 100, Taiwan'
};
const enc = new TextEncoder();
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const bk = await crypto.subtle.importKey('raw', enc.encode(PASSWORD), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name:'PBKDF2', salt, iterations:ITER, hash:'SHA-256' }, bk, { name:'AES-GCM', length:256 }, false, ['encrypt']);
const ct = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, enc.encode(JSON.stringify(payload)));
const b64 = (u8) => Buffer.from(u8).toString('base64');
writeFileSync('data/secrets.enc.json', JSON.stringify({ v:1, alg:'AES-GCM', kdf:'PBKDF2-SHA256', iter:ITER, salt:b64(salt), iv:b64(iv), data:Buffer.from(ct).toString('base64') }, null, 2) + '\n');
```
Then: `cd travel-itinerary && node /tmp/gen-secrets.mjs && rm /tmp/gen-secrets.mjs` and commit `data/secrets.enc.json`.
To add a new locked field: add a key to `payload`, regenerate, then reference it in `itinerary.json`
(e.g. a stay's `locked: [{ "label": "...", "secret": "your_key" }]`).

## Source of truth for the itinerary
Originally lived in Notion: <https://silent-quicksand-be3.notion.site/Hong-Kong-Shenzhen-Taipei-Trip-2dd767049119800c977fc6740c4ce826>
The Notion page renders via JavaScript, so it can't be fetched from the URL directly. It was
imported once via Notion's public `loadPageChunk` API. To re-sync from Notion later:
```
curl -s -X POST 'https://silent-quicksand-be3.notion.site/api/v3/loadPageChunk' \
  -H 'Content-Type: application/json' \
  --data '{"pageId":"2dd76704-9119-800c-977f-c6740c4ce826","limit":300,"cursor":{"stack":[]},"chunkNumber":0}'
```
For now the JSON is hand-maintained — it's the canonical copy.

## Running locally
```
cd travel-itinerary
python3 -m http.server 8000      # then open http://localhost:8000
```
(A server is needed because the page `fetch`es the JSON file.)

## Deploy
Hosted on GitHub Pages from the `main` branch root (repo: adobechao/travel-itinerary, private).
See README for enabling Pages.

## Ideas / backlog
- Photo gallery section for during/after the trip.
- Per-person profile pages / avatars (real photos instead of flags).
- Live "what's happening now" highlight based on the current date.
- Map: animated plane markers travelling along the arcs.
