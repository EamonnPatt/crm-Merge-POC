# Add-Impact Sales Platform: Next Steps & Missing Components

_Last updated: 2026-10-05. Tracks everything still open against the client's requirements doc, `notes.txt`, and the data-integration plan._

**Where things stand:** the web app in `web-app/` is a clickable **demo** that runs on dummy data (no database yet). Five roles work (Management, Super User, Account Manager, Assistant, CSR). So do budgets, dashboard sharing, account and user creation, the audit trail, and LY / Budget / days-ahead-behind comparisons. As of 2026-10-05, every Section 3 demo gap is built except the items waiting on client input (marked _Blocked_). What's left falls into four groups:

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

- [x] **Link the spreadsheet.** Settings → Order Excellence Spreadsheet (Management / Super User) holds the link. The button opens it; when none is set, Management sees "Link Spreadsheet" instead. Files: `web-app/src/pages/OrderExcellence.tsx`, `web-app/src/pages/Settings.tsx`
- [x] **Embed option:** the "Embedded sheet" tab shows the published embed link from Settings in an iframe (http/https links only)
- [x] **Import option:** CSV/XLSX import with automatic column matching, an editable mapping, and a row-by-row preview (bad rows are flagged and skipped). Rows with an existing Issue ID update that issue; other rows are added
- [x] **CSRs can log and update issues.** Log Issue and Edit forms (order, customer, Account Manager filled in from the customer, type, severity, status, assignee, in-hand date, notes), plus a status dropdown on each row. Saved in the demo data store
- [x] **Proof of the daily update:** a "Last updated by K. Sanders, yesterday 5:40 PM" banner (also on the CSR home page), an amber warning after 24 hours without an update, and a bell notification
- [x] **Audit trail:** every issue creation, field change, and import is logged with before → after details. File: `web-app/src/context/DemoDataContext.tsx`
- [ ] _Blocked on I-1:_ rebuild the table columns around the real spreadsheet. The current columns (now including in-hand date, notes, and last update) are still guesses

### D-2 Project Tracker / CPR Sales Plan (P1)

Requirements doc §2.

- [x] **Working Add / Edit project form**, recorded in the audit trail. Target value accepts shorthand like 65k. File: `web-app/src/pages/ProjectTracker.tsx`
- [x] A **Month** field replaces "Date Entered". Who last updated the entry, and when, shows under the account name. File: `web-app/src/data/mockData.ts` (`ProjectTrackerEntry`)
- [x] **Multiple clickable links** per project, each with a label. Only http(s) links are accepted
- [x] **Moved Project Tracker under the CPR menu section.** File: `web-app/src/layout/Sidebar.tsx`
- [x] Q-7 applied with our recommendation: Account Managers see and edit their own entries (on by default). Until the client confirms, it's a switch in Settings → Pending Client Decisions, and the access matrix follows it. File: `web-app/src/context/RoleContext.tsx` (`canViewProjectTracker`)
- [x] Filters by Account Manager, status, and month. Clickable status tiles show the count and total target value per status

### D-3 Sales Dashboard (P1)

Requirements doc §1.

- [x] **(a) Pie chart:** a donut of GP$ / Sales$ share by Account Manager (company view) or by customer (one Account Manager). Source systems get a labelled split bar instead, since a 2-slice pie reads poorly. The colors pass a color-blindness check, and every slice is also listed with its value and %. The doc asks for "bar graphs / pie charts", and none exists (the only one was removed last round). Suggested: GP share by Account Manager (Management view) and sales by source system. Files: `web-app/src/pages/Sales.tsx`, `web-app/src/components/performance.tsx`
- [x] **(b) Holiday-aware business days** (a placeholder US holiday list until I-10 arrives). Management can edit a Business days row on the Budgets page; overrides can be reset and are audit-logged. September now shows 21., with a Management-editable "business days per month" row on the Budgets page. The doc says "review total business days per month." Today every Mon–Fri counts, so September shows 22 business days instead of 21 (Labor Day). File: `web-app/src/lib/calendar.ts` (`businessDaysInMonth`)
- [x] **(c) Total Sale, Total Cost, GP and Margin % for the selected period**, with matching period totals under the orders table. These are the four metrics named in the Information Export section. Today they only appear in a small summary card built from 8 sample orders
- [x] **(d) The numbers tie out:** sample orders are generated from the same actuals, so order totals equal the stat cards for every Account Manager, period, and metric (checked for Daily / Monthly / Quarterly / Annual × GP$ / Sales$). For M. Alvarez, the summary card shows $6,220 GP while the stat cards show $11,210 GP month-to-date, and the summary ignores the Daily / Monthly / Quarterly / Annual selector. Generate the sample orders from the same data as the performance figures
- [x] **(e) Sales $ / GP $ switch** on the Dashboard, Sales Dashboard, and Budgets. GP $ is the default, and a budget can hold either or both. The default may change once Q-1 is answered
- [x] **(f) Comparison Views** card, labelled to match the doc's wording: "Sales vs Budget", "Sales vs MTD", "Sales vs YTD"

### D-4 Budget entry flexibility (P2)

The doc asks for a "free-flow text or flexible entry field."

- [x] Accept shorthand like `15k`, `$15,000`, `1.2m`. Entries it can't read are highlighted and block Save (today the inline editor turns "15k" into 15, and the New Budget form rejects it). File: `web-app/src/pages/Budgets.tsx`
- [x] A **notes / comments** field per budget, also shown to the Account Manager on My Budget
- [x] **Quarterly** entry (enter Q1–Q4, spread across the months seasonally or evenly) alongside annual and monthly
- [x] Bulk import of budgets from CSV/XLSX, in the same layout as Export. Rows with only an annual total are spread seasonally

### D-5 Other buttons that don't do anything yet (P3)

Not in the requirements doc, but visible in the demo and likely to be clicked:

- [x] The "Add Prospect", "Add Deal", and "Add Partner" buttons work and are audit-logged. Files: `Prospects.tsx`, `SalesPipeline.tsx`, `ReferralPartners.tsx`
- [x] Accounts page: the weekly/monthly activity marks toggle and notes can be edited (both audit-logged), plus a filter box
- [x] Reports page: Excel downloads a real .xlsx file; PDF opens a print-ready page (save it with "Save as PDF"). Each of the 10 reports has real columns and is scoped by role
- [x] Settings: the toggles switch (security toggles are Super User only and audit-logged). "Configure" opens the connection settings, with a demo-only Test connection button
- [x] Top bar: search covers accounts, prospects, deals, order issues, and projects, limited to what the user may see. The bell shows live alerts: tracker not updated, high-severity issues, Account Managers behind pace, missing FY2027 budgets, and sync problems
- [ ] _Blocked:_ apply the Add Impact logo and colors once we have them (currently a placeholder "Add-Impact CRM" brand)

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

- [x] ~~Commit the `notes.txt` changes~~ (done). Hosting has moved to cPanel Node (see `README.md`)
- [ ] **Commit** the Section 3 work and redeploy on cPanel (`npm run build`, then restart)
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
