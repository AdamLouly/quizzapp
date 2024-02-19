"use client";
import Link from "next/link";
import UserAuthForm from "@/components/forms/user-auth-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FlagIcon } from "lucide-react";

export default function AuthenticationPage() {
  const user = useSession().data;
  const router = useRouter();
  useEffect(() => {
    if (user) {
      router.back();
    }
  }, [user, router]);
  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className="w-1/2 bg-black text-white flex flex-col justify-center p-12 space-y-4">
        <FlagIcon className="h-8 w-8 text-white" />
        <h1 className="text-4xl font-bold">Logo</h1>
        <p className="text-lg">
          "Unlock your potential with seamless collaboration and productivity
          tools."
        </p>
        <p className="text-right mt-4">- The QuizzApp Team</p>
      </div>
      <div className="w-1/2 flex flex-col justify-center p-12">
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-semibold mb-2">Welcome Back</h2>
          <p className="text-gray-600 mb-6">Sign in to your account</p>
          <UserAuthForm />
          <p className="text-xs text-gray-600 text-center mt-4">
            By clicking continue, you agree to our{" "}
            <Link className="text-blue-600" href="#">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link className="text-blue-600" href="#">
              Privacy Policy
            </Link>
            .{"\n              "}
          </p>
        </div>
      </div>
    </div>
  );
}
