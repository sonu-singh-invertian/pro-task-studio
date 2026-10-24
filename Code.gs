/**
 * ProTask Studio - Order backend (Google Apps Script)
 * Every new order: saved in the "Orders" sheet + emailed to OWNER_EMAIL automatically.
 * Paste into Extensions -> Apps Script of a Google Sheet, then Deploy as Web app.
 */
const OWNER_EMAIL = "sonusingh.in2019@gmail.com";   // new-order emails arrive here
const SHEET_NAME = "Orders";
const HEADERS = ["Order ID", "Date", "Name", "Phone", "Email", "Service", "Deadline", "Details", "Status", "Internal Notes"];
const STATUSES = ["Received", "In Progress", "Review", "Delivered"];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    const rule = SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).build();
    sh.getRange(2, 9, 1000, 1).setDataValidation(rule);
  }
  return sh;
}

function trim_(v, max) { return String(v == null ? "" : v).trim().slice(0, max); }
// Stops spreadsheet formula injection (only used for what goes into the sheet)
function safe_(v) { return /^[=+\-@]/.test(v) ? "'" + v : v; }

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function sendEmails_(o) {
  const waNum = o.phone.length === 10 ? "91" + o.phone : o.phone;
  const sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();

  // 1) Email to you (owner)
  const ownerBody =
    "New order received!\n\n" +
    "Order ID : " + o.id + "\n" +
    "Name     : " + o.name + "\n" +
    "Phone    : " + o.phone + "\n" +
    "Email    : " + (o.email || "-") + "\n" +
    "Service  : " + o.service + "\n" +
    "Deadline : " + (o.deadline || "-") + "\n\n" +
    "Details:\n" + o.details + "\n\n" +
    "Reply to customer on WhatsApp: https://wa.me/" + waNum + "\n" +
    "All orders sheet: " + sheetUrl + "\n";
  const mail = {
    to: OWNER_EMAIL,
    subject: "New ProTask order " + o.id + " - " + o.service,
    body: ownerBody,
    name: "ProTask Orders"
  };
  if (o.email) mail.replyTo = o.email;   // pressing Reply in Gmail writes to the customer
  MailApp.sendEmail(mail);

  // 2) Confirmation to customer (only if they gave an email)
  if (o.email) {
    try {
      MailApp.sendEmail({
        to: o.email,
        subject: "Your ProTask Studio order " + o.id,
        body: "Hi " + o.name + ",\n\nThanks for booking with ProTask Studio!\n\nOrder ID: " + o.id + "\nService: " + o.service +
          "\n\nWe will contact you on WhatsApp shortly with the quote and timeline.\n\n- ProTask Studio",
        name: "ProTask Studio"
      });
    } catch (err) { Logger.log("Customer mail failed: " + err); }
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const d = JSON.parse(e.postData.contents);
    if (d._gotcha) return json_({ ok: false, error: "Rejected" });
    if (d.action === "review") return handleReview_(d);

    const o = {
      name: trim_(d.name, 80),
      phone: String(d.phone || "").replace(/[^\d]/g, "").slice(0, 13),
      email: trim_(d.email, 120),
      service: trim_(d.service, 60),
      deadline: trim_(d.deadline, 12),
      details: trim_(d.details, 1500)
    };
    if (o.name.length < 2 || o.phone.length < 10 || o.service.length < 2 || o.details.length < 10) {
      return json_({ ok: false, error: "Missing or invalid fields" });
    }
    if (o.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o.email)) {
      return json_({ ok: false, error: "Invalid email" });
    }

    // Save to sheet
    const sh = getSheet_();
    o.id = "PT-" + Utilities.formatString("%04d", sh.getLastRow());   // header row counts as 1
    const when = Utilities.formatDate(new Date(), "Asia/Kolkata", "dd MMM yyyy, hh:mm a");
    const row = sh.getLastRow() + 1;
    const range = sh.getRange(row, 1, 1, HEADERS.length);
    range.setNumberFormat("@");
    range.setValues([[o.id, when, safe_(o.name), o.phone, safe_(o.email), safe_(o.service), o.deadline, safe_(o.details), "Received", ""]]);

    // Email you automatically
    try { sendEmails_(o); }
    catch (mailErr) { Logger.log("Owner mail failed for " + o.id + ": " + mailErr); }

    return json_({ ok: true, id: o.id });
  } catch (err) {
    Logger.log("doPost error: " + err);
    return json_({ ok: false, error: "Server error" });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function doGet(e) {
  try {
    const p = e.parameter || {};
    if (p.action === "reviews") return json_({ ok: true, reviews: getApprovedReviews_() });
    return json_({ ok: true, service: "ProTask orders API" });
  } catch (err) {
    return json_({ ok: false, error: "Server error" });
  }
}

/* ================= Reviews ================= */
const REVIEW_SHEET = "Reviews";
const REVIEW_HEADERS = ["Date", "Order ID (unused)", "Name", "Service", "Rating", "Review", "Approved"];

function getReviewSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(REVIEW_SHEET);
  if (!sh) {
    sh = ss.insertSheet(REVIEW_SHEET);
    sh.appendRow(REVIEW_HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, REVIEW_HEADERS.length).setFontWeight("bold");
    const rule = SpreadsheetApp.newDataValidation().requireValueInList(["No", "Yes"], true).build();
    sh.getRange(2, 7, 1000, 1).setDataValidation(rule);
  }
  return sh;
}

// Anyone can submit a review (name, work done, rating, description).
// It stays hidden until YOU set Approved = Yes in the Reviews sheet.
const REVIEW_SERVICES = ["Professional Resume", "Content & Articles", "Websites", "College Projects", "Cover Letter", "PPT / Report / Assignment", "Other"];

function handleReview_(d) {
  const name = trim_(d.name, 40);
  const text = trim_(d.text, 500);
  const service = REVIEW_SERVICES.indexOf(d.service) >= 0 ? d.service : "Other";
  const rating = parseInt(d.rating, 10);
  if (name.length < 2 || text.length < 10 || !(rating >= 1 && rating <= 5)) {
    return json_({ ok: false, error: "Please fill all fields correctly." });
  }

  const rs = getReviewSheet_();
  const existing = rs.getDataRange().getValues();
  // block exact duplicates and flooding (max 20 reviews waiting for approval)
  let pending = 0;
  for (let i = 1; i < existing.length; i++) {
    if (String(existing[i][5]) === text) return json_({ ok: false, error: "This review was already submitted. Thank you!" });
    if (String(existing[i][6]).toLowerCase() !== "yes") pending++;
  }
  if (pending >= 20) return json_({ ok: false, error: "Too many reviews are waiting for approval. Please try again later." });

  const when = Utilities.formatDate(new Date(), "Asia/Kolkata", "dd MMM yyyy");
  const row = rs.getLastRow() + 1;
  const range = rs.getRange(row, 1, 1, REVIEW_HEADERS.length);
  range.setNumberFormat("@");
  range.setValues([[when, "-", safe_(name), service, String(rating), safe_(text), "No"]]);

  try {
    MailApp.sendEmail({
      to: OWNER_EMAIL,
      subject: "New review awaiting approval - " + name,
      body: "Work: " + service + "\nRating: " + rating + "/5\nName: " + name + "\n\n" + text +
        "\n\nTo publish: open the Reviews sheet and set Approved = Yes.\n" + SpreadsheetApp.getActiveSpreadsheet().getUrl()
    });
  } catch (err) { Logger.log("Review mail failed: " + err); }
  return json_({ ok: true });
}

function getApprovedReviews_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(REVIEW_SHEET);
  if (!sh) return [];
  const v = sh.getDataRange().getValues();
  const out = [];
  for (let i = v.length - 1; i >= 1 && out.length < 12; i--) {   // newest first
    if (String(v[i][6]).toLowerCase() === "yes") {
      out.push({ name: String(v[i][2]), service: String(v[i][3]), rating: parseInt(v[i][4], 10) || 5, text: String(v[i][5]), date: String(v[i][0]) });
    }
  }
  return out;
}

/** Run this ONCE from the Apps Script editor to test: it creates a test order and emails you. */
function testOrder() {
  const e = { postData: { contents: JSON.stringify({
    name: "Test User", phone: "9999999999", email: "", service: "Websites", deadline: "",
    details: "This is a test order to check that email delivery works."
  }) } };
  Logger.log(doPost(e).getContent());
}
