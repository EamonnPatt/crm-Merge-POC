import { Plus } from "lucide-react";
import { Card, PageHeader, Badge, Button, currency } from "../components/ui";
import { customers } from "../data/mockData";

export default function Customers() {
  return (
    <div>
      <PageHeader
        title="Customers"
        description="Accounts consolidated from both source systems."
        actions={
          <Button variant="primary">
            <Plus size={15} /> Add Customer
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Orders</th>
                <th className="px-5 py-3 font-medium">Lifetime Value</th>
                <th className="px-5 py-3 font-medium">Customer Since</th>
                <th className="px-5 py-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{c.name}</td>
                  <td className="px-5 py-3 text-slate-600">{c.company}</td>
                  <td className="px-5 py-3 text-slate-500">
                    <div>{c.email}</div>
                    <div className="text-xs text-slate-400">{c.phone}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{c.totalOrders}</td>
                  <td className="px-5 py-3 font-medium text-slate-800">{currency(c.lifetimeValue)}</td>
                  <td className="px-5 py-3 text-slate-500">{c.since}</td>
                  <td className="px-5 py-3">
                    <Badge tone={c.source === "ASI SmartBooks" ? "sky" : "violet"}>{c.source}</Badge>
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
