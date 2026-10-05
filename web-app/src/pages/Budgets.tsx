import { useState } from "react";
import { Download, Pencil, Plus, Info, Upload, CalendarDays, RotateCcw, StickyNote } from "lucide-react";
import { Badge, Button, Card, Field, Modal, PageHeader, SegmentedControl, StatCard, currency, inputClass } from "../components/ui";
import { RestrictedNotice } from "../components/RestrictedNotice";
import { MetricSwitch, PerformanceStatCards, signedCurrency } from "../components/performance";
import { SpreadsheetImportModal, type RowResult } from "../components/SpreadsheetImportModal";
import { downloadCsv } from "../lib/csv";
import { CURRENT_MONTH, FISCAL_YEAR, MONTHS, defaultBusinessDays, holidaysIn } from "../lib/calendar";
import { parseAmount, parseAmountOrZero } from "../lib/amount";
import { combinedPerformance, formatPct, monthlyBudgetFor, repPerformance, withMetrics } from "../lib/performance";
import { useMetricPreference } from "../lib/usePreference";
import { useRole } from "../context/RoleContext";
import { useDemoData } from "../context/DemoDataContext";
import { metricLabel, repActuals, type Metric } from "../data/mockData";

const FISCAL_YEARS = [FISCAL_YEAR, FISCAL_YEAR + 1];
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

const total = (values: number[]) => values.reduce((a, v) => a + v, 0);
/** Draft cells hold whatever was typed; blank counts as $0 and anything unparseable is flagged. */
const draftValues = (draft: string[]) => draft.map(parseAmountOrZero);
const SHORTHAND_HINT = 'Type amounts any way you like: "15000", "15k", "$15,000", "1.2m".';

const cellInput =
  "w-[4.5rem] rounded-md border bg-white px-1.5 py-1 text-right text-sm text-slate-800 focus:outline-none focus:ring-2";
const cellTone = (valid: boolean) =>
  valid ? "border-slate-300 focus:border-brand-400 focus:ring-brand-100" : "border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-100";

export default function Budgets() {
  const { canViewBudgets, canEditBudgets } = useRole();
  if (!canViewBudgets) {
    return (
      <div>
        <PageHeader title="Budgets" description="Budgets by Account Manager." />
        <RestrictedNotice requiredRoles="Account Managers, Management, and Super User" />
      </div>
    );
  }
  return canEditBudgets ? <ManageBudgets /> : <MyBudget />;
}

/** Management / Super User: create and edit every Account Manager's budget. */
function ManageBudgets() {
  const { profile } = useRole();
  const { budgets, team, saveBudget, perfInputs } = useDemoData();
  const [fiscalYear, setFiscalYear] = useState(FISCAL_YEAR);
  const [metric, setMetric] = useMetricPreference();
  const [editingRep, setEditingRep] = useState<string | null>(null);
  const [draft, setDraft] = useState<string[]>([]);
  const [draftNotes, setDraftNotes] = useState("");
  const [createFor, setCreateFor] = useState<{ rep: string } | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const label = metricLabel[metric];
  const accountManagers = team.filter((m) => m.role === "account_manager").map((m) => m.name);
  const rows = accountManagers.map((rep) => {
    const budget = budgets.find((b) => b.rep === rep && b.fiscalYear === fiscalYear);
    return { rep, budget, values: budget?.[metric] };
  });
  const withBudget = rows.filter((r) => r.values);
  const monthTotals = MONTHS.map((_, m) => total(withBudget.map((r) => r.values![m])));
  const ytd = withMetrics(combinedPerformance(accountManagers, "annual", perfInputs(metric)));

  const parsedDraft = draftValues(draft);
  const draftValid = parsedDraft.every((v) => v !== null);

  const startEdit = (rep: string, monthly: number[], notes: string) => {
    setEditingRep(rep);
    setDraft(monthly.map(String));
    setDraftNotes(notes);
  };
  const saveEdit = () => {
    if (!editingRep || !draftValid) return;
    saveBudget({ rep: editingRep, fiscalYear, metric, monthly: parsedDraft as number[], notes: draftNotes.trim() }, profile);
    setEditingRep(null);
  };

  return (
    <div>
      <PageHeader
        title="Budgets"
        description="Create and maintain monthly budgets for each Account Manager, in GP$ and/or Sales$. Account Managers see their own budget; Sales Dashboards compare against it."
        actions={
          <>
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <Upload size={15} /> Import
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                downloadCsv(
                  `budgets-fy${fiscalYear}-${metric}.csv`,
                  withBudget.map(({ rep, values, budget }) => ({
                    account_manager: rep,
                    fiscal_year: fiscalYear,
                    metric: metric === "gp" ? "GP" : "Sales",
                    ...Object.fromEntries(MONTHS.map((m, i) => [m.toLowerCase(), values![i]])),
                    annual_total: total(values!),
                    notes: budget?.notes ?? "",
                  }))
                )
              }
            >
              <Download size={15} /> Export
            </Button>
            <Button onClick={() => setCreateFor({ rep: "" })}>
              <Plus size={15} /> New Budget
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SegmentedControl
          options={FISCAL_YEARS.map((fy) => ({ key: String(fy), label: `FY${fy}` }))}
          value={String(fiscalYear)}
          onChange={(v) => {
            setFiscalYear(Number(v));
            setEditingRep(null);
          }}
        />
        <MetricSwitch
          value={metric}
          onChange={(m) => {
            setMetric(m);
            setEditingRep(null);
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={`FY${fiscalYear} total ${label} budget`} value={currency(total(monthTotals))} icon={<Info size={18} />} />
        <StatCard
          label={`Account Managers with a ${label} budget`}
          value={`${withBudget.length} of ${accountManagers.length}`}
          delta={withBudget.length === accountManagers.length ? "All budgets set" : `${accountManagers.length - withBudget.length} still to set`}
          deltaTone={withBudget.length === accountManagers.length ? "positive" : "negative"}
        />
        {fiscalYear === FISCAL_YEAR ? (
          <StatCard
            label="Company YTD vs Budget (to date)"
            value={signedCurrency(ytd.actual - ytd.budgetToDate)}
            delta={`${ytd.pctOfBudget.toFixed(0)}% of annual budget achieved`}
            deltaTone={ytd.actual >= ytd.budgetToDate ? "positive" : "negative"}
          />
        ) : (
          <StatCard label="Planning year" value={`FY${fiscalYear}`} delta="Budgets take effect Jan 1" deltaTone="neutral" />
        )}
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="sticky left-0 bg-slate-50 px-4 py-3 font-medium">Account Manager</th>
                {MONTHS.map((m) => (
                  <th key={m} className="px-1.5 py-3 text-right font-medium">
                    {m}
                  </th>
                ))}
                <th className="px-3 py-3 text-right font-medium">FY Total</th>
                <th className="px-3 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(({ rep, budget, values }) => {
                const editing = editingRep === rep;
                return [
                  <tr key={rep} className={editing ? "bg-brand-50/40" : "hover:bg-slate-50"}>
                    <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-3 font-medium text-slate-800">
                      {rep}
                      {editing ? (
                        // Save/Cancel live in the sticky column so they stay visible while the wide row scrolls.
                        <div className="mt-1.5 flex gap-1.5">
                          <Button className={`px-2.5 py-1 ${draftValid ? "" : "cursor-not-allowed opacity-50"}`} onClick={saveEdit} disabled={!draftValid}>
                            Save
                          </Button>
                          <Button variant="ghost" className="px-2.5 py-1" onClick={() => setEditingRep(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="text-[11px] font-normal text-slate-400">
                          {values ? `Updated ${budget!.updatedAt.slice(0, 10)} · ${budget!.updatedBy}` : <Badge tone="amber">No {label} budget</Badge>}
                          {budget?.notes && (
                            <span className="mt-0.5 flex max-w-[11rem] items-center gap-1 text-slate-500" title={budget.notes}>
                              <StickyNote size={11} className="shrink-0" /> <span className="truncate">{budget.notes}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    {MONTHS.map((m, i) => (
                      <td key={m} className="whitespace-nowrap px-1.5 py-3 text-right text-slate-600">
                        {editing ? (
                          <input
                            type="text"
                            aria-label={`${rep} ${m} budget`}
                            value={draft[i]}
                            onChange={(e) => setDraft((d) => d.map((v, j) => (j === i ? e.target.value : v)))}
                            className={`${cellInput} ${cellTone(parsedDraft[i] !== null)}`}
                          />
                        ) : values ? (
                          currency(values[i])
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-slate-800">
                      {editing ? (draftValid ? currency(total(parsedDraft as number[])) : "—") : values ? currency(total(values)) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      {editing ? null : values ? (
                        <Button variant="secondary" onClick={() => startEdit(rep, values, budget?.notes ?? "")}>
                          <Pencil size={14} /> Edit
                        </Button>
                      ) : (
                        <Button onClick={() => setCreateFor({ rep })}>
                          <Plus size={14} /> Create
                        </Button>
                      )}
                    </td>
                  </tr>,
                  editing && (
                    <tr key={`${rep}-notes`} className="bg-brand-50/40">
                      <td colSpan={15} className="px-4 pb-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            aria-label={`${rep} budget notes`}
                            className={`${inputClass} max-w-xl`}
                            placeholder="Notes / comments on this budget (optional)"
                            value={draftNotes}
                            onChange={(e) => setDraftNotes(e.target.value)}
                          />
                          <span className={`text-xs ${draftValid ? "text-slate-400" : "text-rose-600"}`}>
                            {draftValid ? SHORTHAND_HINT : "Fix the highlighted months — amounts like 15000, 15k or $1.2m."}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ),
                ];
              })}
            </tbody>
            <tfoot className="border-t border-slate-200 bg-slate-50 text-sm">
              <tr>
                <td className="sticky left-0 bg-slate-50 px-4 py-3 font-semibold text-slate-800">All Account Managers</td>
                {monthTotals.map((v, i) => (
                  <td key={i} className="whitespace-nowrap px-1.5 py-3 text-right font-medium text-slate-700">
                    {withBudget.length ? currency(v) : "—"}
                  </td>
                ))}
                <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-slate-900">{currency(total(monthTotals))}</td>
                <td />
              </tr>
              <BusinessDaysRow key={fiscalYear} fiscalYear={fiscalYear} />
            </tfoot>
          </table>
        </div>
      </Card>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
        <Info size={13} /> Changes apply immediately to every Sales Dashboard's Budget and Days Ahead / Behind comparisons, and are
        recorded in the Audit Trail. Business days drive daily pace: Mon–Fri minus company holidays (ᴴ = month has a holiday;
        hover for which), unless overridden here (* = adjusted).
      </p>

      {createFor && (
        <CreateBudgetModal
          initialRep={createFor.rep}
          initialYear={fiscalYear}
          initialMetric={metric}
          onClose={() => setCreateFor(null)}
          onCreated={(fy, m) => {
            setFiscalYear(fy);
            setMetric(m);
            setCreateFor(null);
          }}
        />
      )}
      {importOpen && <ImportBudgetsModal fiscalYear={fiscalYear} metric={metric} onClose={() => setImportOpen(false)} />}
    </div>
  );
}

/** "Review total business days per month": holiday-aware defaults that Management can override. */
function BusinessDaysRow({ fiscalYear }: { fiscalYear: number }) {
  const { profile } = useRole();
  const { businessDays, saveBusinessDays } = useDemoData();
  const override = businessDays.find((o) => o.fiscalYear === fiscalYear);
  const defaults = defaultBusinessDays(fiscalYear);
  const current = override?.monthly ?? defaults;
  const [draft, setDraft] = useState<string[] | null>(null);

  const parsed = draft?.map((v) => (/^\d{1,2}$/.test(v.trim()) && Number(v) <= 31 ? Number(v) : null));
  const valid = parsed?.every((v) => v !== null) ?? true;
  const save = () => {
    if (!parsed || !valid) return;
    const monthly = parsed as number[];
    saveBusinessDays(fiscalYear, monthly.every((v, i) => v === defaults[i]) ? null : monthly, profile);
    setDraft(null);
  };

  return (
    <tr className="border-t border-slate-200">
      <td className="sticky left-0 bg-slate-50 px-4 py-3">
        <span className="flex items-center gap-1.5 font-semibold text-slate-800">
          <CalendarDays size={14} className="text-slate-400" /> Business days
        </span>
        <span className="text-[11px] text-slate-400">
          {override ? `Adjusted ${override.updatedAt.slice(0, 10)} · ${override.updatedBy}` : "Mon–Fri minus company holidays"}
        </span>
        {draft && (
          <div className="mt-1.5 flex gap-1.5">
            <Button className={`px-2.5 py-1 ${valid ? "" : "cursor-not-allowed opacity-50"}`} onClick={save} disabled={!valid}>
              Save
            </Button>
            <Button variant="ghost" className="px-2.5 py-1" onClick={() => setDraft(null)}>
              Cancel
            </Button>
          </div>
        )}
      </td>
      {current.map((days, i) => {
        const holidays = holidaysIn(fiscalYear, i);
        const changed = days !== defaults[i];
        return (
          <td
            key={i}
            className="whitespace-nowrap px-1.5 py-3 text-right text-slate-700"
            title={holidays.length ? `Holidays: ${holidays.map((h) => `${h.name} (${h.date.slice(5)})`).join(", ")}` : "No company holidays"}
          >
            {draft ? (
              <input
                aria-label={`${MONTHS[i]} business days`}
                value={draft[i]}
                onChange={(e) => setDraft((d) => d!.map((v, j) => (j === i ? e.target.value : v)))}
                className={`w-12 ${cellInput} ${cellTone(parsed![i] !== null)}`}
              />
            ) : (
              <span className={changed ? "font-semibold text-brand-700" : ""}>
                {days}
                {holidays.length > 0 && !changed && <sup className="ml-0.5 text-[9px] text-slate-400">H</sup>}
                {changed && <sup className="ml-0.5 text-[9px]">*</sup>}
              </span>
            )}
          </td>
        );
      })}
      <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-slate-800">{total(current)} days</td>
      <td className="whitespace-nowrap px-3 py-3 text-right">
        {!draft && (
          <div className="flex justify-end gap-1.5">
            {override && (
              <Button variant="ghost" className="px-2 py-1" onClick={() => saveBusinessDays(fiscalYear, null, profile)} title="Reset to the holiday calendar">
                <RotateCcw size={14} />
              </Button>
            )}
            <Button variant="secondary" onClick={() => setDraft(current.map(String))}>
              <Pencil size={14} /> Edit
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}

type Distribution = "seasonal" | "even";
type EntryMode = "annual" | "quarterly" | "monthly";

/** Weights for spreading an amount: the rep's last-year mix (or the company's for a new rep), or flat. */
function weightsFor(mode: Distribution, rep: string, metric: Metric): number[] {
  if (mode === "even") return MONTHS.map(() => 1);
  const repLy = repActuals.find((r) => r.rep === rep)?.[metric].monthlyLy;
  return repLy ?? MONTHS.map((_, m) => total(repActuals.map((r) => r[metric].monthlyLy[m])));
}

/** Spread an amount over the given months by weight, rounded to $100, with the last month absorbing rounding. */
function spread(amount: number, months: number[], weights: number[]): Map<number, number> {
  const weightTotal = total(months.map((m) => weights[m]));
  const result = new Map(months.map((m) => [m, Math.round((amount * weights[m]) / weightTotal / 100) * 100]));
  const last = months[months.length - 1];
  result.set(last, result.get(last)! + amount - total([...result.values()]));
  return result;
}

function CreateBudgetModal({
  initialRep,
  initialYear,
  initialMetric,
  onClose,
  onCreated,
}: {
  initialRep: string;
  initialYear: number;
  initialMetric: Metric;
  onClose: () => void;
  onCreated: (fiscalYear: number, metric: Metric) => void;
}) {
  const { profile } = useRole();
  const { budgets, team, saveBudget } = useDemoData();
  const [fiscalYear, setFiscalYear] = useState(initialYear);
  const [metric, setMetric] = useState<Metric>(initialMetric);
  const [rep, setRep] = useState(initialRep);
  const [entry, setEntry] = useState<EntryMode>("annual");
  const [annual, setAnnual] = useState("");
  const [quarters, setQuarters] = useState<string[]>(QUARTERS.map(() => ""));
  const [mode, setMode] = useState<Distribution>("seasonal");
  const [monthly, setMonthly] = useState<string[]>(MONTHS.map(() => ""));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const available = team
    .filter((m) => m.role === "account_manager")
    .map((m) => m.name)
    .filter((name) => !budgets.find((b) => b.rep === name && b.fiscalYear === fiscalYear)?.[metric]);

  /** Recalculate the months from the annual or quarterly drivers. */
  const recompute = (next: { entry?: EntryMode; annual?: string; quarters?: string[]; mode?: Distribution; rep?: string; metric?: Metric }) => {
    const e = next.entry ?? entry;
    if (e === "monthly") return;
    const weights = weightsFor(next.mode ?? mode, next.rep ?? rep, next.metric ?? metric);
    if (e === "annual") {
      const value = parseAmount(next.annual ?? annual);
      if (!value) return setMonthly(MONTHS.map(() => ""));
      const spreadOut = spread(value, MONTHS.map((_, m) => m), weights);
      setMonthly(MONTHS.map((_, m) => String(spreadOut.get(m))));
    } else {
      const qs = next.quarters ?? quarters;
      setMonthly(
        MONTHS.map((_, m) => {
          const q = Math.floor(m / 3);
          const value = parseAmount(qs[q]);
          if (!value) return "";
          return String(spread(value, [q * 3, q * 3 + 1, q * 3 + 2], weights).get(m));
        })
      );
    }
  };

  const parsedMonths = draftValues(monthly);
  const monthsValid = parsedMonths.every((v) => v !== null);
  const monthlyTotal = monthsValid ? total(parsedMonths as number[]) : 0;
  const annualValue = entry === "annual" ? parseAmount(annual) ?? 0 : entry === "quarterly" ? total(quarters.map((q) => parseAmount(q) ?? 0)) : 0;
  const driverInvalid =
    (entry === "annual" && annual.trim() !== "" && parseAmount(annual) === null) ||
    (entry === "quarterly" && quarters.some((q) => q.trim() !== "" && parseAmount(q) === null));

  const submit = () => {
    if (!rep || !available.includes(rep)) return setError(`Choose an Account Manager who doesn't have a ${metricLabel[metric]} budget for this year yet.`);
    if (driverInvalid || !monthsValid) return setError('Some amounts aren\'t readable. Use numbers like "15000", "15k", "$15,000" or "1.2m".');
    if (monthlyTotal <= 0) return setError("Enter an annual, quarterly, or monthly amount.");
    saveBudget({ rep, fiscalYear, metric, monthly: parsedMonths as number[], notes: notes.trim() }, profile);
    onCreated(fiscalYear, metric);
  };

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title="New Budget"
      description="Set an Account Manager's monthly budget for a fiscal year."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Create Budget</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Fiscal year">
          <select
            className={inputClass}
            value={fiscalYear}
            onChange={(e) => {
              setFiscalYear(Number(e.target.value));
              setRep("");
            }}
          >
            {FISCAL_YEARS.map((fy) => (
              <option key={fy} value={fy}>
                FY{fy}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Budget in">
          <select
            className={inputClass}
            value={metric}
            onChange={(e) => {
              const m = e.target.value as Metric;
              setMetric(m);
              recompute({ metric: m });
            }}
          >
            <option value="gp">GP $</option>
            <option value="sales">Sales $</option>
          </select>
        </Field>
        <Field label="Account Manager" hint={available.length === 0 ? "Every Account Manager already has this budget for the year." : undefined}>
          <select
            className={inputClass}
            value={available.includes(rep) ? rep : ""}
            onChange={(e) => {
              setRep(e.target.value);
              recompute({ rep: e.target.value });
            }}
          >
            <option value="">Select…</option>
            {available.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <Field label="Enter as" group>
          <SegmentedControl
            options={[
              { key: "annual", label: "Annual" },
              { key: "quarterly", label: "Quarterly" },
              { key: "monthly", label: "Monthly" },
            ]}
            value={entry}
            onChange={(e: EntryMode) => {
              setEntry(e);
              recompute({ entry: e });
            }}
          />
        </Field>
        {entry !== "monthly" && (
          <Field label="Spread across months" group>
            <SegmentedControl
              options={[
                { key: "seasonal", label: "Seasonal (LY mix)" },
                { key: "even", label: "Even split" },
              ]}
              value={mode}
              onChange={(m: Distribution) => {
                setMode(m);
                recompute({ mode: m });
              }}
            />
          </Field>
        )}
      </div>

      {entry === "annual" && (
        <div className="mt-4 max-w-xs">
          <Field label={`Annual ${metricLabel[metric]} target`} hint={SHORTHAND_HINT}>
            <input
              type="text"
              placeholder="e.g. 180k"
              className={`${inputClass} ${parseAmount(annual) === null && annual.trim() ? "border-rose-400" : ""}`}
              value={annual}
              onChange={(e) => {
                setAnnual(e.target.value);
                recompute({ annual: e.target.value });
              }}
            />
          </Field>
        </div>
      )}
      {entry === "quarterly" && (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {QUARTERS.map((q, i) => (
              <label key={q} className="block">
                <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  {q} ({MONTHS.slice(i * 3, i * 3 + 3).join("–").replace(/–\w+–/, "–")})
                </span>
                <input
                  type="text"
                  aria-label={`${q} budget`}
                  placeholder="e.g. 45k"
                  className={`${inputClass} px-2 py-1.5 ${parseAmount(quarters[i]) === null && quarters[i].trim() ? "border-rose-400" : ""}`}
                  value={quarters[i]}
                  onChange={(e) => {
                    const next = quarters.map((v, j) => (j === i ? e.target.value : v));
                    setQuarters(next);
                    recompute({ quarters: next });
                  }}
                />
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-400">{SHORTHAND_HINT} Each quarter is spread across its three months.</p>
        </div>
      )}

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-slate-600">Monthly {metricLabel[metric]} budget {entry === "monthly" ? "" : "(you can still adjust any month)"}</p>
          <p className={`text-xs ${annualValue > 0 && monthlyTotal !== annualValue ? "text-amber-600" : "text-slate-400"}`}>
            Total {currency(monthlyTotal)}
            {annualValue > 0 && monthlyTotal !== annualValue && ` · differs from target by ${signedCurrency(monthlyTotal - annualValue)}`}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {MONTHS.map((m, i) => (
            <label key={m} className="block">
              <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{m}</span>
              <input
                type="text"
                aria-label={`${m} amount`}
                className={`${inputClass} px-2 py-1.5 ${parsedMonths[i] === null ? "border-rose-400 bg-rose-50" : ""}`}
                value={monthly[i]}
                onChange={(e) => setMonthly((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <Field label="Notes / comments">
          <textarea
            className={`${inputClass} h-16 resize-none`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Includes the Northgate regional deal from Q3."
          />
        </Field>
      </div>

      {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    </Modal>
  );
}

interface BudgetImportRow {
  rep: string;
  fiscalYear: number;
  metric: Metric;
  monthly: number[];
}

function ImportBudgetsModal({ fiscalYear, metric, onClose }: { fiscalYear: number; metric: Metric; onClose: () => void }) {
  const { profile } = useRole();
  const { team, importBudgets } = useDemoData();
  const accountManagers = team.filter((m) => m.role === "account_manager").map((m) => m.name);

  const toRecord = (v: Record<string, string>): RowResult<BudgetImportRow> => {
    const rep = accountManagers.find((am) => am.toLowerCase() === v.rep.trim().toLowerCase());
    if (!rep) return { error: `"${v.rep}" isn't an Account Manager in the app.` };
    const fy = v.fiscalYear ? Number(v.fiscalYear.replace(/\D/g, "")) : fiscalYear;
    if (!FISCAL_YEARS.includes(fy)) return { error: `Fiscal year "${v.fiscalYear}" isn't FY${FISCAL_YEARS.join(" or FY")}.` };
    const metricText = v.metric.trim().toLowerCase();
    const rowMetric: Metric | null = !metricText ? metric : metricText.startsWith("g") ? "gp" : metricText.startsWith("s") || metricText.startsWith("r") ? "sales" : null;
    if (!rowMetric) return { error: `Metric "${v.metric}" should be GP or Sales.` };
    const months = MONTHS.map((m) => v[m.toLowerCase()] ?? "");
    const hasMonths = months.some((m) => m.trim() !== "");
    let monthly: number[];
    if (hasMonths) {
      const parsed = draftValues(months);
      const bad = parsed.findIndex((p) => p === null);
      if (bad >= 0) return { error: `${MONTHS[bad]} amount "${months[bad]}" isn't a number.` };
      monthly = parsed as number[];
    } else {
      const annual = parseAmount(v.annual);
      if (!annual) return { error: "No monthly amounts or annual total." };
      const s = spread(annual, MONTHS.map((_, m) => m), weightsFor("seasonal", rep, rowMetric));
      monthly = MONTHS.map((_, m) => s.get(m)!);
    }
    return { record: { rep, fiscalYear: fy, metric: rowMetric, monthly } };
  };

  return (
    <SpreadsheetImportModal
      title="Import Budgets"
      description="Load budgets from a spreadsheet: one row per Account Manager, with monthly columns (Jan–Dec) or just an annual total."
      fields={[
        { key: "rep", label: "Account Manager", required: true, aliases: ["account_manager", "am", "rep", "name"] },
        { key: "fiscalYear", label: "Fiscal Year", aliases: ["fiscal_year", "fy", "year"] },
        { key: "metric", label: "Metric", aliases: ["type", "budget type"] },
        ...MONTHS.map((m) => ({ key: m.toLowerCase(), label: m, aliases: [new Date(2026, MONTHS.indexOf(m), 1).toLocaleString("en-US", { month: "long" })] })),
        { key: "annual", label: "Annual Total", aliases: ["annual_total", "annual", "total", "fy total"] },
      ]}
      toRecord={toRecord}
      previewColumns={[
        { label: "Account Manager", render: (r) => r.rep },
        { label: "FY", render: (r) => r.fiscalYear },
        { label: "Metric", render: (r) => metricLabel[r.metric] },
        { label: "Jan", render: (r) => currency(r.monthly[0]) },
        { label: "Jun", render: (r) => currency(r.monthly[5]) },
        { label: "Dec", render: (r) => currency(r.monthly[11]) },
        { label: "Annual", render: (r) => <span className="font-semibold">{currency(total(r.monthly))}</span> },
      ]}
      onImport={(records, fileName) => {
        importBudgets(records, fileName, profile);
        return `Imported ${records.length} budget(s) from ${fileName}. Existing budgets for the same Account Manager, year and metric were replaced; the Audit Trail lists each one.`;
      }}
      onClose={onClose}
      footnote={`Tip: the Export button produces this exact layout, so you can export, edit in Excel, and re-import. Rows without a Fiscal Year use FY${fiscalYear}; rows without a Metric use ${metricLabel[metric]}. Amount shorthand like 15k works.`}
    />
  );
}

/** Account Manager: read-only view of their own budget against actuals and last year. */
function MyBudget() {
  const { profile } = useRole();
  const { budgets, perfInputs } = useDemoData();
  const [metric, setMetric] = useMetricPreference();
  const rep = profile.name;
  const budget = budgets.find((b) => b.rep === rep && b.fiscalYear === FISCAL_YEAR);
  const values = budget?.[metric];
  const nextYear = budgets.find((b) => b.rep === rep && b.fiscalYear === FISCAL_YEAR + 1)?.[metric];
  const actuals = repActuals.find((r) => r.rep === rep)?.[metric];
  const inputs = perfInputs(metric);
  const monthlyBudget = monthlyBudgetFor(budgets, rep, metric);
  const ytd = withMetrics(repPerformance(rep, "annual", inputs));
  const label = metricLabel[metric];

  return (
    <div>
      <PageHeader
        title="My Budget"
        description={`Your FY${FISCAL_YEAR} budget, set by Management. Read-only — contact your manager to request a change.`}
        actions={<MetricSwitch value={metric} onChange={setMetric} />}
      />

      {!values ? (
        <Card className="p-10 text-center text-sm text-slate-500">
          Management hasn't set your FY{FISCAL_YEAR} {label} budget yet. It will appear here as soon as it's created.
        </Card>
      ) : (
        <>
          <PerformanceStatCards metrics={ytd} period="annual" metric={metric} />

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="overflow-hidden lg:col-span-2">
              <div className="flex items-center justify-between px-5 pt-5">
                <h3 className="text-sm font-semibold text-slate-700">Month by month — Budget vs Actual vs Last Year ({label})</h3>
                <span className="text-xs text-slate-400">FY{FISCAL_YEAR}</span>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-2.5 font-medium">Month</th>
                      <th className="px-5 py-2.5 text-right font-medium">Business Days</th>
                      <th className="px-5 py-2.5 text-right font-medium">Budget</th>
                      <th className="px-5 py-2.5 text-right font-medium">Actual</th>
                      <th className="px-5 py-2.5 text-right font-medium">vs Budget</th>
                      <th className="px-5 py-2.5 text-right font-medium">Last Year</th>
                      <th className="px-5 py-2.5 text-right font-medium">vs LY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {MONTHS.map((m, i) => {
                      const actual = actuals?.monthlyActual[i] ?? null;
                      const ly = actuals?.monthlyLy[i] ?? 0;
                      const isCurrent = i === CURRENT_MONTH;
                      // Only completed months get a variance; the current month is compared with pace on the Sales Dashboard.
                      const done = actual !== null && !isCurrent ? actual : null;
                      return (
                        <tr key={m} className={isCurrent ? "bg-brand-50/50" : ""}>
                          <td className="px-5 py-2.5 font-medium text-slate-700">
                            {m} {isCurrent && <Badge tone="sky">MTD</Badge>}
                          </td>
                          <td className="px-5 py-2.5 text-right text-slate-500">{inputs.calendar.monthly[i]}</td>
                          <td className="px-5 py-2.5 text-right text-slate-600">{currency(monthlyBudget[i])}</td>
                          <td className="px-5 py-2.5 text-right font-medium text-slate-800">{actual === null ? "—" : currency(actual)}</td>
                          <td
                            className={`px-5 py-2.5 text-right font-medium ${
                              done === null ? "text-slate-300" : done >= monthlyBudget[i] ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {done === null ? "—" : signedCurrency(done - monthlyBudget[i])}
                          </td>
                          <td className="px-5 py-2.5 text-right text-slate-600">{currency(ly)}</td>
                          <td
                            className={`px-5 py-2.5 text-right font-medium ${
                              done === null ? "text-slate-300" : done >= ly ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {done !== null && ly > 0 ? formatPct(((done - ly) / ly) * 100, true) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 text-sm font-semibold text-slate-800">
                    <tr>
                      <td className="px-5 py-2.5">FY Total</td>
                      <td className="px-5 py-2.5 text-right">{total(inputs.calendar.monthly)}</td>
                      <td className="px-5 py-2.5 text-right">{currency(total(monthlyBudget))}</td>
                      <td className="px-5 py-2.5 text-right">{currency(ytd.actual)}</td>
                      <td colSpan={3} className="px-5 py-2.5 text-right text-xs font-normal text-slate-400">
                        Current month compares on the Sales Dashboard with days ahead / behind
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-slate-700">Budget details</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">FY{FISCAL_YEAR} annual {label} budget</dt>
                    <dd className="font-semibold text-slate-800">{currency(total(values))}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Remaining this year</dt>
                    <dd className="font-semibold text-slate-800">{currency(Math.max(0, total(values) - ytd.actual))}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Last updated</dt>
                    <dd className="text-right text-slate-700">
                      {budget!.updatedBy}
                      <div className="text-xs text-slate-400">{budget!.updatedAt}</div>
                    </dd>
                  </div>
                </dl>
                {budget?.notes && (
                  <p className="mt-3 flex gap-2 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                    <StickyNote size={14} className="mt-0.5 shrink-0 text-slate-400" /> {budget.notes}
                  </p>
                )}
              </Card>
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-slate-700">FY{FISCAL_YEAR + 1}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {nextYear ? `${label} budget set: ${currency(total(nextYear))}.` : "Not set yet — Management will publish next year's budget here."}
                </p>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
