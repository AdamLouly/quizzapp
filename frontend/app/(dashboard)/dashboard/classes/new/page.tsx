import BreadCrumb from "@/components/breadcrumb";
import { ClassForm } from "@/components/forms/class-form";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";

export default function Page() {
  const breadcrumbItems = [
    { title: "Classes", link: "/dashboard/classes" },
    { title: "Create", link: "/dashboard/classes/create" },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-5">
        <BreadCrumb items={breadcrumbItems} />
        <ClassForm key={null} />
      </div>
    </ScrollArea>
  );
}
