import { useRef, useState, type ReactNode } from "react";
import { AlertCircle, FileSpreadsheet, Upload } from "lucide-react";
import { Badge, Button, Modal, inputClass } from "./ui";
import { readSpreadsheet, type SheetTable } from "../lib/csv";

export interface ImportField {
  key: string;
  label: string;
  required?: boolean;
  /** Other column headings that should map to this field automatically. */
  aliases?: string[];
}

export type RowResult<T> = { record: T; error?: undefined } | { record?: undefined; error: string };

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function autoMap(headers: string[], fields: ImportField[]): Record<string, number> {
  const mapping: Record<string, number> = {};
  for (const field of fields) {
    const names = [field.key, field.label, ...(field.aliases ?? [])].map(normalize);
    const index = headers.findIndex((h) => names.includes(normalize(h)));
    if (index >= 0) mapping[field.key] = index;
  }
  return mapping;
}

/**
 * Upload a CSV or XLSX, match its columns to the app's fields, preview every row (with problems flagged), then import.
 * Nothing is saved until the user confirms.
 */
export function SpreadsheetImportModal<T>({
  title,
  description,
  fields,
  toRecord,
  previewColumns,
  onImport,
  onClose,
  footnote,
}: {
  title: string;
  description: string;
  fields: ImportField[];
  toRecord: (values: Record<string, string>) => RowResult<T>;
  previewColumns: { label: string; render: (record: T) => ReactNode }[];
  /** Saves the records and returns a confirmation message. */
  onImport: (records: T[], fileName: string) => string;
  onClose: () => void;
  footnote?: ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [table, setTable] = useState<SheetTable | null>(null);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      const parsed = await readSpreadsheet(file);
      if (parsed.headers.length === 0) throw new Error("The file looks empty — the first row should hold column headings.");
      setFileName(file.name);
      setTable(parsed);
      setMapping(autoMap(parsed.headers, fields));
    } catch (err) {
      setTable(null);
      setError(err instanceof Error ? err.message : "Couldn't read that file.");
    }
  }

  const results = table
    ? table.rows.map((row) => toRecord(Object.fromEntries(fields.map((f) => [f.key, mapping[f.key] === undefined ? "" : row[mapping[f.key]] ?? ""]))))
    : [];
  const valid = results.flatMap((r) => (r.record ? [r.record] : []));
  const invalid = results.length - valid.length;
  const missingRequired = fields.filter((f) => f.required && mapping[f.key] === undefined);

  const submit = () => {
    if (missingRequired.length) return setError(`Map a column to: ${missingRequired.map((f) => f.label).join(", ")}.`);
    if (valid.length === 0) return setError("No rows are ready to import. Fix the flagged rows or the column mapping.");
    setDone(onImport(valid, fileName));
  };

  return (
    <Modal
      open
      size="xl"
      onClose={onClose}
      title={title}
      description={description}
      footer={
        done ? (
          <Button onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!table} className={!table ? "cursor-not-allowed opacity-50" : ""}>
              Import {valid.length > 0 ? `${valid.length} row${valid.length === 1 ? "" : "s"}` : ""}
            </Button>
          </>
        )
      }
    >
      {done ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{done}</p>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => inputRef.current?.click()}>
              <Upload size={15} /> {table ? "Choose a different file" : "Choose CSV or XLSX file"}
            </Button>
            <input ref={inputRef} type="file" accept=".csv,.xlsx" className="hidden" data-testid="import-file-input" onChange={handleFile} />
            {table && (
              <span className="flex items-center gap-1.5 text-sm text-slate-600">
                <FileSpreadsheet size={15} className="text-slate-400" /> {fileName} · {table.rows.length} row{table.rows.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {table && (
            <>
              <div>
                <p className="mb-2 text-xs font-medium text-slate-600">1. Match the spreadsheet's columns</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {fields.map((f) => (
                    <label key={f.key} className="block">
                      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        {f.label}
                        {f.required && " *"}
                      </span>
                      <select
                        aria-label={`Column for ${f.label}`}
                        className={`${inputClass} py-1.5`}
                        value={mapping[f.key] ?? ""}
                        onChange={(e) =>
                          setMapping((m) => {
                            const next = { ...m };
                            if (e.target.value === "") delete next[f.key];
                            else next[f.key] = Number(e.target.value);
                            return next;
                          })
                        }
                      >
                        <option value="">— not in this file —</option>
                        {table.headers.map((h, i) => (
                          <option key={`${h}-${i}`} value={i}>
                            {h || `Column ${i + 1}`}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <p className="text-xs font-medium text-slate-600">2. Preview</p>
                  <Badge tone="emerald">{valid.length} ready</Badge>
                  {invalid > 0 && <Badge tone="rose">{invalid} need attention (skipped)</Badge>}
                </div>
                <div className="max-h-72 overflow-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-50 uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2 font-medium">Row</th>
                        {previewColumns.map((c) => (
                          <th key={c.label} className="px-3 py-2 font-medium">
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {results.map((r, i) => (
                        <tr key={i} className={r.error ? "bg-rose-50/60" : ""}>
                          <td className="px-3 py-2 text-slate-400">{i + 2}</td>
                          {r.record ? (
                            previewColumns.map((c) => (
                              <td key={c.label} className="px-3 py-2 text-slate-700">
                                {c.render(r.record as T)}
                              </td>
                            ))
                          ) : (
                            <td colSpan={previewColumns.length} className="px-3 py-2 text-rose-700">
                              <span className="flex items-center gap-1.5">
                                <AlertCircle size={13} /> {r.error}
                              </span>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {footnote && <div className="text-xs leading-relaxed text-slate-400">{footnote}</div>}
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        </div>
      )}
    </Modal>
  );
}
