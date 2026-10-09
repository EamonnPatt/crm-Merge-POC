import { useId } from "react";

/** The Add-Impact mark: a plus (add) with an amber ripple in its upper-right corner (impact). Same artwork as public/favicon.svg. */
export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  const gradient = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" role="img" aria-label="Add-Impact" className={className}>
      <defs>
        <linearGradient id={gradient} x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop style={{ stopColor: "var(--logo-from)" }} />
          <stop offset="1" style={{ stopColor: "var(--logo-to)" }} />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill={`url(#${gradient})`} />
      <rect x="7" y="17" width="26" height="6" rx="3" fill="#fff" />
      <rect x="17" y="7" width="6" height="26" rx="3" fill="#fff" />
      <circle cx="29" cy="11" r="5.6" stroke="#fbbf24" strokeOpacity=".55" strokeWidth="1.4" />
      <circle cx="29" cy="11" r="2.6" fill="#fbbf24" />
    </svg>
  );
}

/** Mark plus the "Add-Impact" wordmark. Use `dark` on a dark background (the sidebar). */
export function Logo({ size = 32, dark = false, subtitle }: { size?: number; dark?: boolean; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <div className="leading-tight">
        <p className={`text-base font-bold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>
          Add<span className={dark ? "text-brand-300" : "text-brand-600"}>-Impact</span>
        </p>
        {subtitle && <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{subtitle}</p>}
      </div>
    </div>
  );
}
