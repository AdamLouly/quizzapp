"use client";
import BreadCrumb from "@/components/breadcrumb";
import { UserForm } from "@/components/forms/user-form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { useParams } from "next/navigation";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

export default function Page() {
  const params = useParams();
  const userId = params.userId;
  const breadcrumbItems = [
    { title: "User", link: "/dashboard/users" },
    { title: "Update", link: `/dashboard/users/update/${userId}` },
  ];
  const [userData, setUserData] = useState({
    firstname: "",
    lastname: "",
    username: "",
    email: "",
    password: "",
    role: "student",
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
          console.error("Failed to fetch user data:", error);
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
