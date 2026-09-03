import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  DollarSign,
  Users,
  Target,
  Handshake,
  TrendingUp,
  AlertTriangle,
  FileBarChart,
  Settings as SettingsIcon,
  Building2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    title: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Sales Reporting",
    items: [{ to: "/sales", label: "Sales Reports", icon: DollarSign }],
  },
  {
    title: "CPR",
    items: [
      { to: "/customers", label: "Customers", icon: Users },
      { to: "/prospects", label: "Prospects", icon: Target },
      { to: "/referral-partners", label: "Referral Partners", icon: Handshake },
      { to: "/pipeline", label: "Sales Pipeline", icon: TrendingUp },
    ],
  },
  {
    title: "Order Excellence",
    items: [{ to: "/order-excellence", label: "Order Issues", icon: AlertTriangle }],
  },
  {
    title: "General",
    items: [
      { to: "/reports", label: "Reports", icon: FileBarChart },
      { to: "/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-slate-900 text-slate-300">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Building2 size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">Company Internal</p>
          <p className="text-xs text-slate-400 leading-tight">Sales Operations</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {sections.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-brand-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  <Icon size={17} />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800 px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
            EP
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">Eamonn Patterson</p>
            <p className="truncate text-xs text-slate-400">Administrator</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
