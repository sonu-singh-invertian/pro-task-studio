# ProTask Studio

Official website of **ProTask Studio** - Your Academic & Task Partner.
Instagram: [@pro.task.studio](https://www.instagram.com/pro.task.studio/)

## Features
- Responsive site with light/dark theme, animations and an accessible layout
- Services section generated from one config (easy to edit prices and services)
- Order form with validation, spam protection (honeypot + cooldown) and an instant **Order ID**
- **Backend on Google Sheets** (free): every order is saved, you get an email, the customer gets a confirmation
- **Order tracking** by Order ID + last 4 digits of phone (status: Received, In Progress, Review, Delivered)
- WhatsApp confirmation button, works even if the backend is not set up yet

## Files
| File | Purpose |
|---|---|
| `index.html` | Page structure |
| `style.css` | Styles and themes |
| `script.js` | Logic and the `CONFIG` block to edit |
| `Code.gs` | Google Apps Script backend (do **not** upload to GitHub Pages; paste it into Apps Script) |

## Setup: backend (10 minutes)
1. Create a new Google Sheet (name it "ProTask Orders").
2. Go to **Extensions -> Apps Script**, delete the sample code, paste the contents of `Code.gs`, and set `OWNER_EMAIL`.
3. Click **Save**, choose the function `doGet` in the toolbar and press **Run** once. Approve the permissions (Advanced -> Go to project). This creates the "Orders" sheet.
4. Click **Deploy -> New deployment -> Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the **Web app URL** (ends with `/exec`).
6. In `script.js`, paste it in `CONFIG.backendUrl`.
7. If you change `Code.gs` later: **Deploy -> Manage deployments -> Edit -> New version -> Deploy** (the URL stays the same).

## Setup: GitHub Pages
1. Upload `index.html`, `style.css`, `script.js`, `README.md` to the repo root (file names must be exactly these, lowercase).
2. **Settings -> Pages -> Deploy from a branch -> main / root -> Save**.
3. Site: `https://<username>.github.io/<repo>/`

## Using it day to day
- New orders appear in the **Orders** sheet. Change the **Status** column (dropdown) and customers see it on the Track section.
- "Internal Notes" column is private and never shown on the site.
- Edit services, prices and contact info in the `CONFIG` block in `script.js`.

## Notes
- Tracking needs both the Order ID and the last 4 phone digits, so other people cannot view an order by guessing IDs.
- Free Gmail accounts can send about 100 emails/day via Apps Script, which is plenty for small studios.
