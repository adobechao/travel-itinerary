"use strict";

const $ = (sel) => document.querySelector(sel);
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

async function loadData() {
  const res = await fetch("data/itinerary.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load itinerary.json");
  return res.json();
}

/* a masked, clickable placeholder for an encrypted value */
function lockedHTML(secret, mask) {
  return `<button class="locked" data-secret="${secret}"><span class="lk">🔒</span>${mask || "••••••"}</button>`;
}

/* ---------- hero + countdown ---------- */
function renderHero(meta) {
  $("#heroKicker").textContent = `40th birthday · ${meta.tripWindow || "Oct–Nov 2026"}`;
  $("#heroTitle").innerHTML = `Chao turns <span class="accent">40</span>`;
  $("#heroTagline").textContent = meta.tagline;
  $("#heroInvite").textContent = meta.invite || meta.blurb;
  if (meta.playful) $("#heroPlayful").textContent = meta.playful;
  $("#footRange").textContent = meta.tripWindow || meta.dateRange;
  $("#flightRef").innerHTML = meta.flightRef +
    (meta.flightRefSecret ? ` <span class="flight-ref">· booking ref ${lockedHTML(meta.flightRefSecret)}</span>` : "");

  const chips = [
    { em: "📅", t: meta.dateRange },
    { em: "🎂", t: "Birthday: Sat 24 Oct, Hong Kong" },
    { em: "🏳️‍🌈", t: "Taipei Pride finale" },
  ];
  const wrap = $("#heroChips");
  chips.forEach((c) => wrap.appendChild(el("span", "chip", `<span class="em">${c.em}</span>${c.t}`)));

  startCountdown(meta.startDate);
}

function startCountdown(startDate) {
  const target = new Date(`${startDate}T00:00:00`);
  const box = $("#countdown");
  const tick = () => {
    const now = new Date();
    let diff = Math.max(0, target - now);
    const days = Math.floor(diff / 86400000); diff -= days * 86400000;
    const hrs = Math.floor(diff / 3600000); diff -= hrs * 3600000;
    const mins = Math.floor(diff / 60000); diff -= mins * 60000;
    const secs = Math.floor(diff / 1000);
    const units = [["days", days], ["hrs", hrs], ["min", mins], ["sec", secs]];
    box.innerHTML = units
      .map(([l, v]) => `<div class="cd-tile"><div class="cd-num">${v}</div><div class="cd-label">${l}</div></div>`)
      .join("");
  };
  tick();
  setInterval(tick, 1000);
}

/* ---------- crew ---------- */
function renderCrew(crew) {
  const stories = $("#stories");
  const grid = $("#crewGrid");
  crew.forEach((c) => {
    const s = el("div", "story");
    s.innerHTML = `<div class="story-ring"><div class="story-face">${c.flag}</div></div>
      <div class="story-name">${c.code}</div><div class="story-count">${c.people.length} going</div>`;
    stories.appendChild(s);

    const card = el("div", "crew-card");
    card.innerHTML = `<div class="crew-card-top"><span class="crew-flag">${c.flag}</span>
      <div><div class="crew-country">${c.country}</div><div class="crew-from">${c.people.length} traveller${c.people.length > 1 ? "s" : ""}</div></div></div>
      <div class="crew-people">${c.people.map((p) => `<span class="person">${p}</span>`).join("")}</div>`;
    grid.appendChild(card);
  });
}

/* ---------- itinerary feed ---------- */
function renderDays(days) {
  const feed = $("#feed");
  days.forEach((d, i) => {
    const card = el("article", "day" + (d.highlight ? " is-highlight" : ""));
    const media = el("div", "day-media");
    if (d.image) {
      let bgImage = `url("${d.image}")`;
      if (d.special === "birthday") {
        bgImage =
          `radial-gradient(circle at 78% 22%, rgba(255,215,0,0.62) 0%, transparent 50%),` +
          `radial-gradient(circle at 18% 80%, rgba(255,94,138,0.52) 0%, transparent 42%),` +
          `radial-gradient(circle at 52% 55%, rgba(124,58,237,0.32) 0%, transparent 46%),` +
          bgImage;
      } else if (d.special === "ghibli") {
        bgImage =
          `radial-gradient(circle at 50% 28%, rgba(255,168,50,0.68) 0%, transparent 55%),` +
          `radial-gradient(circle at 78% 72%, rgba(190,65,20,0.48) 0%, transparent 42%),` +
          bgImage;
      }
      media.style.backgroundImage = bgImage;
      const probe = new Image();
      probe.onerror = () => { media.style.backgroundImage = "none"; };
      probe.src = d.image;
    }
    media.innerHTML = `
      <div class="day-badges">
        <span class="day-date">${d.date}</span>
        <span class="day-kicker">${d.kicker}</span>
      </div>
      <div class="day-media-foot">
        <div class="day-emoji">${d.flag}</div>
        <div class="day-title">${d.title}</div>
        <span class="day-loc">📍 ${d.city}</span>
      </div>`;
    card.appendChild(media);

    const body = el("div", "day-body");
    body.appendChild(el("p", "day-summary", d.summary || ""));
    const toggle = el("button", "day-toggle",
      `<span>View the day</span><span class="chev">⌄</span>`);
    body.appendChild(toggle);

    const plansWrap = el("div", "day-plans");
    const inner = el("div", "day-plans-inner");
    (d.plans || []).forEach((p) => {
      inner.appendChild(el("div", "plan",
        `<div class="plan-time">${p.time}</div><div class="plan-text">${p.plan}</div>`));
    });
    if (d.hotel) inner.appendChild(el("div", "day-hotel", `🛏 ${d.hotel}`));
    plansWrap.appendChild(inner);
    body.appendChild(plansWrap);

    toggle.addEventListener("click", () => card.classList.toggle("open"));

    card.appendChild(body);
    feed.appendChild(card);
  });
}

/* ---------- stays ---------- */
function renderStays(stays) {
  const grid = $("#staysGrid");
  stays.forEach((s) => {
    const card = el("div", "stay");
    card.innerHTML = `
      <div class="stay-top"><span class="stay-flag">${s.flag}</span>
        <span class="stay-city">${s.city}</span>
        <span class="tag ${s.status}" style="margin-left:auto">${s.status === "booked" ? "Booked" : "TBC"}</span></div>
      <div class="stay-name">${s.name}</div>
      <div class="stay-dates">${s.dates}</div>
      ${s.detail ? `<div class="stay-detail">${s.detail}</div>` : ""}
      ${(s.locked || []).map((l) => `<div class="secret-row"><span class="sk">${l.label}:</span> ${lockedHTML(l.secret)}</div>`).join("")}`;
    grid.appendChild(card);
  });
}

/* ---------- flights ---------- */
function renderFlights(flights) {
  const list = $("#flightsList");
  flights.forEach((f) => {
    const row = el("div", "flight");
    row.innerHTML = `
      <div><div class="flight-code">${f.code}</div><div class="flight-date">${f.date}</div></div>
      <div><div class="flight-route">${f.from} <span class="arrow">→</span> ${f.to}</div>
        <div class="flight-note">${f.note}</div></div>
      <span class="tag ${f.status}">${f.status === "booked" ? "Booked" : "To book"}</span>`;
    list.appendChild(row);
  });
}

/* ---------- notes ---------- */
function renderNotes(notes) {
  const ul = $("#notesList");
  notes.forEach((n) => ul.appendChild(el("li", "", n)));
}

/* ---------- why these cities (boarding-pass cards) ---------- */
function renderCities(destinations) {
  const grid = $("#citiesGrid");
  if (!grid) return;
  destinations.filter((d) => d.why).forEach((d) => {
    const card = el("article", "city-card");
    card.innerHTML = `
      <div class="city-card-head">
        <div>
          <div class="city-card-code">${d.code || ""}</div>
          <h3 class="city-card-name">${d.flag} ${d.name}</h3>
        </div>
        <span class="city-card-stamp" aria-hidden="true"><span>STOP ${d.order}</span></span>
      </div>
      <div class="city-card-mood">${d.mood || ""}</div>
      <p class="city-card-why">${d.why}</p>`;
    grid.appendChild(card);
  });
}

/* ---------- visual trip arc ---------- */
function renderTripArc(data) {
  const strip = $("#tripArc");
  if (!strip) return;
  const cities = [...data.destinations].sort((a, b) => a.order - b.order);
  const stops = [
    { kind: "home", code: "HOME", name: "Home cities", mood: "Everyone sets off" },
    ...cities.map((c) => ({ kind: "city", code: c.code, name: c.name, flag: c.flag, mood: c.mood })),
    { kind: "home", code: "HOME", name: "Home again", mood: "Until the next one" },
  ];
  stops.forEach((s, i) => {
    const node = el("div", "arc-node" + (s.kind === "home" ? " is-home" : ""));
    node.innerHTML = `
      <div class="arc-dot"><span>${s.kind === "home" ? "✈" : s.flag || ""}</span></div>
      <div class="arc-code">${s.code}</div>
      <div class="arc-name">${s.name}</div>
      <div class="arc-mood">${s.mood}</div>`;
    strip.appendChild(node);
    if (i < stops.length - 1) strip.appendChild(el("div", "arc-link", "<span></span>"));
  });
}

/* ---------- Chao's 40 things (interactive mission board) ---------- */
function renderForty(items) {
  const board = $("#fortyBoard");
  const progress = $("#fortyProgress");
  if (!board) return;
  const KEY = "chao40-things";
  let done = {};
  try { done = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (_) { done = {}; }

  const updateProgress = () => {
    const count = items.filter((_, i) => done[i]).length;
    progress.textContent = `${count} of ${items.length} done`;
  };

  items.forEach((item, i) => {
    const id = `mission-${i}`;
    const label = el("label", "mission");
    label.setAttribute("for", id);
    label.innerHTML = `
      <input type="checkbox" id="${id}" class="mission-check" ${done[i] ? "checked" : ""} />
      <span class="mission-emoji" aria-hidden="true">${item.emoji || "✦"}</span>
      <span class="mission-text">${item.text}</span>
      <span class="mission-stamp" aria-hidden="true">done</span>`;
    const input = label.querySelector("input");
    label.classList.toggle("is-done", !!done[i]);
    input.addEventListener("change", () => {
      done[i] = input.checked;
      label.classList.toggle("is-done", input.checked);
      try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (_) {}
      updateProgress();
    });
    board.appendChild(label);
  });
  updateProgress();
}

/* ---------- map ---------- */
function arcPoints(a, b, bend = 0.2, steps = 48) {
  // quadratic bezier between a and b with a perpendicular lift for a flight-arc look
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const dx = b[1] - a[1], dy = b[0] - a[0];
  const ctrl = [mid[0] + dx * bend, mid[1] - dy * bend];
  const pts = [];
  for (let t = 0; t <= 1; t += 1 / steps) {
    const lat = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * ctrl[0] + t * t * b[0];
    const lng = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * ctrl[1] + t * t * b[1];
    pts.push([lat, lng]);
  }
  return pts;
}

function cityIcon(name, isDest) {
  return L.divIcon({
    className: "",
    html: `<div class="city-pin"><div class="city-orb ${isDest ? "dest" : ""}"></div><div class="city-tag">${name}</div></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
}
function originIcon(flag) {
  return L.divIcon({ className: "", html: `<div class="origin-pin">${flag}</div>`, iconSize: [24, 24], iconAnchor: [12, 12] });
}

function renderMap(data) {
  const HK = data.destinations.find((d) => d.name === "Hong Kong");
  const map = L.map("leafletMap", { scrollWheelZoom: false, zoomControl: true, attributionControl: true })
    .setView([28, 105], 3);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: "abcd", maxZoom: 18,
  }).addTo(map);

  const all = [];

  // inbound flight arcs (everyone to Hong Kong, except those joining elsewhere)
  data.origins.forEach((o) => {
    const hub = o.to ? data.destinations.find((d) => d.name === o.to) || HK : HK;
    const pts = arcPoints([o.lat, o.lng], [hub.lat, hub.lng], 0.18);
    L.polyline(pts, { color: o.color, weight: 2, opacity: 0.75, dashArray: "1 8", lineCap: "round" }).addTo(map);
    L.marker([o.lat, o.lng], { icon: originIcon(o.flag) })
      .bindPopup(`<b>${o.flag} ${o.label}</b><br>joining in ${hub.name}`).addTo(map);
    all.push([o.lat, o.lng]);
  });

  // our route between destinations
  data.route.forEach((leg) => {
    const f = data.destinations.find((d) => d.name === leg.from);
    const t = data.destinations.find((d) => d.name === leg.to);
    if (!f || !t) return;
    L.polyline(arcPoints([f.lat, f.lng], [t.lat, t.lng], 0.32), {
      color: "#2e7dff", weight: 3.5, opacity: 0.95, lineCap: "round",
    }).addTo(map);
  });

  // destination orbs
  data.destinations.forEach((d) => {
    L.marker([d.lat, d.lng], { icon: cityIcon(`${d.name}`, d.order > 1), zIndexOffset: 1000 })
      .bindPopup(`<b>${d.flag} ${d.name}</b><br>${d.blurb}`).addTo(map);
    all.push([d.lat, d.lng]);
  });

  map.fitBounds(all, { padding: [50, 50] });
  setTimeout(() => map.invalidateSize(), 200);
}

/* ---------- animated hero world map ---------- */
const PLANE = "M0,-8 L2.2,-2.4 L8,1.2 L2.2,2.2 L1.2,6 L3.2,8 L0,6.8 L-3.2,8 L-1.2,6 L-2.2,2.2 L-8,1.2 L-2.2,-2.4 Z";
let heroRAF = null, heroResizeTimer = null;

async function renderHeroMap(data) {
  const host = document.getElementById("heroMap");
  if (!host || typeof d3 === "undefined" || typeof topojson === "undefined") return;

  let world;
  try {
    world = await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json");
  } catch (e) { console.warn("hero map: world atlas unavailable", e); return; }
  const land = topojson.feature(world, world.objects.land);

  const HK = data.destinations.find((d) => d.name === "Hong Kong");
  const draw = () => {
    if (heroRAF) cancelAnimationFrame(heroRAF);
    host.innerHTML = "";
    const W = host.clientWidth || 900;
    const H = host.clientHeight || 520;
    const svg = d3.select(host).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "xMidYMid slice");

    const isMobile = W < 620;
    const projection = d3.geoNaturalEarth1().rotate([-114, -22]);
    projection
      .scale(isMobile ? Math.min(W, H) * 0.26 : Math.min(W, H) * 0.29)
      .translate([isMobile ? W * 0.78 : W * 0.78, isMobile ? H * 0.66 : H * 0.67]);
    const path = d3.geoPath(projection);

    svg.append("path").datum({ type: "Sphere" }).attr("class", "hm-grat").attr("d", path);
    svg.append("path").datum(d3.geoGraticule10()).attr("class", "hm-grat").attr("d", path);
    svg.append("path").datum(land).attr("class", "hm-land").attr("d", path);

    // helper: great-circle line feature between [lng,lat] points
    const gc = (a, b) => {
      const interp = d3.geoInterpolate(a, b);
      const coords = d3.range(0, 1.0001, 1 / 64).map((t) => interp(t));
      return { type: "LineString", coordinates: coords };
    };

    const flights = [];
    data.origins.forEach((o, i) => {
      const dest = o.to ? data.destinations.find((d) => d.name === o.to) || HK : HK;
      const a = [o.lng, o.lat], b = [dest.lng, dest.lat];
      const arc = svg.append("path").datum(gc(a, b)).attr("class", "hm-arc")
        .attr("stroke", o.color).attr("stroke-width", 2.4).attr("d", path);
      const node = arc.node();
      const len = node.getTotalLength();
      arc.attr("stroke-dasharray", len).attr("stroke-dashoffset", len);
      const plane = svg.append("path").attr("class", "hm-plane").attr("d", PLANE).attr("opacity", 0);
      // origin flag — only render if on-screen
      const p0 = projection(a);
      if (p0 && p0[0] >= 0 && p0[0] <= W && p0[1] >= -10 && p0[1] <= H + 10) {
        svg.append("text").attr("x", p0[0]).attr("y", p0[1] + 4).attr("text-anchor", "middle")
          .attr("font-size", 13).text(o.flag);
      }
      flights.push({ node, len, plane, delay: i * 900, dur: 4200, gap: 2600 });
    });

    // hub + activity pulses
    const pulse = (lng, lat, color, r, label, emoji) => {
      const p = projection([lng, lat]); if (!p) return;
      const g = svg.append("g").attr("transform", `translate(${p[0]},${p[1]})`);
      const ring = g.append("circle").attr("class", "hm-pulse").attr("r", r).attr("stroke", color).attr("stroke-width", 1.6).attr("fill", "none");
      ring.append("animate").attr("attributeName", "r").attr("values", `${r};${r * 3.4}`).attr("dur", "2.4s").attr("repeatCount", "indefinite");
      ring.append("animate").attr("attributeName", "opacity").attr("values", "0.9;0").attr("dur", "2.4s").attr("repeatCount", "indefinite");
      g.append("circle").attr("r", 2.6).attr("fill", color);
      if (emoji) g.append("text").attr("y", -8).attr("text-anchor", "middle").attr("font-size", 14).text(emoji);
    };
    (data.activities || []).forEach((a) => {
      const color = a.type === "birthday" ? "#ffd166" : a.type === "pride" ? "#ff5e8a" : "#7fb0ff";
      pulse(a.lng, a.lat, color, 4, a.label, a.emoji);
    });

    // animate planes along arcs
    const start = performance.now();
    const frame = (now) => {
      flights.forEach((f) => {
        const cycle = f.dur + f.gap;
        let local = (now - start - f.delay) % cycle;
        if (local < 0) local += cycle;
        if (local <= f.dur) {
          const p = local / f.dur;
          const at = f.node.getPointAtLength(p * f.len);
          const ahead = f.node.getPointAtLength(Math.min(f.len, p * f.len + 1));
          const ang = (Math.atan2(ahead.y - at.y, ahead.x - at.x) * 180) / Math.PI + 90;
          f.plane.attr("opacity", 1).attr("transform", `translate(${at.x},${at.y}) rotate(${ang}) scale(1.15)`);
          f.node.setAttribute("stroke-dashoffset", f.len * (1 - p));
        } else {
          f.plane.attr("opacity", 0);
          f.node.setAttribute("stroke-dashoffset", 0);
        }
      });
      heroRAF = requestAnimationFrame(frame);
    };
    heroRAF = requestAnimationFrame(frame);
  };

  draw();
  window.addEventListener("resize", () => {
    clearTimeout(heroResizeTimer);
    heroResizeTimer = setTimeout(draw, 250);
  });
}

/* ---------- secure reveal (client-side AES-GCM) ---------- */
const Secrets = {
  enc: null, revealed: null,
  b64: (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)),
  async load() {
    if (this.enc) return this.enc;
    const r = await fetch("data/secrets.enc.json", { cache: "no-store" });
    this.enc = await r.json();
    return this.enc;
  },
  async unlock(password) {
    const enc = await this.load();
    const e = new TextEncoder();
    const baseKey = await crypto.subtle.importKey("raw", e.encode(password), "PBKDF2", false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: this.b64(enc.salt), iterations: enc.iter, hash: "SHA-256" },
      baseKey, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
    );
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: this.b64(enc.iv) }, key, this.b64(enc.data));
    this.revealed = JSON.parse(new TextDecoder().decode(pt));
    return this.revealed;
  },
};

function applyRevealed(values) {
  document.querySelectorAll("[data-secret]").forEach((el) => {
    const v = values[el.dataset.secret];
    if (v == null) return;
    const span = document.createElement("span");
    span.className = "unlocked";
    span.textContent = v;
    el.replaceWith(span);
  });
}

function initUnlock() {
  const modal = $("#lockModal"), form = $("#lockForm"), input = $("#lockInput"),
    err = $("#lockError"), close = $("#lockClose");
  const open = () => { modal.hidden = false; err.hidden = true; input.value = ""; setTimeout(() => input.focus(), 30); };
  const shut = () => { modal.hidden = true; };

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".locked");
    if (btn) { e.preventDefault(); open(); }
  });
  close.addEventListener("click", shut);
  modal.addEventListener("click", (e) => { if (e.target === modal) shut(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) shut(); });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.hidden = true;
    try {
      const values = await Secrets.unlock(input.value.trim());
      applyRevealed(values);
      shut();
    } catch (_) {
      err.hidden = false;
      input.select();
    }
  });
}

/* ---------- nav ---------- */
function initNav() {
  const nav = $("#nav");
  const toggle = $("#navToggle");
  const links = $("#navLinks");
  window.addEventListener("scroll", () => nav.classList.toggle("scrolled", window.scrollY > 12));
  toggle.addEventListener("click", () => links.classList.toggle("open"));
  links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => links.classList.remove("open")));
}

/* ---------- boot ---------- */
(async function () {
  initNav();
  initUnlock();
  try {
    const data = await loadData();
    renderHero(data.meta);
    renderTripArc(data);
    renderCities(data.destinations);
    renderCrew(data.crew);
    renderHeroMap(data);
    renderMap(data);
    renderDays(data.days);
    renderStays(data.stays);
    renderFlights(data.flights);
    renderForty(data.fortyThings || []);
    renderNotes(data.notes);
  } catch (e) {
    console.error(e);
    $("#feed").innerHTML = `<p class="muted">Couldn't load the itinerary. Run this from a local server (see README) so the browser can read the data file.</p>`;
  }
})();
