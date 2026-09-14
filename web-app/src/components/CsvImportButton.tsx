import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "./ui";
import { parseCsvFile } from "../lib/csv";

export function CsvImportButton({ label = "Import CSV" }: { label?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [summary, setSummary] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const { headers, rowCount } = await parseCsvFile(file);
    setSummary(`Detected ${rowCount} row${rowCount === 1 ? "" : "s"}, ${headers.length} columns (${headers.slice(0, 4).join(", ")}${headers.length > 4 ? ", …" : ""}). Demo only — not persisted.`);
    e.target.value = "";
  }

  return (
    <div className="relative inline-flex items-center">
      <Button variant="secondary" onClick={() => inputRef.current?.click()}>
        <Upload size={15} /> {label}
      </Button>
      <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      {summary && (
        <div className="absolute left-0 top-full z-10 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-lg">
          {summary}
          <button className="mt-2 block text-brand-600 hover:underline" onClick={() => setSummary(null)}>
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
