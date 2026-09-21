import { Eye } from "lucide-react";
import { Badge, Button, Modal, Switch } from "./ui";
import { useDemoData } from "../context/DemoDataContext";
import { useRole } from "../context/RoleContext";

export function ShareDashboardModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile } = useRole();
  const { team, shares, setDashboardShare } = useDemoData();
  const myAssistants = team.filter((m) => m.role === "assistant" && m.supports?.includes(profile.name));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Share your Sales Dashboard"
      description="Give your assistants a read-only view of your sales performance."
      footer={<Button onClick={onClose}>Done</Button>}
    >
      <div className="mb-4 flex gap-2.5 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
        <Eye size={15} className="mt-0.5 shrink-0 text-slate-400" />
        <p>
          Assistants will see your GP$ actuals, budget, last-year comparison, days ahead / behind, and your orders. They
          can't edit anything, and they never see other Account Managers or company-wide figures. You can stop sharing at
          any time.
        </p>
      </div>

      {myAssistants.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          No assistants are assigned to you yet. Management can create an Assistant account in Settings → Team Access.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {myAssistants.map((assistant) => {
            const share = shares.find((s) => s.owner === profile.name && s.assistant === assistant.name);
            return (
              <li key={assistant.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    {assistant.name}
                    {assistant.status === "invited" && <Badge tone="amber">Invited</Badge>}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {assistant.email}
                    {share ? ` · Shared since ${share.sharedAt}` : " · Not shared"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${share ? "text-brand-600" : "text-slate-400"}`}>
                    {share ? "Can view" : "No access"}
                  </span>
                  <Switch
                    checked={Boolean(share)}
                    label={`Share with ${assistant.name}`}
                    onChange={(checked) => setDashboardShare(profile.name, assistant.name, checked, profile)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
