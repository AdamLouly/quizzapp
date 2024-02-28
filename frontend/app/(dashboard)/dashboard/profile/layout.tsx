"use client";

import { SidebarNav } from "@/components/forms/profile/sidebar-nav";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

interface SettingsLayoutProps {
  children: React.ReactNode;
}
export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const sidebarNavItems = [
    {
      title: "Profile",
      href: "/dashboard/profile",
    },
    {
      title: "Account",
      href: "/dashboard/account",
    },
    {
      title: "Notifications",
      href: "/dashboard/notifications",
    },
  ];

  return (
    <>
      <div className="md:hidden">
        <Image
          src="/examples/forms-light.png"
          width={1280}
          height={791}
          alt="Forms"
          className="block dark:hidden"
        />
        <Image
          src="/examples/forms-dark.png"
          width={1280}
          height={791}
          alt="Forms"
          className="hidden dark:block"
        />
      </div>
      <div className="hidden md:block p-10 pb-16">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and set e-mail preferences.
          </p>
        </div>
        <Separator className="my-6" />
        <div className="flex lg:space-x-12">
          <aside className="w-1/5 min-w-max">
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1 lg:max-w-4xl">{children}</div>
        </div>
      </div>
    </>
  );
}
