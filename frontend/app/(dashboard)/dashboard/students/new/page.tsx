import BreadCrumb from "@/components/breadcrumb";
import { UserForm } from "@/components/forms/student-form";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";

export default function Page() {
  const breadcrumbItems = [
    { title: "Student", link: "/dashboard/students" },
    { title: "Create", link: "/dashboard/students/create" },
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
