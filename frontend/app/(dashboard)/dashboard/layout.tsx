"use client";
import { useSession } from "next-auth/react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Suspense } from "react";
import Loading from "./loading";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Header />
      <div className="flex">
        <Suspense fallback={<Loading />}>
          <Sidebar />
        </Suspense>
        <Suspense fallback={<Loading />}>
          <main className="w-full pt-16">{children}</main>
        </Suspense>
      </div>
    </>
  );
}
