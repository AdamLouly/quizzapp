import BreadCrumb from "@/components/breadcrumb";
import { UserForm } from "@/components/forms/teacher-form";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";

export default function Page() {
  const breadcrumbItems = [
    { title: "Teacher", link: "/dashboard/teachers" },
    { title: "Create", link: "/dashboard/teachers/create" },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-5">
        <BreadCrumb items={breadcrumbItems} />
        <UserForm key={null} />
      </div>
    </ScrollArea>
  );
}
