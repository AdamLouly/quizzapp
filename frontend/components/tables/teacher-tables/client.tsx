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
import { Skeleton } from "@nextui-org/react";
import { useToast } from "@/components/ui/use-toast";

export const UserClient: React.FC = () => {
  const [teachers, setteachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalteachers, setTotalteachers] = useState(0);
  const router = useRouter();
  const { toast } = useToast();

  const totalPages = Math.ceil(totalteachers / pageSize);

  const handlePageChange = (newPage: any) => {
    setCurrentPage(newPage);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const offset = (currentPage - 1) * pageSize;
      axios
        .get(`${process.env.NEXT_PUBLIC_API_URL}/teachers`, {
          params: { limit: pageSize, offset },
        })
        .then((res) => {
          setteachers(res.data.teachers);
          setTotalteachers(res.data.total);
          setLoading(false);
        })
        .catch((error) => {
          console.log(error);
          setLoading(false);
        });
    };

    fetchData();
  }, [currentPage, pageSize]);

  const handleTeaherDelete = (studentId: any) => {
    setteachers(teachers.filter((student: any) => student._id !== studentId));
    toast({
      variant: "success",
      title: "Teacher Deleted.",
    });
  };

  const columns = getColumns(handleTeaherDelete);

  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title={`Teachers (${teachers.length})`}
          description="Manage teachers"
        />
        <Button
          className="text-xs md:text-sm"
          onClick={() => router.push(`/dashboard/teachers/new`)}
        >
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </div>
      <Separator />
      <Skeleton isLoaded={!loading}>
        <DataTable
          searchKey="username"
          columns={columns}
          data={teachers}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </Skeleton>
    </>
  );
};
