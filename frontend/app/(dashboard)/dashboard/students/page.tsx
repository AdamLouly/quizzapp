import React from "react";
import BreadCrumb from "@/components/breadcrumb";
import { UserClient } from "@/components/tables/student-tables/client";

const breadcrumbItems = [{ title: "Student", link: "/dashboard/students" }];

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
