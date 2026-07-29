"use client";

import Header from "@/components/Header";
import { useSessionTimeout } from "@/lib/useSessionTimeout";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useSessionTimeout();

  return (
    <>
      <Header />
      {children}
    </>
  );
}
