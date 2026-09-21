import { useState } from "react";
import { Download, Pencil, Plus, Info } from "lucide-react";
import { Badge, Button, Card, Field, Modal, PageHeader, SegmentedControl, StatCard, currency, inputClass } from "../components/ui";
import { RestrictedNotice } from "../components/RestrictedNotice";
import { PerformanceStatCards, signedCurrency } from "../components/performance";
import { downloadCsv } from "../lib/csv";
import { CURRENT_MONTH, FISCAL_YEAR, MONTHS } from "../lib/calendar";
import { combinedPerformance, formatPct, monthlyBudgetFor, repPerformance, withMetrics } from "../lib/performance";
import { useRole } from "../context/RoleContext";
import { useDemoData } from "../context/DemoDataContext";
import { repActuals } from "../data/mockData";

const FISCAL_YEARS = [FISCAL_YEAR, FISCAL_YEAR + 1];

const total = (values: number[]) => values.reduce((a, v) => a + v, 0);
const toNumber = (value: string) => Math.max(0, Math.round(Number(value) || 0));

export default function Budgets() {
  const { canViewBudgets, canEditBudgets } = useRole();
  if (!canViewBudgets) {
    return (
      <div>
        <PageHeader title="Budgets" description="GP$ budgets by Account Manager." />
        <RestrictedNotice requiredRoles="Account Managers, Management, and Super User" />
      </div>
    );
  }
  return canEditBudgets ? <ManageBudgets /> : <MyBudget />;
}

/** Management / Super User: create and edit every Account Manager's budget. */
function ManageBudgets() {
  const { profile } = useRole();
  const { budgets, team, saveBudget } = useDemoData();
  const [fiscalYear, setFiscalYear] = useState(FISCAL_YEAR);
  const [editingRep, setEditingRep] = useState<string | null>(null);
  const [draft, setDraft] = useState<string[]>([]);
  const [createFor, setCreateFor] = useState<{ rep: string } | null>(null);

  const accountManagers = team.filter((m) => m.role === "account_manager").map((m) => m.name);
  const rows = accountManagers.map((rep) => ({
    rep,
    budget: budgets.find((b) => b.rep === rep && b.fiscalYear === fiscalYear),
  }));
  const withBudget = rows.filter((r) => r.budget);
  const fyTotal = total(withBudget.map((r) => total(r.budget!.monthly)));
  const ytd = withMetrics(combinedPerformance(accountManagers, "annual", budgets));

  const startEdit = (rep: string, monthly: number[]) => {
    setEditingRep(rep);
    setDraft(monthly.map(String));
  };
  const saveEdit = () => {
    if (!editingRep) return;
    saveBudget({ rep: editingRep, fiscalYear, monthly: draft.map(toNumber) }, profile);
    setEditingRep(null);
  };

  return (
    <div>
      <PageHeader
        title="Budgets"
        description="Create and maintain monthly GP$ budgets for each Account Manager. Account Managers see their own budget; Sales Dashboards compare against it."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                downloadCsv(
                  `budgets-fy${fiscalYear}.csv`,
                  withBudget.map(({ rep, budget }) => ({
                    account_manager: rep,
                    fiscal_year: fiscalYear,
                    ...Object.fromEntries(MONTHS.map((m, i) => [m.toLowerCase(), budget!.monthly[i]])),
                    annual_total: total(budget!.monthly),
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
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={`FY${fiscalYear} total GP$ budget`} value={currency(fyTotal)} icon={<Info size={18} />} />
        <StatCard
          label="Account Managers with a budget"
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
              {rows.map(({ rep, budget }) => {
                const editing = editingRep === rep;
                return (
                  <tr key={rep} className={editing ? "bg-brand-50/40" : "hover:bg-slate-50"}>
                    <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-3 font-medium text-slate-800">
                      {rep}
                      {editing ? (
                        // Save/Cancel live in the sticky column so they stay visible while the wide row scrolls.
                        <div className="mt-1.5 flex gap-1.5">
                          <Button className="px-2.5 py-1" onClick={saveEdit}>
                            Save
                          </Button>
                          <Button variant="ghost" className="px-2.5 py-1" onClick={() => setEditingRep(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="text-[11px] font-normal text-slate-400">
                          {budget ? `Updated ${budget.updatedAt.slice(0, 10)} · ${budget.updatedBy}` : <Badge tone="amber">No budget set</Badge>}
                        </div>
                      )}
                    </td>
                    {MONTHS.map((m, i) => (
                      <td key={m} className="whitespace-nowrap px-1.5 py-3 text-right text-slate-600">
                        {editing ? (
                          <input
                            type="text"
                            inputMode="numeric"
                            aria-label={`${rep} ${m} budget`}
                            value={draft[i]}
                            onChange={(e) => setDraft((d) => d.map((v, j) => (j === i ? e.target.value.replace(/[^\d]/g, "") : v)))}
                            className="w-[4.25rem] rounded-md border border-slate-300 bg-white px-1.5 py-1 text-right text-sm text-slate-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                          />
                        ) : budget ? (
                          currency(budget.monthly[i])
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-slate-800">
                      {editing ? currency(total(draft.map(toNumber))) : budget ? currency(total(budget.monthly)) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      {editing ? null : budget ? (
                        <Button variant="secondary" onClick={() => startEdit(rep, budget.monthly)}>
                          <Pencil size={14} /> Edit
                        </Button>
                      ) : (
                        <Button onClick={() => setCreateFor({ rep })}>
                          <Plus size={14} /> Create
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
        <Info size={13} /> Changes apply immediately to every Sales Dashboard's Budget and Days Ahead / Behind comparisons, and are
        recorded in the Audit Trail.
      </p>

      {createFor && (
        <CreateBudgetModal
          initialRep={createFor.rep}
          initialYear={fiscalYear}
          onClose={() => setCreateFor(null)}
          onCreated={(fy) => {
            setFiscalYear(fy);
            setCreateFor(null);
          }}
        />
      )}
    </div>
  );
}

type Distribution = "seasonal" | "even";

function distribute(annual: number, mode: Distribution, rep: string): number[] {
  const repLy = repActuals.find((r) => r.rep === rep)?.monthlyLy;
  const companyLy = MONTHS.map((_, m) => total(repActuals.map((r) => r.monthlyLy[m])));
  const weights = mode === "even" ? MONTHS.map(() => 1) : repLy ?? companyLy;
  const weightTotal = total(weights);
  const monthly = weights.map((w) => Math.round(((annual * w) / weightTotal) / 100) * 100);
  monthly[11] += annual - total(monthly); // keep the months summing exactly to the annual target
  return monthly;
}

function CreateBudgetModal({
  initialRep,
  initialYear,
  onClose,
  onCreated,
}: {
  initialRep: string;
  initialYear: number;
  onClose: () => void;
  onCreated: (fiscalYear: number) => void;
}) {
  const { profile } = useRole();
  const { budgets, team, saveBudget } = useDemoData();
  const [fiscalYear, setFiscalYear] = useState(initialYear);
  const [rep, setRep] = useState(initialRep);
  const [annual, setAnnual] = useState("");
  const [mode, setMode] = useState<Distribution>("seasonal");
  const [monthly, setMonthly] = useState<string[]>(MONTHS.map(() => ""));
  const [error, setError] = useState<string | null>(null);

  const available = team
    .filter((m) => m.role === "account_manager")
    .map((m) => m.name)
    .filter((name) => !budgets.some((b) => b.rep === name && b.fiscalYear === fiscalYear));

  const redistribute = (nextAnnual: string, nextMode: Distribution, nextRep: string) => {
    const value = toNumber(nextAnnual);
    setMonthly(value > 0 ? distribute(value, nextMode, nextRep).map(String) : MONTHS.map(() => ""));
  };

  const monthlyTotal = total(monthly.map(toNumber));
  const annualValue = toNumber(annual);

  const submit = () => {
    if (!rep || !available.includes(rep)) return setError("Choose an Account Manager who doesn't have a budget for this year yet.");
    if (monthlyTotal <= 0) return setError("Enter an annual GP$ target or monthly amounts.");
    saveBudget({ rep, fiscalYear, monthly: monthly.map(toNumber) }, profile);
    onCreated(fiscalYear);
  };

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title="New Budget"
      description="Set an Account Manager's monthly GP$ budget for a fiscal year."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Create Budget</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <Field label="Account Manager" hint={available.length === 0 ? "Every Account Manager already has a budget for this year." : undefined}>
          <select
            className={inputClass}
            value={available.includes(rep) ? rep : ""}
            onChange={(e) => {
              setRep(e.target.value);
              redistribute(annual, mode, e.target.value);
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
        <Field label="Annual GP$ target">
          <input
            type="number"
            min={0}
            step={1000}
            placeholder="e.g. 180000"
            className={inputClass}
            value={annual}
            onChange={(e) => {
              setAnnual(e.target.value);
              redistribute(e.target.value, mode, rep);
            }}
          />
        </Field>
        <Field label="Spread across months">
          <SegmentedControl
            options={[
              { key: "seasonal", label: "Seasonal (LY mix)" },
              { key: "even", label: "Even split" },
            ]}
            value={mode}
            onChange={(m) => {
              setMode(m);
              redistribute(annual, m, rep);
            }}
          />
        </Field>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-slate-600">Monthly GP$ budget (editable)</p>
          <p className={`text-xs ${annualValue > 0 && monthlyTotal !== annualValue ? "text-amber-600" : "text-slate-400"}`}>
            Total {currency(monthlyTotal)}
            {annualValue > 0 && monthlyTotal !== annualValue && ` · differs from target by ${signedCurrency(monthlyTotal - annualValue)}`}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {MONTHS.map((m, i) => (
            <label key={m} className="block">
              <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{m}</span>
              <input
                type="number"
                min={0}
                step={100}
                className={`${inputClass} px-2 py-1.5`}
                value={monthly[i]}
                onChange={(e) => setMonthly((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))}
              />
            </label>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    </Modal>
  );
}

/** Account Manager: read-only view of their own budget against actuals and last year. */
function MyBudget() {
  const { profile } = useRole();
  const { budgets } = useDemoData();
  const rep = profile.name;
  const budget = budgets.find((b) => b.rep === rep && b.fiscalYear === FISCAL_YEAR);
  const nextYear = budgets.find((b) => b.rep === rep && b.fiscalYear === FISCAL_YEAR + 1);
  const actuals = repActuals.find((r) => r.rep === rep);
  const monthlyBudget = monthlyBudgetFor(budgets, rep);
  const ytd = withMetrics(repPerformance(rep, "annual", budgets));

  return (
    <div>
      <PageHeader
        title="My Budget"
        description={`Your FY${FISCAL_YEAR} GP$ budget, set by Management. Read-only — contact your manager to request a change.`}
      />

      {!budget ? (
        <Card className="p-10 text-center text-sm text-slate-500">
          Management hasn't set your FY{FISCAL_YEAR} budget yet. It will appear here as soon as it's created.
        </Card>
      ) : (
        <>
          <PerformanceStatCards metrics={ytd} period="annual" />

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="overflow-hidden lg:col-span-2">
              <div className="flex items-center justify-between px-5 pt-5">
                <h3 className="text-sm font-semibold text-slate-700">Month by month — Budget vs Actual vs Last Year</h3>
                <span className="text-xs text-slate-400">FY{FISCAL_YEAR}</span>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-2.5 font-medium">Month</th>
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
                    <dt className="text-slate-500">FY{FISCAL_YEAR} annual budget</dt>
                    <dd className="font-semibold text-slate-800">{currency(total(budget.monthly))}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Remaining this year</dt>
                    <dd className="font-semibold text-slate-800">{currency(Math.max(0, total(budget.monthly) - ytd.actual))}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Last updated</dt>
                    <dd className="text-right text-slate-700">
                      {budget.updatedBy}
                      <div className="text-xs text-slate-400">{budget.updatedAt}</div>
                    </dd>
                  </div>
                </dl>
              </Card>
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-slate-700">FY{FISCAL_YEAR + 1}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {nextYear
                    ? `Budget set: ${currency(total(nextYear.monthly))} (by ${nextYear.updatedBy}, ${nextYear.updatedAt}).`
                    : "Not set yet — Management will publish next year's budget here."}
                </p>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
