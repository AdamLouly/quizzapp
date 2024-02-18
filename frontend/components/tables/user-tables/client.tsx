// client.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";
import axios from "axios";
import { getColumns } from "./columns";

export const UserClient: React.FC = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const router = useRouter();

  const totalPages = Math.ceil(totalUsers / pageSize);

  const handlePageChange = (newPage:any) => {
    setCurrentPage(newPage);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const offset = (currentPage - 1) * pageSize;
      axios
        .get(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
          params: { limit: pageSize, offset },
        })
        .then((res) => {
          setUsers(res.data.users);
          setTotalUsers(res.data.total);
          setLoading(false);
        })
        .catch((error) => {
          console.log(error);
          setLoading(false);
        });
    };

    fetchData();
  }, [currentPage, pageSize]);

  const handleUserDelete = (userId: any) => {
    setUsers(users.filter((user: any) => user._id !== userId));
  };

  const columns = getColumns(handleUserDelete);

  return (
    <>
      <div className="flex items-start justify-between">
        <Heading title={`Users (${users.length})`} description="Manage users" />
        <Button
          className="text-xs md:text-sm"
          onClick={() => router.push(`/dashboard/users/new`)}
        >
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </div>
      <Separator />
      {loading ? (
        <div>Loading...</div>
      ) : (
        <DataTable
          searchKey="username"
          columns={columns}
          data={users}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </>
  );
};
