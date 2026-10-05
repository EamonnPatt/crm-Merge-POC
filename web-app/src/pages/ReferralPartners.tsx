import { useState } from "react";
import { Plus, Handshake, TrendingUp, DollarSign } from "lucide-react";
import { Card, PageHeader, Badge, Button, Field, Modal, StatCard, currency, inputClass } from "../components/ui";
import { RestrictedNotice } from "../components/RestrictedNotice";
import { useRole } from "../context/RoleContext";
import { useDemoData } from "../context/DemoDataContext";

export default function ReferralPartners() {
  const { canViewCpr, canViewCompanyMetrics } = useRole();
  const { partners } = useDemoData();
  const [addOpen, setAddOpen] = useState(false);

  if (!canViewCpr) {
    return (
      <div>
        <PageHeader title="Referral Partners" description="Third parties referring business into the sales pipeline." />
        <RestrictedNotice requiredRoles="Account Managers, Management, and Super User" />
      </div>
    );
  }

  const totalReferrals = partners.reduce((sum, p) => sum + p.referralsSent, 0);
  const totalConversions = partners.reduce((sum, p) => sum + p.conversions, 0);
  const totalOwed = partners.reduce((sum, p) => sum + p.commissionOwed, 0);

  return (
    <div>
      <PageHeader
        title="Referral Partners"
        description={
          canViewCompanyMetrics
            ? "Third parties referring business into the sales pipeline."
            : "Partner directory. Program totals and commissions are visible to Management only."
        }
        actions={
          canViewCompanyMetrics && (
            <Button variant="primary" onClick={() => setAddOpen(true)}>
              <Plus size={15} /> Add Partner
            </Button>
          )
        }
      />

      {canViewCompanyMetrics && (
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Referrals Sent" value={String(totalReferrals)} icon={<Handshake size={18} />} />
          <StatCard
            label="Conversion Rate"
            value={totalReferrals ? `${Math.round((totalConversions / totalReferrals) * 100)}%` : "—"}
            icon={<TrendingUp size={18} />}
          />
          <StatCard label="Commission Owed" value={currency(totalOwed)} icon={<DollarSign size={18} />} />
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Partner</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Referrals Sent</th>
                <th className="px-5 py-3 font-medium">Conversions</th>
                {canViewCompanyMetrics && <th className="px-5 py-3 font-medium">Commission Owed</th>}
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {partners.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{p.name}</td>
                  <td className="px-5 py-3 text-slate-500">{p.contact}</td>
                  <td className="px-5 py-3 text-slate-600">{p.referralsSent}</td>
                  <td className="px-5 py-3 text-slate-600">{p.conversions}</td>
                  {canViewCompanyMetrics && <td className="px-5 py-3 font-medium text-slate-800">{currency(p.commissionOwed)}</td>}
                  <td className="px-5 py-3">
                    <Badge tone={p.status === "active" ? "emerald" : "slate"}>{p.status === "active" ? "Active" : "Inactive"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {addOpen && <AddPartnerModal onClose={() => setAddOpen(false)} />}
    </div>
  );
}

function AddPartnerModal({ onClose }: { onClose: () => void }) {
  const { profile } = useRole();
  const { addPartner } = useDemoData();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!name.trim()) return setError("Enter the partner's name.");
    if (!/^\S+@\S+\.\S+$/.test(contact.trim())) return setError("Enter a contact email address.");
    addPartner({ name: name.trim(), contact: contact.trim(), status, referralsSent: 0, conversions: 0, commissionOwed: 0 }, profile);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Add Referral Partner"
      description="Referral counts and commissions start at zero and build up as referrals are logged."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Add Partner</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Partner name *">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Contact email *">
          <input type="email" className={inputClass} value={contact} onChange={(e) => setContact(e.target.value)} />
        </Field>
        <Field label="Status">
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as "active" | "inactive")}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>
      </div>
      {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    </Modal>
  );
}
