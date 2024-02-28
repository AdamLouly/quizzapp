"use client";
import BreadCrumb from "@/components/breadcrumb";
import { UserForm } from "@/components/forms/student-form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function Page() {
  const params = useParams();
  const userId = params.userId;
  const breadcrumbItems = [
    { title: "Student", link: "/dashboard/students" },
    { title: "Update", link: `/dashboard/students/update/${userId}` },
  ];
  const [userData, setUserData] = useState({
    firstname: "",
    lastname: "",
    username: "",
    email: "",
    password: "",
    role: "students",
    status: "inactive",
    profilePicture: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (userId) {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`,
          );
          setUserData(response.data.user);
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Failed to fetch user data",
          });
        }
      }
    };

    fetchData();
  }, [userId, toast]);
  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-5">
        <BreadCrumb items={breadcrumbItems} />
        <UserForm initialData={userData} userId={userId} />
      </div>
    </ScrollArea>
  );
}
