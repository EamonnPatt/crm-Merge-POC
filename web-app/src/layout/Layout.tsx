import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const titleByPath: Record<string, string> = {
  "/": "Dashboard",
  "/sales": "Sales Reports",
  "/customers": "Customers",
  "/prospects": "Prospects",
  "/referral-partners": "Referral Partners",
  "/pipeline": "Sales Pipeline",
  "/order-excellence": "Order Excellence",
  "/reports": "Reports",
  "/settings": "Settings",
};

export default function Layout() {
  const { pathname } = useLocation();
  const title = titleByPath[pathname] ?? "Company Internal";

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
