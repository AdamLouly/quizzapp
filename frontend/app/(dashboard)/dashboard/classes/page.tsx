import React from "react";
import BreadCrumb from "@/components/breadcrumb";
import { ClassClient } from "@/components/tables/class-tables/client";

const breadcrumbItems = [{ title: "Classes", link: "/dashboard/classes" }];

export default function Page() {
  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <BreadCrumb items={breadcrumbItems} />
        <ClassClient />
      </div>
    </>
  );
}
