import { useState } from "react";
import { Bell, Search, ChevronDown, Check } from "lucide-react";
import { useRole, roleProfiles } from "../context/RoleContext";

export default function Topbar({ title }: { title: string }) {
  const { profile, setRole } = useRole();
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search..."
            className="w-64 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
        </button>

        <div className="relative">
          <button
            data-testid="role-switcher-trigger"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 py-1.5 pl-2.5 pr-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
              Viewing as
            </span>
            {profile.label}
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">
                <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Demo role switcher
                </p>
                {roleProfiles.map((p) => (
                  <button
                    key={p.role}
                    data-testid={`role-option-${p.role}`}
                    onClick={() => {
                      setRole(p.role);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <span>
                      <span className="block font-medium">{p.label}</span>
                      <span className="block text-xs text-slate-400">{p.name}</span>
                    </span>
                    {p.role === profile.role && <Check size={15} className="text-brand-600" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
