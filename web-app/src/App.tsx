import { Routes, Route } from "react-router-dom";
import Layout from "./layout/Layout";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Customers from "./pages/Customers";
import Prospects from "./pages/Prospects";
import ReferralPartners from "./pages/ReferralPartners";
import SalesPipeline from "./pages/SalesPipeline";
import OrderExcellence from "./pages/OrderExcellence";
import ProjectTracker from "./pages/ProjectTracker";
import AuditTrail from "./pages/AuditTrail";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/prospects" element={<Prospects />} />
        <Route path="/referral-partners" element={<ReferralPartners />} />
        <Route path="/pipeline" element={<SalesPipeline />} />
        <Route path="/order-excellence" element={<OrderExcellence />} />
        <Route path="/project-tracker" element={<ProjectTracker />} />
        <Route path="/audit-trail" element={<AuditTrail />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
