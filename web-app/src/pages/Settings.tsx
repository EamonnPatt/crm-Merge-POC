import { useState } from "react";
import { Plug, Users, Bell, Shield, KeyRound, Check, Minus, UserPlus } from "lucide-react";
import { Card, PageHeader, Badge, Button, Field, Modal, inputClass } from "../components/ui";
import { useRole } from "../context/RoleContext";
import { useDemoData } from "../context/DemoDataContext";
import { dataSources, accessLevelMatrix } from "../data/mockData";
import { roleLabel, roleOrder, roleTone, type Role } from "../lib/roles";

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
  const { profile, canManageUsers, canConfigureSystem } = useRole();
  const { team, shares } = useDemoData();
  const [addOpen, setAddOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const sortedTeam = [...team].sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role));

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Integrations, team access, and notification preferences." />

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">System Access Levels</h3>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          Five-tier role structure. Super User configures this matrix; everyone else sees it read-only. Your role:{" "}
          <span className="font-medium text-slate-700">{profile.label}</span>.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">Capability</th>
                {roleOrder.map((role) => (
                  <th
                    key={role}
                    className={`px-3 py-2 text-center font-medium ${role === profile.role ? "rounded-t-md bg-brand-50 text-brand-700" : ""}`}
                  >
                    {roleLabel[role]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accessLevelMatrix.map((row) => (
                <tr key={row.capability}>
                  <td className="py-2.5 pr-4 text-slate-700">{row.capability}</td>
                  {roleOrder.map((role) => (
                    <td key={role} className={`px-3 py-2.5 text-center ${role === profile.role ? "bg-brand-50" : ""}`}>
                      {row[role] ? (
                        <Check size={15} className="mx-auto text-emerald-600" />
                      ) : (
                        <Minus size={15} className="mx-auto text-slate-300" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

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
              {canConfigureSystem && (
                <Button variant="secondary" className="mt-3 w-full justify-center">
                  Configure
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-800">Team Access</h3>
          </div>
          {canManageUsers && (
            <Button onClick={() => setAddOpen(true)}>
              <UserPlus size={15} /> Add User
            </Button>
          )}
        </div>
        {notice && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <span>{notice}</span>
            <button className="text-xs font-medium hover:underline" onClick={() => setNotice(null)}>
              Dismiss
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 pr-4 font-medium">Details</th>
                <th className="py-2 pr-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedTeam.map((member) => {
                const sharedBy = shares.filter((s) => s.assistant === member.name).map((s) => s.owner);
                const sharedWith = shares.filter((s) => s.owner === member.name).map((s) => s.assistant);
                return (
                  <tr key={member.id}>
                    <td className="py-2.5 pr-4 font-medium text-slate-800">{member.name}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{member.email}</td>
                    <td className="py-2.5 pr-4">
                      <Badge tone={roleTone[member.role]}>{roleLabel[member.role]}</Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-slate-500">
                      {member.role === "assistant" && (
                        <>
                          Assists {member.supports?.join(", ") || "—"}
                          <div className="text-slate-400">
                            {sharedBy.length ? `Dashboards shared: ${sharedBy.join(", ")}` : "No dashboards shared yet"}
                          </div>
                        </>
                      )}
                      {member.role === "account_manager" && sharedWith.length > 0 && `Dashboard shared with ${sharedWith.join(", ")}`}
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge tone={member.status === "active" ? "emerald" : "amber"}>{member.status === "active" ? "Active" : "Invited"}</Badge>
                    </td>
                  </tr>
                );
              })}
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

      {addOpen && (
        <AddUserModal
          onClose={() => setAddOpen(false)}
          onCreated={(message) => {
            setAddOpen(false);
            setNotice(message);
          }}
        />
      )}
    </div>
  );
}

function AddUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: (message: string) => void }) {
  const { profile } = useRole();
  const { team, addTeamMember } = useDemoData();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("assistant");
  const [supports, setSupports] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Only a Super User can create another Super User.
  const assignableRoles = roleOrder.filter((r) => r !== "super_user" || profile.role === "super_user");
  const accountManagers = team.filter((m) => m.role === "account_manager").map((m) => m.name);

  const submit = () => {
    if (!name.trim()) return setError("Enter the person's name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    if (team.some((m) => m.email.toLowerCase() === email.trim().toLowerCase())) return setError("A user with this email already exists.");
    if (role === "assistant" && supports.length === 0) return setError("Choose at least one Account Manager this assistant supports.");
    const member = addTeamMember(
      {
        name: name.trim(),
        email: email.trim(),
        role,
        supports: role === "assistant" ? supports : undefined,
        status: "invited",
      },
      profile
    );
    onCreated(
      role === "assistant"
        ? `${member.name} invited as an Assistant to ${supports.join(", ")}. They'll see a Sales Dashboard once that Account Manager shares it.`
        : `${member.name} invited as ${roleLabel[role]}.`
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Add User"
      description="Create a login for a team member. They'll receive an email invite (once email delivery is connected)."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Create User</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. A. Rivera" />
          </Field>
          <Field label="Work email">
            <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@add-impact.com" />
          </Field>
        </div>
        <Field label="Role">
          <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {assignableRoles.map((r) => (
              <option key={r} value={r}>
                {roleLabel[r]}
              </option>
            ))}
          </select>
        </Field>
        {role === "assistant" && (
          <div>
            <p className="mb-1 text-xs font-medium text-slate-600">Supports Account Manager(s)</p>
            <div className="grid grid-cols-2 gap-2">
              {accountManagers.map((am) => (
                <label key={am} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={supports.includes(am)}
                    onChange={(e) => setSupports((s) => (e.target.checked ? [...s, am] : s.filter((x) => x !== am)))}
                  />
                  {am}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Assistants have no access to sales figures by default. Each Account Manager decides whether to share their Sales
              Dashboard with them.
            </p>
          </div>
        )}
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      </div>
    </Modal>
  );
}
