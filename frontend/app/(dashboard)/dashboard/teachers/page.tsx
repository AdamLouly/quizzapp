// page.tsx
// @ts-ignore
import React from "react";
// @ts-ignore
import BreadCrumb from "@/components/breadcrumb";
// @ts-ignore
import { UserClient } from "@/components/tables/teacher-tables/client";

const breadcrumbItems = [{ title: "Teacher", link: "/dashboard/teachers" }];

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
