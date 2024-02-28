"use client";
import React, { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import axios from "axios";
import { getColumns } from "./columns";
import { Skeleton } from "@nextui-org/react";

export const UserClient: React.FC = () => {
  const [clients, setclients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalclients, setTotalclients] = useState(0);

  const totalPages = Math.ceil(totalclients / pageSize);

  const handlePageChange = (newPage: any) => {
    setCurrentPage(newPage);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const offset = (currentPage - 1) * pageSize;
      axios
        .get(`${process.env.NEXT_PUBLIC_API_URL}/clients`, {
          params: { limit: pageSize, offset },
        })
        .then((res) => {
          setclients(res.data.clients);
          setTotalclients(res.data.total);
          setLoading(false);
        })
        .catch((error) => {
          console.log(error);
          setLoading(false);
        });
    };

    fetchData();
  }, [currentPage, pageSize]);

  const columns = getColumns();

  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title={`Clients (${clients.length})`}
          description="Manage clients"
        />
      </div>
      <Separator />
      <Skeleton isLoaded={!loading}>
        <DataTable
          searchKey="phone"
          columns={columns}
          data={clients}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </Skeleton>
    </>
  );
};
