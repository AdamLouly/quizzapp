"use client";
import BreadCrumb from "@/components/breadcrumb";
import { ClassForm } from "@/components/forms/class-form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ClientUpdatePage() {
  const params = useParams();
  const classId: any = params.userId;
  const breadcrumbItems = [
    { title: "Classes", link: "/dashboard/classes" },
    { title: "Update", link: `/dashboard/classes/update/${classId}` },
  ];
  const [classData, setClassData] = useState({
    name: "",
    teacher: "",
    client: "",
    students: [],
    quizzes: [],
  });

  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (classId) {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/classes/${classId}`,
          );
          setClassData(response.data.class);
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Failed to fetch class data",
          });
        }
      }
    };

    fetchData();
  }, [classId, toast]);

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-5">
        <BreadCrumb items={breadcrumbItems} />
        <ClassForm initialData={classData} classId={classId} />
      </div>
    </ScrollArea>
  );
}
