"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { Sidebar } from "@/components/layout/sidebar";
import { FilePreviewProvider } from "@/components/files/file-preview-context";
import { isAuthenticated } from "@/lib/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <FilePreviewProvider>
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-white">
            <div className="px-6 py-4">
              {children}
            </div>
          </main>
        </div>
      </div>
    </FilePreviewProvider>
  );
}
