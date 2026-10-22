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
          "\n\nWe will contact you on WhatsApp shortly with the quote and timeline. You can track your order on our website using your Order ID and the last 4 digits of your phone number.\n\n- ProTask Studio",
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
    if (p.action !== "track") return json_({ ok: true, service: "ProTask orders API" });
    const id = String(p.id || "").trim().toUpperCase();
    const p4 = String(p.p4 || "").replace(/[^\d]/g, "");
    if (!id || p4.length !== 4) return json_({ ok: false, error: "Invalid request" });

    const values = getSheet_().getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]).toUpperCase() === id) {
        const phone = String(values[i][3]);
        if (phone.slice(-4) !== p4) break; // same message as not found, so IDs can't be probed
        return json_({ ok: true, id: values[i][0], date: String(values[i][1]), service: values[i][5], status: values[i][8] || "Received" });
      }
    }
    return json_({ ok: false, error: "Order not found. Check your Order ID and phone digits." });
  } catch (err) {
    return json_({ ok: false, error: "Server error" });
  }
}

/** Run this ONCE from the Apps Script editor to test: it creates a test order and emails you. */
function testOrder() {
  const e = { postData: { contents: JSON.stringify({
    name: "Test User", phone: "9999999999", email: "", service: "Websites", deadline: "",
    details: "This is a test order to check that email delivery works."
  }) } };
  Logger.log(doPost(e).getContent());
}
