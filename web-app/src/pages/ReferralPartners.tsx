import { Plus } from "lucide-react";
import { Card, PageHeader, Badge, Button, StatCard, currency } from "../components/ui";
import { referralPartners } from "../data/mockData";
import { Handshake, TrendingUp, DollarSign } from "lucide-react";

export default function ReferralPartners() {
  const totalReferrals = referralPartners.reduce((sum, p) => sum + p.referralsSent, 0);
  const totalConversions = referralPartners.reduce((sum, p) => sum + p.conversions, 0);
  const totalOwed = referralPartners.reduce((sum, p) => sum + p.commissionOwed, 0);

  return (
    <div>
      <PageHeader
        title="Referral Partners"
        description="Third parties referring business into the sales pipeline."
        actions={
          <Button variant="primary">
            <Plus size={15} /> Add Partner
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Referrals Sent" value={String(totalReferrals)} icon={<Handshake size={18} />} />
        <StatCard
          label="Conversion Rate"
          value={`${Math.round((totalConversions / totalReferrals) * 100)}%`}
          icon={<TrendingUp size={18} />}
        />
        <StatCard label="Commission Owed" value={currency(totalOwed)} icon={<DollarSign size={18} />} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Partner</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Referrals Sent</th>
                <th className="px-5 py-3 font-medium">Conversions</th>
                <th className="px-5 py-3 font-medium">Commission Owed</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {referralPartners.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{p.name}</td>
                  <td className="px-5 py-3 text-slate-500">{p.contact}</td>
                  <td className="px-5 py-3 text-slate-600">{p.referralsSent}</td>
                  <td className="px-5 py-3 text-slate-600">{p.conversions}</td>
                  <td className="px-5 py-3 font-medium text-slate-800">{currency(p.commissionOwed)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={p.status === "active" ? "emerald" : "slate"}>
                      {p.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
