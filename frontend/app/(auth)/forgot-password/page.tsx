"use client";
import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

const schema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email format" })
    .min(1, { message: "Email is required" }),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`,
        data,
      );
      toast({
        variant: "default",
        title: "If an account with that email exists, we sent you an email.",
      });
      router.push("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to fetch user data",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 items-center justify-center">
      <div className="mx-auto max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <h2 className="text-center text-2xl font-semibold">
            Forgot Password
          </h2>
          <p className="text-sm text-gray-600 text-center">
            Enter your email below to reset your password
          </p>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              className="mt-1 block w-full"
            />
            {errors.email && (
              <span className="text-red-500 text-xs">
                {errors.email.message}
              </span>
            )}
          </div>
          <Button disabled={loading} className="w-full">
            {loading ? "Processing..." : "Send Reset Link"}
          </Button>
          <div className="text-center">
            <Link href="/" className="text-blue-600 hover:underline text-sm">
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
