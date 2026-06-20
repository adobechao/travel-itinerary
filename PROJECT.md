# Travel Itinerary — Chao's 40th (Hong Kong · Shenzhen · Taipei)

A fun, modern, mobile-friendly website that keeps the whole crew on the same page for
Chao's 40th birthday trip: **Fri 23 Oct → Sun 1 Nov 2026**, across Hong Kong, Shenzhen
and Taipei, wrapped around Taipei Pride.

This file is the running brief — start here whenever you come back to update the site.

## What it is
- A static site (HTML + CSS + vanilla JS) — no build step, deploys straight to GitHub Pages.
- Design direction: **light, glossy, social-feed inspired** (Instagram/TikTok energy) with an
  **interactive map**. Inspired by a travel-app showreel the owner shared.
- Sections: hero + live countdown, the crew (story rings by country), interactive map
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
- `meta` — title, dates, countdown `startDate` (YYYY-MM-DD), blurb, flight ref.
- `crew` — people grouped by country (drives story rings + crew cards).
- `origins` — where people fly **from** (drives the inbound arcs on the map; lat/lng + colour).
- `destinations` — Hong Kong / Shenzhen / Taipei (map orbs + order).
- `route` — the legs we travel between destinations (drives the solid route line).
- `days` — the day-by-day feed. Each day: `date`, `city`, `flag` (emoji), `kicker`,
  `title`, `summary`, optional `hotel`, optional `image`, `highlight` (bool), and `plans`
  (array of `{time, plan}`).
- `stays`, `flights`, `notes`.

After editing, commit + push to `main` — GitHub Pages redeploys automatically.

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
