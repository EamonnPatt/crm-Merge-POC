import { ShieldAlert } from "lucide-react";
import { Card } from "./ui";

export function RestrictedNotice({ requiredRoles }: { requiredRoles: string }) {
  return (
    <Card className="flex flex-col items-center gap-3 p-10 text-center">
      <ShieldAlert className="text-amber-500" size={28} />
      <div>
        <p className="text-sm font-semibold text-slate-800">Restricted to {requiredRoles}</p>
        <p className="mt-1 text-sm text-slate-500">
          Your current demo role doesn't have access to this page. Switch roles from the top bar to preview it.
        </p>
      </div>
    </Card>
  );
}
