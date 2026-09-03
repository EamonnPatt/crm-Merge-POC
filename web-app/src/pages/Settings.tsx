import { Plug, Users, Bell, Shield } from "lucide-react";
import { Card, PageHeader, Badge, Button } from "../components/ui";
import { dataSources } from "../data/mockData";

const team = [
  { name: "Eamonn Patterson", email: "eamonnpatterson1@gmail.com", role: "Administrator" },
  { name: "M. Alvarez", email: "m.alvarez@company.com", role: "Sales Rep" },
  { name: "D. Chen", email: "d.chen@company.com", role: "Sales Rep" },
  { name: "K. Sanders", email: "k.sanders@company.com", role: "Order Support" },
];

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  return (
    <button
      className={`relative h-5 w-9 rounded-full transition-colors ${defaultOn ? "bg-brand-600" : "bg-slate-300"}`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
          defaultOn ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function Settings() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Integrations, team access, and notification preferences." />

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Plug size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">Data Source Integrations</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {dataSources.map((src) => (
            <div key={src.name} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-800">{src.name}</p>
                <Badge tone={src.status === "connected" ? "emerald" : "amber"}>
                  {src.status === "connected" ? "Connected" : "Needs attention"}
                </Badge>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">Method: {src.method}</p>
              <p className="mt-0.5 text-xs text-slate-400">Last sync: {src.lastSync}</p>
              <Button variant="secondary" className="mt-3 w-full justify-center">
                Configure
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Users size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">Team Access</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {team.map((member) => (
                <tr key={member.email}>
                  <td className="py-2.5 pr-4 font-medium text-slate-800">{member.name}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{member.email}</td>
                  <td className="py-2.5 pr-4">
                    <Badge tone={member.role === "Administrator" ? "violet" : "slate"}>{member.role}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Bell size={16} className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "New order issue logged", on: true },
              { label: "Deal moves to Negotiation", on: true },
              { label: "Daily sales summary email", on: false },
              { label: "Sync failure alerts", on: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{item.label}</span>
                <Toggle defaultOn={item.on} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Shield size={16} className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-800">Access & Security</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "Require SSO login", on: true },
              { label: "Restrict access to office network", on: false },
              { label: "Two-factor authentication", on: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{item.label}</span>
                <Toggle defaultOn={item.on} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
