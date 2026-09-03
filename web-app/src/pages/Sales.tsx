import { Download, Filter } from "lucide-react";
import { Card, PageHeader, Badge, Button, currency } from "../components/ui";
import { salesOrders, type SalesOrder } from "../data/mockData";

const statusTone: Record<SalesOrder["status"], "emerald" | "amber" | "rose"> = {
  paid: "emerald",
  pending: "amber",
  overdue: "rose",
};

export default function Sales() {
  return (
    <div>
      <PageHeader
        title="Sales Reports"
        description="Order-level revenue combined from ASI SmartBooks and Facilis Syncore."
        actions={
          <>
            <Button variant="secondary">
              <Filter size={15} /> Filter
            </Button>
            <Button variant="primary">
              <Download size={15} /> Export
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Order #</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Rep</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salesOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{order.id}</td>
                  <td className="px-5 py-3 text-slate-600">{order.customer}</td>
                  <td className="px-5 py-3 text-slate-600">{order.rep}</td>
                  <td className="px-5 py-3 text-slate-500">{order.date}</td>
                  <td className="px-5 py-3 font-medium text-slate-800">{currency(order.amount)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={statusTone[order.status]}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={order.source === "ASI SmartBooks" ? "sky" : "violet"}>{order.source}</Badge>
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
