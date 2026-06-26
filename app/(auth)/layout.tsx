"use client";

import Link from "next/link";
import { HelpCircle, Globe } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background flex justify-between items-center h-12 px-4">
        <span className="text-xl font-extrabold text-foreground tracking-tight">Libraflow</span>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors">
            <Globe className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center pt-12 pb-20 px-4 relative overflow-hidden">
        {/* Atmospheric blobs */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-secondary rounded-full blur-[100px]" />
        </div>
        {children}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 w-full border-t border-border bg-background flex flex-col md:flex-row justify-between items-center py-3 px-4 z-50">
        <span className="text-xs text-muted-foreground mb-1 md:mb-0">
          © 2024 Libraflow. All rights reserved.
        </span>
        <div className="flex gap-4">
          {["Privacy Policy", "Terms of Service", "Security Compliance", "Contact Support"].map((label) => (
            <Link key={label} href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              {label}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
