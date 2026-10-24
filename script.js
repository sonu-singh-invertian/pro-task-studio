/* ================= EDIT THIS CONFIG ================= */
const CONFIG = {
  whatsapp: "919368055141",                 // country code + number, no "+" or spaces
  email: "sonusingh.in2019@gmail.com",
  instagram: "https://www.instagram.com/pro.task.studio/",
  // Paste your Google Apps Script Web App URL here (see README). Orders will NOT work until this is set.
  backendUrl: "https://script.google.com/macros/s/AKfycbzb72a5lgQggGdgweBTOKc-04SaOWqtoo1KJJRP4f8KZHEhV9DLqBZ4iIOfN-HCotDa/exec",
  // Leave price as "" to show "Custom quote", or write e.g. "Starting at ₹199"
  services: [
    { icon: "📝", name: "Professional Resume", desc: "ATS-friendly, clean and recruiter-ready resumes for freshers and experienced candidates.", points: ["Resume / CV design", "Cover letter", "LinkedIn profile tips"], price: "" },
    { icon: "✍️", name: "Content & Articles", desc: "Well-researched, plagiarism-free writing for blogs, websites and academics.", points: ["Blogs & articles", "Website content", "Reports & assignments"], price: "" },
    { icon: "💻", name: "Websites", desc: "Responsive, fast and modern websites for portfolios, businesses and startups.", points: ["Portfolio websites", "Business landing pages", "Hosting guidance"], price: "" },
    { icon: "🎓", name: "College Projects", desc: "Guidance and development support for final year and mini projects.", points: ["Web & software projects", "PPT & documentation", "Project reports"], price: "" }
  ],
  extraOptions: ["Cover Letter", "PPT / Report / Assignment", "Other"],

  // ---- UPI payments: put your UPI ID here (e.g. "yourname@okhdfcbank"). Leave "" to hide the Pay section.
  upi: { id: "", name: "ProTask Studio" },

  // ---- Samples: add your REAL work. Put images in an "images" folder in the repo. Empty list = section hidden.
  // Hide personal details (name, phone, email, address) in resume screenshots before using them.
  samples: [
    // { title: "Fresher Resume (Before & After)", tag: "Resume", desc: "Redesigned into a clean ATS-friendly layout.", image: "images/resume-1.jpg" },
    // { title: "Portfolio Website", tag: "Website", desc: "Responsive portfolio for a student.", image: "images/site-1.jpg", link: "https://example.com" },
  ],

  // ---- Packages. Edit features freely. Leave price "" to show "Ask for quote", or write e.g. "₹299".
  pricing: [
    { category: "Resume", service: "Professional Resume", tiers: [
      { name: "Basic", price: "", features: ["1-page ATS-friendly resume", "PDF + Word file", "1 revision"] },
      { name: "Standard", price: "", popular: true, features: ["Resume + cover letter", "Keyword tuning for your role", "2 revisions", "PDF + Word file"] },
      { name: "Premium", price: "", features: ["Resume + cover letter", "LinkedIn profile tips", "3 revisions", "Priority delivery"] }
    ]},
    { category: "Content", service: "Content & Articles", tiers: [
      { name: "Basic", price: "", features: ["Up to 500 words", "Original, plagiarism-free", "1 revision"] },
      { name: "Standard", price: "", popular: true, features: ["Up to 1000 words", "Keyword research basics", "2 revisions"] },
      { name: "Premium", price: "", features: ["Up to 2000 words", "SEO-friendly structure", "3 revisions", "Priority delivery"] }
    ]},
    { category: "Website", service: "Websites", tiers: [
      { name: "Basic", price: "", features: ["1-page responsive site", "Portfolio or landing page", "Mobile friendly"] },
      { name: "Standard", price: "", popular: true, features: ["Up to 4 pages", "Contact form", "Free hosting setup help"] },
      { name: "Premium", price: "", features: ["6+ pages", "Order or contact backend", "Custom design", "Hosting + domain guidance"] }
    ]},
    { category: "College Project", service: "College Projects", tiers: [
      { name: "Basic", price: "", features: ["Project idea & guidance", "Documentation help"] },
      { name: "Standard", price: "", popular: true, features: ["Development support", "Project report", "Source code explanation"] },
      { name: "Premium", price: "", features: ["Development support", "Report + PPT", "Viva preparation"] }
    ]}
  ]
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
function showModal(id) {
  $("mId").textContent = id;
  $("mText").textContent = "Your order has been sent to our team. Keep this Order ID for reference. We will contact you on your WhatsApp number soon with the quote and timeline.";
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
    if (!CONFIG.backendUrl) throw new Error("backend-not-configured");
    const r = await callBackend("POST", d);
    if (!r || !r.ok) throw new Error((r && r.error) || "Server error");
    store.set("pt-last", Date.now());
    showModal(r.id);
    f.reset(); $("charCount").textContent = "0/1500";
  } catch (err) {
    alert("Sorry, your order could not be sent right now. Please try again in a minute, or message us on Instagram.");
  } finally { btn.disabled = false; btn.textContent = "Submit Order"; }
});

/* ================= Samples ================= */
(function () {
  const list = CONFIG.samples || [];
  if (!list.length) return;
  $("samples").hidden = false; $("navSamples").hidden = false;
  $("samplesGrid").innerHTML = list.map((s) => `
    <figure class="card sample reveal">
      ${s.image ? `<img src="${esc(s.image)}" alt="${esc(s.title)}" loading="lazy">` : ""}
      <figcaption>
        <span class="chip">${esc(s.tag || "Sample")}</span>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.desc || "")}</p>
        ${s.link ? `<a class="btn ghost sm" href="${esc(s.link)}" target="_blank" rel="noopener">View</a>` : ""}
      </figcaption>
    </figure>`).join("");
  document.querySelectorAll("#samplesGrid .reveal").forEach((el) => io.observe(el));
})();

/* ================= Pricing packages ================= */
(function () {
  const cats = CONFIG.pricing || [];
  if (!cats.length) { $("pricing").hidden = true; return; }
  const tabs = $("priceTabs"), box = $("priceGrid");
  tabs.innerHTML = cats.map((c, i) => `<button type="button" class="tab" data-i="${i}" role="tab">${esc(c.category)}</button>`).join("");

  function show(i) {
    const c = cats[i];
    tabs.querySelectorAll(".tab").forEach((b) => b.classList.toggle("on", +b.dataset.i === i));
    box.innerHTML = c.tiers.map((t, j) => `
      <div class="card price-card ${t.popular ? "pop" : ""}">
        ${t.popular ? '<span class="pop-tag">Most popular</span>' : ""}
        <h3>${esc(t.name)}</h3>
        <div class="amt">${t.price ? esc(t.price) : "Ask for quote"}</div>
        <ul>${t.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
        <a href="#order" class="btn ${t.popular ? "" : "ghost"}" data-t="${j}">Choose ${esc(t.name)}</a>
      </div>`).join("");
    box.querySelectorAll("[data-t]").forEach((b) => b.addEventListener("click", () => {
      const t = c.tiers[+b.dataset.t];
      const svc = $("service");
      if ([...svc.options].some((o) => o.value === c.service)) svc.value = c.service;
      const det = $("details");
      det.value = "Package: " + c.category + " - " + t.name + "\n" + det.value.replace(/^Package:.*\n?/, "");
      $("charCount").textContent = det.value.length + "/1500";
    }));
  }
  tabs.addEventListener("click", (e) => { const b = e.target.closest(".tab"); if (b) show(+b.dataset.i); });
  show(0);
})();

/* ================= UPI payment ================= */
(function () {
  const u = CONFIG.upi || {};
  if (!u.id) return;
  $("pay").hidden = false;
  $("payForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = $("payId").value.trim().toUpperCase(), amt = parseFloat($("payAmt").value);
    const out = $("payOut");
    if (!/^PT-\d{4,6}$/.test(id) || !(amt > 0) || amt > 100000) {
      out.innerHTML = '<div class="status-box bad" style="margin-top:16px">Enter a valid Order ID (like PT-0001) and the amount from your confirmed quote.</div>';
      return;
    }
    const link = "upi://pay?pa=" + encodeURIComponent(u.id) + "&pn=" + encodeURIComponent(u.name || "ProTask Studio") +
      "&am=" + amt.toFixed(2) + "&cu=INR&tn=" + encodeURIComponent("Order " + id);
    out.innerHTML = `
      <div class="qr-box">
        <div id="qr"></div>
        <div>Pay <b>₹${esc(amt.toFixed(2))}</b> to <span class="upi">${esc(u.id)}</span></div>
        <a class="btn" href="${esc(link)}">Open UPI app (mobile)</a>
        <small class="note">Scan with any UPI app. Check the name shows "${esc(u.name || "ProTask Studio")}" before paying.<br>
        After paying, send the payment screenshot with your Order ID to us.</small>
        <a class="btn ghost sm" target="_blank" rel="noopener" href="${esc(waLink("Payment done for Order " + id + ", amount Rs " + amt.toFixed(2) + ". Screenshot attached."))}">Send screenshot on WhatsApp</a>
      </div>`;
    if (window.QRCode) new QRCode($("qr"), { text: link, width: 200, height: 200 });
    else $("qr").remove();
  });
})();

/* ================= Reviews ================= */
(function () {
  if (!CONFIG.backendUrl) return;            // reviews need the backend
  $("reviews").hidden = false; $("navReviews").hidden = false;
  const list = $("reviewsList");

  $("rservice").innerHTML = CONFIG.services.map((s) => s.name).concat(CONFIG.extraOptions)
    .map((n) => `<option>${esc(n)}</option>`).join("");

  (async function load() {
    try {
      const r = await callBackend("GET", { action: "reviews" });
      const rows = (r && r.ok && r.reviews) || [];
      list.innerHTML = rows.length ? rows.map((v) => `
        <div class="card review reveal in">
          <div class="stars" aria-label="${esc(v.rating)} out of 5">${"★".repeat(v.rating)}${"☆".repeat(5 - v.rating)}</div>
          <p>${esc(v.text)}</p>
          <small><b>${esc(v.name)}</b> · ${esc(v.service)}</small>
        </div>`).join("")
        : '<p class="note" style="grid-column:1/-1">No reviews yet. Be the first to share your experience!</p>';
    } catch (e) {
      list.innerHTML = "";
    }
  })();

  $("reviewForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("rMsg"), btn = $("rBtn");
    if ($("rgotcha").value) return;
    const d = {
      action: "review", name: $("rname").value.trim(), service: $("rservice").value,
      rating: $("rrating").value, text: $("rtext").value.trim(), _gotcha: ""
    };
    if (d.name.length < 2 || d.text.length < 10) {
      msg.style.color = "var(--bad)"; msg.textContent = "Please enter your name and a short description (min 10 characters)."; return;
    }
    if (Date.now() - (+store.get("pt-rev") || 0) < 60000) { msg.style.color = "var(--bad)"; msg.textContent = "Please wait a minute before sending another review."; return; }
    btn.disabled = true; btn.textContent = "Submitting...";
    try {
      const r = await callBackend("POST", d);
      if (r && r.ok) {
        store.set("pt-rev", Date.now());
        msg.style.color = "var(--ok)"; msg.textContent = "Thank you! Your review will appear after we check it.";
        e.target.reset();
      } else {
        msg.style.color = "var(--bad)"; msg.textContent = (r && r.error) || "Could not submit review.";
      }
    } catch (err) {
      msg.style.color = "var(--bad)"; msg.textContent = "Could not submit right now. Please try again.";
    } finally { btn.disabled = false; btn.textContent = "Submit Review"; }
  });
})();
