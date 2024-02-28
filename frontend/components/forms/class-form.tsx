"use client";
import React, { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useToast } from "../ui/use-toast";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { MultiSelect } from "../ui/multiselect";

const formSchema = z.object({
  name: z.string().min(1, { message: "Class name is required" }),
  teacher: z.string(),
  students: z.array(z.string()).optional(),
  client: z.string(),
  quizzes: z.array(z.string()).optional(),
});

type ClassFormValues = z.infer<typeof formSchema>;

export const ClassForm: React.FC<{
  initialData?: ClassFormValues;
  classId?: number;
}> = ({ initialData, classId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [clients, setClients] = useState([]);

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...initialData,
      name: initialData?.name || "",
      client: initialData?.client || "-1",
      teacher: initialData?.teacher || "-1",
      students: initialData?.students || [],
    },
  });

  useEffect(() => {
    if (initialData) {
      const formValues = {
        ...initialData,
        teacher: initialData?.teacher?._id || "-1",
        students:
          initialData?.students?.map((student: any) => student._id) || [],
        client: initialData.client || "-1",
      };
      form.reset(formValues);
    }
  }, [initialData, form]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teachersRes, studentsRes, clientsRes] =
          await Promise.all([
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/teachers`),
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/students`),
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/clients`),
          ]);
        setTeachers(teachersRes.data.teachers);
        setStudents(studentsRes.data.students);
        setClients(clientsRes.data.clients);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        toast({ variant: "destructive", title: "Failed to load initial data" });
      }
    };
    fetchData();
  }, [toast]);

  const onSubmit = async (data: ClassFormValues) => {
    setLoading(true);
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/classes/${
        classId ? `${classId}` : ""
      }`;
      data.client = data.client == "-1" ? null : data.client;
      data.teacher = data.teacher == "-1" ? null : data.teacher;
      await axios({
        method: classId ? "put" : "post",
        url: apiUrl,
        data,
      });
      toast({
        variant: "success",
        title: `Class ${classId ? "updated" : "created"} successfully.`,
      });
      router.push("/dashboard/classes");
    } catch (error) {
      console.error("Error submitting class form:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Class Name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="client"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-1">
                        <em>None</em>
                      </SelectItem>
                      {clients.map((client: any) => (
                        <SelectItem key={client._id} value={client._id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="teacher"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Teacher</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => field.onChange(value)}
                      value={field.value ? field.value.toString() : "-1"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-1">
                          <em>None</em>
                        </SelectItem>
                        {teachers.map((teacher: any) => (
                          <SelectItem
                            key={teacher._id}
                            value={teacher._id.toString()}
                          >
                            {teacher.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="students"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Students</FormLabel>
                <FormControl>
                  <MultiSelect
                    selected={field.value.map((id: any) => {
                      // Find the student object and return as { label, value }
                      const studentObj: any = students.find(
                        (student: any) => student._id === id,
                      );
                      return {
                        label: studentObj
                          ? studentObj.username
                          : "Student not found",
                        value: id,
                      };
                    })}
                    options={students.map((student: any) => ({
                      label: student.username,
                      value: student._id,
                    }))}
                    onChange={(selectedOptions) => {
                      // Pass only the ids to the onChange handler
                      const selectedIds = selectedOptions.map(
                        (option) => option.value,
                      );
                      field.onChange(selectedIds);
                    }}
                    /* className="sm:w-[510px]" */
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button disabled={loading} type="submit">
          {initialData ? "Update Class" : "Create Class"}
        </Button>
      </form>
    </FormProvider>
  );
};
