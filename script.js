/* ================= EDIT THIS CONFIG ================= */
const CONFIG = {
  whatsapp: "919368055141",                 // country code + number, no "+" or spaces
  email: "sonusingh.in2019@gmail.com",
  instagram: "https://www.instagram.com/pro.task.studio/",
  // Paste your Google Apps Script Web App URL here (see README). Leave "" to use WhatsApp-only mode.
  backendUrl: "",
  // Leave price as "" to show "Custom quote", or write e.g. "Starting at ₹199"
  services: [
    { icon: "📝", name: "Professional Resume", desc: "ATS-friendly, clean and recruiter-ready resumes for freshers and experienced candidates.", points: ["Resume / CV design", "Cover letter", "LinkedIn profile tips"], price: "" },
    { icon: "✍️", name: "Content & Articles", desc: "Well-researched, plagiarism-free writing for blogs, websites and academics.", points: ["Blogs & articles", "Website content", "Reports & assignments"], price: "" },
    { icon: "💻", name: "Websites", desc: "Responsive, fast and modern websites for portfolios, businesses and startups.", points: ["Portfolio websites", "Business landing pages", "Hosting guidance"], price: "" },
    { icon: "🎓", name: "College Projects", desc: "Guidance and development support for final year and mini projects.", points: ["Web & software projects", "PPT & documentation", "Project reports"], price: "" }
  ],
  extraOptions: ["Cover Letter", "PPT / Report / Assignment", "Other"]
};
/* ==================================================== */

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
};
const waLink = (text) => "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(text);

/* ---------- Static links & year ---------- */
$("yr").textContent = new Date().getFullYear();
$("igLink").href = CONFIG.instagram;
$("waLink").href = $("waFloat").href = waLink("Hi ProTask Studio, I want to know more about your services.");
$("mailLink").href = "mailto:" + CONFIG.email;
$("deadline").min = new Date().toISOString().split("T")[0];

/* ---------- Theme ---------- */
const root = document.documentElement;
function applyTheme(t) {
  root.setAttribute("data-theme", t);
  $("themeBtn").textContent = t === "dark" ? "🌙" : "☀️";
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.content = t === "dark" ? "#070b14" : "#f6f8fc";
}
applyTheme(root.getAttribute("data-theme") || "dark");
$("themeBtn").addEventListener("click", () => {
  const t = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(t); store.set("pt-theme", t);
});

/* ---------- Mobile menu ---------- */
$("menuBtn").addEventListener("click", () => {
  const open = $("links").classList.toggle("open");
  $("menuBtn").setAttribute("aria-expanded", open);
});
document.querySelectorAll("#links a").forEach((a) => a.addEventListener("click", () => {
  $("links").classList.remove("open"); $("menuBtn").setAttribute("aria-expanded", false);
}));

/* ---------- Services + select options ---------- */
$("servicesGrid").innerHTML = CONFIG.services.map((s) => `
  <div class="card reveal">
    <div class="ico">${esc(s.icon)}</div>
    <h3>${esc(s.name)}</h3>
    <p>${esc(s.desc)}</p>
    <ul>${s.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
    <div class="price">${s.price ? esc(s.price) : "Custom quote"}</div>
    <a href="#order" class="btn ghost sm" data-service="${esc(s.name)}">Order this</a>
  </div>`).join("");

$("service").innerHTML = '<option value="">Select a service</option>' +
  CONFIG.services.concat(CONFIG.extraOptions.map((n) => ({ name: n }))).map((s) => `<option>${esc(s.name)}</option>`).join("");

document.querySelectorAll("[data-service]").forEach((b) => b.addEventListener("click", () => {
  $("service").value = b.dataset.service;
}));

/* ---------- Scroll reveal + counters ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

document.querySelectorAll("[data-count]").forEach((el) => {
  const target = +el.dataset.count, suffix = el.dataset.suffix || "";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) { el.textContent = target + suffix; return; }
  let n = 0; const step = Math.max(1, Math.round(target / 40));
  const t = setInterval(() => { n = Math.min(target, n + step); el.textContent = n + suffix; if (n >= target) clearInterval(t); }, 30);
});

/* ---------- Validation helpers ---------- */
function setErr(input, msg) {
  const f = input.closest(".field");
  f.classList.toggle("invalid", !!msg);
  const s = f.querySelector(".err-msg"); if (s) s.textContent = msg || "";
  return !msg;
}
const cleanPhone = (v) => v.replace(/[^\d]/g, "");
function validate() {
  const f = $("orderForm");
  const phone = cleanPhone(f.phone.value);
  let ok = true;
  ok = setErr(f.name, f.name.value.trim().length < 2 ? "Please enter your name" : "") && ok;
  ok = setErr(f.phone, phone.length < 10 || phone.length > 13 ? "Enter a valid phone number" : "") && ok;
  ok = setErr(f.email, f.email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value) ? "Enter a valid email" : "") && ok;
  ok = setErr(f.service, !f.service.value ? "Select a service" : "") && ok;
  ok = setErr(f.details, f.details.value.trim().length < 10 ? "Please add a few more details (min 10 chars)" : "") && ok;
  return ok;
}
$("details").addEventListener("input", (e) => { $("charCount").textContent = e.target.value.length + "/1500"; });

/* ---------- Backend call ---------- */
async function callBackend(method, payload) {
  const url = CONFIG.backendUrl;
  const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 20000);
  try {
    let res;
    if (method === "POST") {
      // text/plain avoids a CORS preflight, which Apps Script does not support
      res = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), signal: ctrl.signal });
    } else {
      res = await fetch(url + "?" + new URLSearchParams(payload), { signal: ctrl.signal });
    }
    return await res.json();
  } finally { clearTimeout(to); }
}

/* ---------- Order submit ---------- */
function showModal(id, savedOnline, d) {
  $("mId").textContent = id;
  $("mText").textContent = savedOnline
    ? "Your order is saved. Keep this Order ID to track it. Tap below to confirm on WhatsApp so we can send your quote."
    : "Tap below to send your order on WhatsApp. We will reply with your quote and timeline.";
  const text = "*New Order - ProTask Studio*\nOrder ID: " + id + "\nName: " + d.name + "\nPhone: " + d.phone +
    "\nEmail: " + (d.email || "-") + "\nService: " + d.service + "\nDeadline: " + (d.deadline || "-") + "\nDetails: " + d.details;
  $("mWa").href = waLink(text);
  $("modal").hidden = false; $("mClose").focus();
}
$("mClose").addEventListener("click", () => { $("modal").hidden = true; });
$("modal").addEventListener("click", (e) => { if (e.target.id === "modal") $("modal").hidden = true; });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") $("modal").hidden = true; });
$("copyBtn").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("mId").textContent); $("copyBtn").textContent = "Copied!"; }
  catch (e) { $("copyBtn").textContent = "Copy manually"; }
  setTimeout(() => ($("copyBtn").textContent = "Copy"), 1800);
});

$("orderForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  if (f._gotcha.value) return;
  if (!validate()) { const first = f.querySelector(".invalid input,.invalid select,.invalid textarea"); if (first) first.focus(); return; }

  const last = +store.get("pt-last") || 0;
  if (Date.now() - last < 30000) { alert("Please wait a few seconds before sending another order."); return; }

  const d = {
    name: f.name.value.trim(), phone: cleanPhone(f.phone.value), email: f.email.value.trim(),
    service: f.service.value, deadline: f.deadline.value, details: f.details.value.trim(), _gotcha: ""
  };
  const btn = $("submitBtn"); btn.disabled = true; btn.textContent = "Submitting...";
  try {
    let id, online = false;
    if (CONFIG.backendUrl) {
      try {
        const r = await callBackend("POST", d);
        if (r && r.ok) { id = r.id; online = true; }
        else throw new Error((r && r.error) || "Server error");
      } catch (err) {
        id = "PT-" + Date.now().toString(36).toUpperCase().slice(-6);
        alert("Could not reach the order server. Your order will be sent via WhatsApp instead.");
      }
    } else {
      id = "PT-" + Date.now().toString(36).toUpperCase().slice(-6);
    }
    store.set("pt-last", Date.now());
    showModal(id, online, d);
    f.reset(); $("charCount").textContent = "0/1500";
  } finally { btn.disabled = false; btn.textContent = "Submit Order"; }
});

/* ---------- Track order ---------- */
const STAGES = ["Received", "In Progress", "Review", "Delivered"];
$("trackForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const out = $("trackResult");
  const id = $("tid").value.trim().toUpperCase(), p4 = cleanPhone($("tphone").value);
  if (!id || p4.length !== 4) { out.innerHTML = '<div class="status-box bad">Enter your Order ID and last 4 digits of your phone.</div>'; return; }
  if (!CONFIG.backendUrl) { out.innerHTML = '<div class="status-box">Online tracking is not enabled yet. Please message us on WhatsApp with your Order ID.</div>'; return; }
  const btn = $("trackBtn"); btn.disabled = true; btn.textContent = "Checking...";
  try {
    const r = await callBackend("GET", { action: "track", id, p4 });
    if (!r || !r.ok) { out.innerHTML = `<div class="status-box bad">${esc((r && r.error) || "Order not found. Check your details.")}</div>`; return; }
    const idx = Math.max(0, STAGES.indexOf(r.status));
    out.innerHTML = `
      <div class="status-box">
        <div class="status-head"><div><b>${esc(r.id)}</b><br><small>${esc(r.service)}</small></div><span class="badge">${esc(r.status)}</span></div>
        <div class="progress">${STAGES.map((_, i) => `<i class="${i <= idx ? "on" : ""}"></i>`).join("")}</div>
        <div class="progress-labels">${STAGES.map((s) => `<span>${s}</span>`).join("")}</div>
        <p class="note" style="text-align:left;margin-top:14px">Placed on ${esc(r.date)}</p>
      </div>`;
  } catch (err) {
    out.innerHTML = '<div class="status-box bad">Could not check status right now. Please try again.</div>';
  } finally { btn.disabled = false; btn.textContent = "Check Status"; }
});
