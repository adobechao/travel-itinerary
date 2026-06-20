# Chao turns 40 ✦ Hong Kong · Shenzhen · Taipei

A fun, mobile-friendly itinerary site for a 40th birthday trip — 16 friends, 5 countries,
Oct 2026. Live countdown, the crew, an interactive map of everyone flying in, and the full
day-by-day plan.

> **To update the trip, edit [`data/itinerary.json`](data/itinerary.json) and push.**
> The rest of the site renders from it. See [`PROJECT.md`](PROJECT.md) for the full guide.

## Run locally
```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy (GitHub Pages)
1. Push to `main`.
2. Repo → **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main` / `/ (root)`.
3. Site goes live at the URL shown there. (Pages on a private repo needs GitHub Pro/Team/Enterprise;
   otherwise make the repo public to publish.)

## Stack
Static HTML/CSS/vanilla JS · [Leaflet](https://leafletjs.com) map · no build step.
