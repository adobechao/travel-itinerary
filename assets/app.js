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

/* ---------- hero + countdown ---------- */
function renderHero(meta) {
  $("#heroKicker").textContent = `40th birthday · ${meta.dateRange.split("→")[1].trim()}`;
  $("#heroTitle").innerHTML = `Chao turns <span class="accent">40</span>`;
  $("#heroTagline").textContent = meta.tagline;
  $("#heroBlurb").textContent = meta.blurb;
  $("#footRange").textContent = meta.dateRange;
  $("#flightRef").textContent = meta.flightRef;

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
      media.style.backgroundImage = `url("${d.image}")`;
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
    if (i < 2 || d.highlight) card.classList.add("open");

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
      ${s.detail ? `<div class="stay-detail">${s.detail}</div>` : ""}`;
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

  // inbound flight arcs to Hong Kong
  data.origins.forEach((o) => {
    const pts = arcPoints([o.lat, o.lng], [HK.lat, HK.lng], 0.18);
    L.polyline(pts, { color: o.color, weight: 2, opacity: 0.75, dashArray: "1 8", lineCap: "round" }).addTo(map);
    L.marker([o.lat, o.lng], { icon: originIcon(o.flag) })
      .bindPopup(`<b>${o.flag} ${o.label}</b><br>flying in to Hong Kong`).addTo(map);
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
  try {
    const data = await loadData();
    renderHero(data.meta);
    renderCrew(data.crew);
    renderMap(data);
    renderDays(data.days);
    renderStays(data.stays);
    renderFlights(data.flights);
    renderNotes(data.notes);
  } catch (e) {
    console.error(e);
    $("#feed").innerHTML = `<p class="muted">Couldn't load the itinerary. Run this from a local server (see README) so the browser can read the data file.</p>`;
  }
})();
