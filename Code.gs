/**
 * ProTask Studio - Order backend (Google Apps Script)
 * Paste this into Extensions -> Apps Script of a Google Sheet, then Deploy as Web app.
 */
const OWNER_EMAIL = "sonusingh.in2019@gmail.com";   // you get a new-order email here
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

// Stops spreadsheet formula injection and limits length
function clean_(v, max) {
  v = String(v == null ? "" : v).trim().slice(0, max);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const d = JSON.parse(e.postData.contents);
    if (d._gotcha) return json_({ ok: false, error: "Rejected" });

    const name = clean_(d.name, 80);
    const phone = String(d.phone || "").replace(/[^\d]/g, "").slice(0, 13);
    const email = clean_(d.email, 120);
    const service = clean_(d.service, 60);
    const deadline = clean_(d.deadline, 12);
    const details = clean_(d.details, 1500);

    if (name.length < 2 || phone.length < 10 || service.length < 2 || details.length < 10) {
      return json_({ ok: false, error: "Missing or invalid fields" });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json_({ ok: false, error: "Invalid email" });
    }

    const sh = getSheet_();
    const id = "PT-" + Utilities.formatString("%04d", sh.getLastRow()); // header row counts as 1
    const when = Utilities.formatDate(new Date(), "Asia/Kolkata", "dd MMM yyyy, hh:mm a");
    const row = sh.getLastRow() + 1;
    const range = sh.getRange(row, 1, 1, HEADERS.length);
    range.setNumberFormat("@");
    range.setValues([[id, when, name, phone, email, service, deadline, details, "Received", ""]]);

    try {
      MailApp.sendEmail(OWNER_EMAIL, "New ProTask order " + id + " - " + service,
        "Order ID: " + id + "\nName: " + name + "\nPhone: " + phone + "\nEmail: " + (email || "-") +
        "\nService: " + service + "\nDeadline: " + (deadline || "-") + "\n\nDetails:\n" + details);
      if (email) {
        MailApp.sendEmail(email, "Your ProTask Studio order " + id,
          "Hi " + name + ",\n\nThanks for booking with ProTask Studio!\n\nOrder ID: " + id + "\nService: " + service +
          "\n\nWe will contact you on WhatsApp shortly with the quote and timeline. You can track your order on our website using your Order ID and the last 4 digits of your phone number.\n\n- ProTask Studio");
      }
    } catch (mailErr) { /* order is already saved; ignore mail failures */ }

    return json_({ ok: true, id: id });
  } catch (err) {
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
