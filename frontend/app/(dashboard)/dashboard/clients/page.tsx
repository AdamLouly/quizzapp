// page.tsx
// @ts-ignore
import React from "react";
// @ts-ignore
import BreadCrumb from "@/components/breadcrumb";
// @ts-ignore
import { UserClient } from "@/components/tables/client-tables/client";

const breadcrumbItems = [{ title: "Client", link: "/dashboard/clients" }];

export default function Page() {
  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <BreadCrumb items={breadcrumbItems} />
        <UserClient />
      </div>
    </>
  );
}
