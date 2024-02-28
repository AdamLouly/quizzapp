import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, Skeleton } from "@nextui-org/react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { buttonVariants } from "../ui/button";
import { cn } from "@/lib/utils";

function LayoutGridIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}

function SchoolIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m4 6 8-4 8 4" />
      <path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2" />
      <path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4" />
      <path d="M18 5v17" />
      <path d="M6 5v17" />
      <circle cx="12" cy="9" r="2" />
    </svg>
  );
}

function UnderlineIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 4v6a6 6 0 0 0 12 0V4" />
      <line x1="4" x2="20" y1="20" y2="20" />
    </svg>
  );
}

const navSections = [
  {
    title: "Configuration",
    items: [
      {
        title: "Client Settings",
        href: "/dashboard/clients",
        icon: LayoutGridIcon,
        roles: ["admin"],
      },
      {
        title: "Teachers",
        href: "/dashboard/teachers",
        icon: SchoolIcon,
        roles: ["admin"],
      },
      {
        title: "Students",
        href: "/dashboard/students",
        icon: SchoolIcon,
        roles: ["admin"],
      },
      {
        title: "Classes",
        href: "/dashboard/classes",
        icon: UnderlineIcon,
        roles: ["admin"],
      },
    ],
  },
  {
    title: "Education",
    items: [
      {
        title: "Quizzes",
        href: "/dashboard/quizzes",
        icon: SchoolIcon,
        roles: ["teacher", "student"],
      },
    ],
  },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || "";
  const pathname = usePathname();

  return (
    <div className="bg-white p-4 rounded-lg shadow-md w-64 relative hidden border-r pt-16 lg:block w-72">
      {navSections.map((section, sectionIndex) => {
        // Filter items based on user role
        const filteredItems = section.items.filter((item) =>
          item.roles.includes(userRole),
        );

        if (filteredItems.length > 0) {
          return (
            <div key={sectionIndex}>
              <h2 className="text-lg font-semibold mb-4">{section.title}</h2>
              <nav className="flex flex-col gap-2">
                {filteredItems.map((item, itemIndex) => (
                  <Link
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100",
                      pathname.includes(item.href) ? "bg-gray-200" : "",
                    )}
                    key={itemIndex}
                    href={item.href}
                  >
                    <item.icon className="text-gray-600 h-5 w-5 mr-3" />
                    {item.title}
                  </Link>
                ))}
              </nav>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
