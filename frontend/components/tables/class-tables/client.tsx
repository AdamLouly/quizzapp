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
import axiosInstance from "@/lib/custom-axios";

export const ClassClient: React.FC = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalClasses, setTotalClasses] = useState(0);
  const [teachers, setTeachers] = useState({});
  const [students, setStudents] = useState({});
  const [quizzes, setQuizzes] = useState({});
  const [clients, setClients] = useState({});
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const offset = (currentPage - 1) * pageSize;
      const classesResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/classes`,
        {
          params: { limit: pageSize, offset },
        },
      );
      setClasses(classesResponse.data.classes);
      setTotalClasses(classesResponse.data.total);

      const [
        teachersResponse,
        studentsResponse,
        quizzesResponse,
        clientsResponse,
      ] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/teachers`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/students`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/quizzes`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/clients`),
      ]);

      const teachersData = teachersResponse.data.teachers.reduce(
        (acc: any, teacher: any) => {
          acc[teacher._id] = teacher.username;
          return acc;
        },
        {},
      );

      const clientsData = clientsResponse.data.clients.reduce(
        (acc: any, client: any) => {
          acc[client._id] = client.name;
          return acc;
        },
        {},
      );

      const studentsData = studentsResponse.data.students.reduce(
        (acc: any, student: any) => {
          acc[student._id] = student.username;
          return acc;
        },
        {},
      );

      const quizzesData = quizzesResponse.data.quizzes.reduce(
        (acc: any, quiz: any) => {
          acc[quiz._id] = quiz.title;
          return acc;
        },
        {},
      );

      setTeachers(teachersData);
      setStudents(studentsData);
      setQuizzes(quizzesData);
      setClients(clientsData);
      setLoading(false);
    };

    fetchData();
  }, [currentPage, pageSize]);

  const handleClassDelete = async (classId) => {
    setClasses(classes.filter((classs: any) => classs._id !== classId));
  }

  const totalPages = Math.ceil(totalClasses / pageSize);

  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title={`Classes (${classes.length})`}
          description="Manage classes"
        />
        <Button
          className="text-xs md:text-sm"
          onClick={() => router.push(`/dashboard/classes/new`)}
        >
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </div>
      <Separator />
      {loading ? (
        <div>Loading...</div>
      ) : (
        <DataTable
          searchKey="name"
          columns={getColumns(
            handleClassDelete,
            teachers,
            clients,
            students,
            quizzes,
          )}
          data={classes}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </>
  );
};
