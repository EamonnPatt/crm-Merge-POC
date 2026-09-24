# Add-Impact Sales Platform: Next Steps & Missing Components

_Last updated: 2026-09-21. Tracks everything still open against the client's requirements doc, `notes.txt`, and the data-integration plan._

**Where things stand:** the web app in `web-app/` is a clickable **demo** that runs on dummy data (no database yet). Five roles work (Management, Super User, Account Manager, Assistant, CSR). So do budgets, dashboard sharing, account and user creation, the audit trail, and LY / Budget / days-ahead-behind comparisons. What's left falls into four groups:

1. [Inputs we're waiting on](#1-inputs-were-waiting-on): things the client or vendors must send us
2. [Decisions needed](#2-decisions-needed): questions only the client can answer
3. [Missing demo components](#3-missing-demo-components): gaps against the requirements doc, fixable now with dummy data
4. [Production build](#4-production-build): the real backend and data integration

Priority: **P1** = fix before the next client review · **P2** = soon · **P3** = polish / later

---

## 1. Inputs we're waiting on

| # | Item | From | Blocks |
|---|---|---|---|
| I-1 | **Order Excellence spreadsheet** (link or copy). The requirements doc says it was attached; we don't have it. | Add Impact | D-1 (build Order Excellence around its real columns) |
| I-2 | **Sample of current sales reports** (footnote 1) | Add Impact | Sales Dashboard layout sign-off |
| I-3 | **Sample of current Project Tracker / Sales Plan** (footnote 2) | Add Impact | D-2 field sign-off |
| I-4 | **Sample of current Order Excellence reports** (footnote 3) | Add Impact | D-1 |
| I-5 | **Syncore API key (rev2)** | Facilis, via Add Impact | Phase 0 API test run |
| I-6 | From Facilis: **data suite ETA and what it will include**, API rate limits, confirmation of the 13-month window, and a **one-time historical export older than 13 months** (needed for LY year-to-date back to Jan 2025) | Facilis | Phase 1 Syncore plan |
| I-7 | From ASI: can we get **read-only SQL access** to SmartBooks? If not, can they schedule a daily report matching the [column spec below](#appendix-a-smartbooks-report-spec-send-to-asi)? | ASI | Phase 1–2 SmartBooks plan |
| I-8 | Which **drive** the SmartBooks reports land on (Google Drive, SharePoint/OneDrive, or a network share) | Add Impact | Phase 2 automation |
| I-9 | **Staff list**: name, email, role; which Assistants support which Account Managers; each rep's name **as spelled in SmartBooks and in Syncore** | Add Impact | Rep mapping, user setup |
| I-10 | **Company holiday calendar** (for business days per month) | Add Impact | D-3b |
| I-11 | Real **FY2026 / FY2027 budgets**, or confirmation that Management will enter them in the app | Add Impact | Go-live |

## 2. Decisions needed

| # | Question | Our recommendation |
|---|---|---|
| Q-1 | Are budgets in **Sales $, GP $, or both**? (The doc says "sales vs budget"; the demo uses GP $.) | Support both, with GP $ as the default view |
| Q-2 | Do SmartBooks and Syncore hold **separate business**, or can the **same order appear in both**? If both, which system is the source of truth? | Must be answered before combining data, or totals will double count |
| Q-3 | Is a sale dated by **invoice date** or **order date**? | Invoice date (matches accounting) |
| Q-4 | Do **freight and artwork charges** count in Total Sale? | Match whatever her current reports do (see I-2) |
| Q-5 | Is Total Cost **estimated** (Sales Order line cost) or **actual** (Purchase Orders / supplier invoices)? | Whichever matches Syncore's own job-profit report |
| Q-6 | On split jobs, does the **primary rep get 100% credit**, or is it split by the Syncore commission split? | Ask |
| Q-7 | Can **Account Managers see their own Project Tracker entries**? (It's Management-only today; the doc doesn't say so.) | Yes, own entries only; Management sees all |
| Q-8 | Order Excellence says "**View only for all account managers**." Does that mean Account Managers can view but not edit (current build), or that they can see **every** Account Manager's orders, read-only? | Confirm; switching is a one-line change |
| Q-9 | "All users compare vs LY / Budget / days ahead-behind": do **CSRs** get a performance view? Their access matrix gives them none. | Confirm; if yes, define what CSRs are measured on |
| Q-10 | Creating new **customer accounts** was made Management-only (Account Managers lost the Add button). OK? | Confirm |
| Q-11 | Syncore: **build now or wait** for the data suite? | Build a thin connector now so history starts accumulating (the API only serves 13 months), then switch sources when the suite ships |

## 3. Missing demo components

These can all be built now with dummy data. File paths are relative to the repo root.

### D-1 Order Excellence (P1)

Requirements doc §3. Needs I-1 so the columns match the real spreadsheet.

- [ ] **Link the spreadsheet.** The "Open Linked Spreadsheet" button currently does nothing. Make the URL configurable in Settings (Management / Super User only). Files: `web-app/src/pages/OrderExcellence.tsx`, `web-app/src/pages/Settings.tsx`
- [ ] **Embed option:** an "Embedded sheet" tab using an iframe (Google Sheets / Excel Online publish link)
- [ ] **Import option:** CSV/XLSX import that maps the spreadsheet's columns into the tracker, with a preview before saving
- [ ] **CSRs can log and update issues.** The "Log Issue" button currently does nothing, and statuses can't be edited. Add log/edit forms (status, severity, notes, assignee) and save them in the demo data store
- [ ] **Proof of the daily update:** a "Last updated by K. Sanders, today 5:40 PM" stamp, plus a warning when nothing has been updated in over 24 hours
- [ ] **Audit trail:** log every order-issue change. Management's "record audit" requirement depends on this. File: `web-app/src/context/DemoDataContext.tsx`
- [ ] Rebuild the table columns around the real spreadsheet (the current ones are guesses)

### D-2 Project Tracker / CPR Sales Plan (P1)

Requirements doc §2.

- [ ] **Working Add / Edit project form.** "Add Project" currently does nothing. File: `web-app/src/pages/ProjectTracker.tsx`
- [ ] Add a **Month** field (the doc asks for Month; the demo shows "Date Entered"). File: `web-app/src/data/mockData.ts` (`ProjectTrackerEntry`)
- [ ] **Multiple clickable links** per project (file, quote, order, supporting doc), each with a label. Today there's one link and it's display-only
- [ ] **Move Project Tracker under the CPR menu section.** The doc calls this section "CPR", but it sits under "Management" today. File: `web-app/src/layout/Sidebar.tsx`
- [ ] Apply the Q-7 decision: Account Managers see and edit their own entries. File: `web-app/src/context/RoleContext.tsx` (`canViewProjectTracker`)
- [ ] Filter by Account Manager, status, and month; show total target value per status

### D-3 Sales Dashboard (P1)

Requirements doc §1.

- [ ] **(a) Add a pie chart.** The doc asks for "bar graphs / pie charts", and none exists (the only one was removed last round). Suggested: GP share by Account Manager (Management view) and sales by source system. Files: `web-app/src/pages/Sales.tsx`, `web-app/src/components/performance.tsx`
- [ ] **(b) Holiday-aware business days**, with a Management-editable "business days per month" row on the Budgets page. The doc says "review total business days per month." Today every Mon–Fri counts, so September shows 22 business days instead of 21 (Labor Day). File: `web-app/src/lib/calendar.ts` (`businessDaysInMonth`)
- [ ] **(c) Show Total Sale, Total Cost, GP and Margin % for the selected period.** These are the four metrics named in the Information Export section. Today they only appear in a small summary card built from 8 sample orders
- [ ] **(d) Make the numbers tie out.** For M. Alvarez, the summary card shows $6,220 GP while the stat cards show $11,210 GP month-to-date, and the summary ignores the Daily / Monthly / Quarterly / Annual selector. Generate the sample orders from the same data as the performance figures
- [ ] **(e) Sales $ / GP $ switch** on the dashboard and on budgets, pending Q-1
- [ ] **(f) Label the comparison views** to match the doc's wording: "Sales vs Budget", "Sales vs MTD", "Sales vs YTD"

### D-4 Budget entry flexibility (P2)

The doc asks for a "free-flow text or flexible entry field."

- [ ] Accept shorthand like `15k`, `$15,000`, `1.2m` (today the inline editor turns "15k" into 15, and the New Budget form rejects it). File: `web-app/src/pages/Budgets.tsx`
- [ ] Add a **notes / comments** field per budget
- [ ] Allow **quarterly** entry (enter Q1–Q4, spread across months) in addition to annual and monthly
- [ ] Optional: bulk import budgets from a spreadsheet

### D-5 Other buttons that don't do anything yet (P3)

Not in the requirements doc, but visible in the demo and likely to be clicked:

- [ ] "Add Prospect", "Add Deal", "Add Partner" buttons. Files: `Prospects.tsx`, `SalesPipeline.tsx`, `ReferralPartners.tsx`
- [ ] Accounts page: weekly/monthly activity check marks and notes are display-only (the page text says Account Managers can log activity)
- [ ] Reports page: the Excel / PDF buttons don't export
- [ ] Settings: Notification and Access & Security toggles don't switch; "Configure" on the integration cards does nothing
- [ ] Top bar: the search box and notification bell are decorative
- [ ] Optional: apply the Add Impact logo and colors (currently a placeholder "Add-Impact CRM" brand)

---

## 4. Production build

Starts once the Section 2 decisions are made and the Section 1 access is granted. Rough estimates only.

### Phase 0: Discovery (~1 week, mostly waiting on vendors)

- [ ] Get the Syncore key (I-5) and run a 2–3 day test against live data:
  - [ ] Confirm the fields in [Appendix B](#appendix-b-syncore-api-findings)
  - [ ] Check that a Sales Order's `job_number` matches the Job `id`
  - [ ] Measure paging and rate limits
  - [ ] Compare our GP calculation against a Syncore job-profit report
- [ ] Get a SmartBooks sample report and ask ASI about SQL access (I-7)
- [ ] Have the client sign off a one-page **metric definitions** doc (Q-1 to Q-6)

### Phase 1: Foundation (~2–3 weeks)

- [ ] **Stack:** Python/FastAPI backend, PostgreSQL, a scheduled background worker, hosted on AWS. Keep internal-only access via SSO plus an IP allowlist or VPN
- [ ] **Real login** (Microsoft 365 or Google SSO); roles stored in the database
- [ ] **Enforce permissions on the server.** In the demo, role checks happen only in the browser. The real API must filter by role, so company-wide numbers are never sent to an Account Manager's, Assistant's or CSR's browser
- [ ] **Database tables** (a sketch; to be refined in Phase 0):
  - `ingest_batch`: a record of each load
  - raw copies of each source's records, never edited
  - `sales_fact`: one row per order from either source, with source, order #, invoice date, customer, rep, sale $, cost $
  - `rep` and `rep_alias`: rep name mapping
  - `customer` and `customer_alias`: customer mapping
  - `budget`, `business_day_calendar`, `dashboard_share`, `project`, `order_issue`, `audit_log`, `user`
- [ ] GP = Sale − Cost and Margin = GP ÷ Sale, **calculated by us** in one place for both sources
- [ ] **Syncore connector:** a nightly pull of only records changed since the last run, **started early** so history builds up before records fall out of the 13-month window
- [ ] **SmartBooks importer:** manual upload of the agreed report first (reusing the demo's Import button), with the same file reader Phase 2 will use
- [ ] **Mapping admin screen:** link each source's rep and customer names to app users and accounts; flag anything unmatched
- [ ] **Reconciliation page:** our monthly totals per rep vs a report the client already trusts. Go-live requires a match
- [ ] Replace the demo data store (`DemoDataContext`) with real API calls, keeping the same screens

### Phase 2: Automation (~1–2 weeks, depends on ASI)

- [ ] Automated SmartBooks loading: a drive-folder watcher (Google Drive API or Microsoft Graph), or a scheduled read-only SQL query
- [ ] Historical backfill (Syncore beyond 13 months via I-6; SmartBooks history)
- [ ] Alerts (email/Teams/Slack) when a load fails or when row counts or totals look wrong
- [ ] Loads can be re-run safely without creating duplicates; a failed load never overwrites good data

### Phase 3: Syncore data suite (when Facilis ships it)

- [ ] Point the Syncore connector at the data suite; run both side by side for about 2 weeks, compare, then switch

### Key risks

| Risk | Mitigation |
|---|---|
| The same order counted twice across the two systems | Answer Q-2 first; flag duplicates by order number during import |
| Syncore history falls out of the 13-month window | Start the nightly capture as early as possible; request the one-time export (I-6) |
| ASI won't give SQL access or scheduled reports | Manual upload fallback (already designed) |
| "The numbers don't match" | Signed definitions (Q-1 to Q-6) plus the reconciliation page before go-live |
| Syncore rate limits (undocumented; Jobs appear capped at 10 per page) | Sync only what changed; cache Jobs; confirm limits in Phase 0 |

---

## 5. Housekeeping

- [ ] **Commit** the `notes.txt` changes (uncommitted in the working tree), then redeploy the Render demo (`render.yaml`)
- [ ] **Update the client overview deck** (Google Slides). It says 4 access roles; there are now 5 (Assistant added), plus budgets and dashboard sharing
- [ ] Send ASI the report spec (Appendix A) and Facilis the questions (I-6)
- [ ] Optional cleanup: the original Flask CSV-merge prototype (`app.py`, `templates/`, `static/`, `sessions/`) is superseded by `web-app/`

---

## Appendix A: SmartBooks report spec (send to ASI)

One row per invoice (or invoice line). Daily CSV or XLSX, with stable column names.

| Column | Required | Notes |
|---|---|---|
| Invoice number | Yes | Unique and never reused |
| Invoice date | Yes | |
| Invoice status / type | Yes | Open, posted, void, credit memo. Credits as negative amounts; voids excluded or flagged |
| Order / job number | If available | Used to find orders that also exist in Syncore (Q-2) |
| Customer ID | Yes | The stable SmartBooks ID, not just the name |
| Customer name | Yes | |
| Sales rep / Account Manager | Yes | As entered in SmartBooks |
| Secondary rep and split % | If used | For Q-6 |
| Total sale (excl. tax) | Yes | |
| Freight / artwork charged | Preferred | So Q-4 can go either way |
| Total cost | Yes | |
| Gross profit | Optional | We recalculate it and use theirs as a cross-check |
| Last modified / posted date | Preferred | Lets us load only changes |

**Delivery:**
- Daily, covering the current and previous month, so late adjustments are picked up.
- Plus a **one-time history file** from January 2024 onward, for LY comparisons.

## Appendix B: Syncore API findings

From the public rev2 spec at docs.syncore.app, checked 2026-09-21. Rev1 is deprecated.

- **Base URL / auth:** `https://api.syncore.app/v2/orders`, with the key sent in an `x-api-key` header. Results are paged with `page` + `count` and include `total_results` and next/prev links.
- **Endpoints we need:**
  - `GET /jobs/salesorders`: filters `date_from/to`, **`last_modified_date_from/to`**, `invoice_date_from/to`, `invoice_status_date_from/to`, `status`
  - `GET /jobs/purchaseorders`: filters `date_from/to`, `last_modified_date_from/to`, `status`
  - `GET /jobs` and `GET /jobs/{job_id}`: rep information lives here. The search has no "modified since" filter and appears capped at 10 records per page
- **Fields available:**
  - Sales Order: `sub_total_value`, `total_value`, `invoice_date`, `status`, `client`, `line_items[].cost_value` × `quantity`
  - Purchase Order: `sub_total_value`
  - Job: `primary_rep{name}`, `secondary_rep{name}`, `commission_split`, `customer_service_rep_name`, `completed_date`
- **Gaps:**
  - No GP or margin fields (we calculate them).
  - The rep is on the Job, not the Sales Order, and identified by name only (needs mapping).
  - The 13-month window and rate limits aren't documented.
