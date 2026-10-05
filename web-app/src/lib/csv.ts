export function downloadCsv<T extends object>(filename: string, rows: T[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]) as (keyof T)[];
  const escape = (value: unknown) => {
    const s = String(value ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h])).join(","))];
  downloadBlob(filename, new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" }));
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ParsedCsv {
  headers: string[];
  rowCount: number;
}

export function parseCsvFile(file: File): Promise<ParsedCsv> {
  return readSpreadsheet(file).then(({ headers, rows }) => ({ headers, rowCount: rows.length }));
}

/** A spreadsheet's first sheet as a header row plus data rows, every cell as trimmed text. */
export interface SheetTable {
  headers: string[];
  rows: string[][];
}

/** RFC 4180-ish CSV: quoted fields, doubled quotes, and newlines inside quotes. */
export function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function cellText(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

function toTable(raw: unknown[][]): SheetTable {
  const nonEmpty = raw.map((r) => r.map(cellText)).filter((r) => r.some((c) => c !== ""));
  const [headers = [], ...rows] = nonEmpty;
  return { headers, rows: rows.map((r) => headers.map((_, i) => r[i] ?? "")) };
}

/** Reads a .csv or .xlsx file. The Excel reader is loaded only when an .xlsx is chosen. */
export async function readSpreadsheet(file: File): Promise<SheetTable> {
  if (/\.xlsx$/i.test(file.name)) {
    const { readSheet } = await import("read-excel-file/browser");
    return toTable(await readSheet(file));
  }
  if (/\.xls$/i.test(file.name)) {
    throw new Error("Old .xls files aren't supported. Save the sheet as .xlsx or .csv and try again.");
  }
  return toTable(parseCsvText(await file.text()));
}

/** Writes rows to a real .xlsx file. The Excel writer is loaded only when someone exports. */
export async function downloadXlsx(filename: string, columns: string[], rows: (string | number)[][]) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const header = columns.map((c) => ({ value: c, fontWeight: "bold" as const }));
  const body = rows.map((r) => r.map((value) => ({ value, type: typeof value === "number" ? Number : String })));
  await writeXlsxFile([header, ...body], {
    sheet: "Report",
    stickyRowsCount: 1,
    columns: columns.map((c) => ({ width: Math.max(12, c.length + 4) })),
  }).toFile(filename);
}
