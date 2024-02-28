"use client";
import React from "react";
import ThemeProvider from "./ThemeToggle/theme-provider";
import { SessionProvider, SessionProviderProps } from "next-auth/react";
import Next13ProgressBar from "next13-progressbar";
import { NextUIProvider } from "@nextui-org/system";

export default function Providers({
  session,
  children,
}: {
  session: SessionProviderProps["session"];
  children: React.ReactNode;
}) {
  return (
    <>
      <NextUIProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <SessionProvider session={session}>{children}</SessionProvider>
          <Next13ProgressBar
            height="4px"
            color="#0A2FFF"
            options={{ showSpinner: true }}
            showOnShallow
          />
        </ThemeProvider>
      </NextUIProvider>
    </>
  );
}
