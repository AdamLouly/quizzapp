"use client";
import { useSession, signIn } from "next-auth/react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Suspense, useEffect } from "react";
import Loading from "./loading";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Header />
      <div className="flex h-screen">
        <Sidebar />
        <Suspense fallback={<Loading />}>
          <main className="w-full pt-16">{children}</main>
        </Suspense>
      </div>
    </>
  );
}
