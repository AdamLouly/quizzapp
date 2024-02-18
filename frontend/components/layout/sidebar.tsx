import { DashboardNav } from "@/components/dashboard-nav";
import { navItems } from "@/constants/data";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

export default function Sidebar() {
  const user = useSession().data?.user;
  const filteredNavItems = navItems.filter((item) => {
    if (user?.role === "admin") {
      return item.roles.includes("admin");
    }
    if (user?.role === "teacher") {
      return item.roles.includes("teacher");
    }
    if (user?.role === "student") {
      return item.roles.includes("student");
    }
    return false;
  });
  return (
    <nav
      className={cn(`relative hidden h-screen border-r pt-16 lg:block w-72`)}
    >
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            <h2 className="mb-2 px-4 text-xl font-semibold tracking-tight">
              Overview
            </h2>
            <DashboardNav items={filteredNavItems} />
          </div>
        </div>
      </div>
    </nav>
  );
}
