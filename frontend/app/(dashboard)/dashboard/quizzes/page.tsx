"use client";
import React, { useEffect, useState } from "react";
import BreadCrumb from "@/components/breadcrumb";
import { Card, Pagination } from "@nextui-org/react";
import { CardContent } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import CreateQuizDialog from "@/components/quiz/create-quiz-dialog";
import UpdateQuizDialog from "@/components/quiz/update-quiz-dialog";
import { useToast } from "@/components/ui/use-toast";

const breadcrumbItems = [{ title: "Quizzes", link: "/dashboard/quizzes" }];

export default function Page() {
  const { data: session } = useSession();
  const teacherEmail = session?.user?.email;
  const [quizzes, setQuizzes] = useState<any>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!teacherEmail) return;

    const fetchQuizzes = async () => {
      const pageSize = 10;
      const apiUrl = `${
        process.env.NEXT_PUBLIC_API_URL
      }/quizzes/teacher?email=${encodeURIComponent(teacherEmail)}&offset=${
        (currentPage - 1) * pageSize
      }&limit=${pageSize}`;
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        setQuizzes(data.quizzes);
        setTotalPages(Math.ceil(data.totalCount / pageSize));
      } catch (error) {
        console.error("Failed to fetch quizzes:", error);
      }
    };

    fetchQuizzes();
  }, [currentPage, teacherEmail]);

  const handleQuizCreated = (data: any) => {
    const quiz = data.quiz;
    setQuizzes([quiz, ...quizzes]);
    setOpen(false);
    toast({
      variant: "success",
      title: "Quiz created successfully.",
    });
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="flex items-center">
          <BreadCrumb items={breadcrumbItems} />
          <CreateQuizDialog
            handleQuizCreated={handleQuizCreated}
            open={open}
            setOpen={setOpen}
            onOpenChange={setOpen}
          />
        </div>
        <div className="flex flex-col gap-4 md:gap-6">
          {quizzes.map((quiz: any) => (
            <Card key={quiz._id}>
              {" "}
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-wrap justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <h2 className="font-semibold text-base">{quiz.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Created at {new Date(quiz.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-sm font-medium">Status:</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {quiz.status ? "Published" : "Draft"}{" "}
                    </span>
                    <div className="flex items-center">
                      <UpdateQuizDialog />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <div className="flex justify-end">
            <Pagination
              total={totalPages}
              initialPage={1}
              onChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
