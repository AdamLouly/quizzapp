"use client";
import BreadCrumb from "@/components/breadcrumb";
import { ClientForm } from "@/components/forms/client-form"; // Ensure this is correctly pointing to your ClientForm component
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { useParams } from "next/navigation"; // Use next/router instead of next/navigation for useRouter
import React, { useEffect, useState } from "react";

export default function ClientUpdatePage() {
  const params = useParams();
  const clientId = params.userId;
  const breadcrumbItems = [
    { title: "Clients", link: "/dashboard/clients" },
    { title: "Update", link: `/dashboard/clients/update/${clientId}` },
  ];
  const [clientData, setClientData] = useState({
    name: "",
    address: "",
    email: "",
    phone: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (clientId) {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/clients/${clientId}`,
          );
          setClientData(response.data.client); // Adjust the path according to your API response structure
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Failed to fetch client data",
          });
        }
      }
    };

    fetchData();
  }, [clientId, toast]);

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-5">
        <BreadCrumb items={breadcrumbItems} />
        <ClientForm initialData={clientData} clientId={clientId} />
      </div>
    </ScrollArea>
  );
}
