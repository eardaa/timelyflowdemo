"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/types";

interface DashboardShellProps {
  role: AppRole;
  userName: string;
  userEmail: string;
  children: React.ReactNode;
}

export function DashboardShell({ role, userName, userEmail, children }: DashboardShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar 
        role={role} 
        userName={userName} 
        userEmail={userEmail} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
      />
      <main 
        className={cn(
          "flex-1 p-4 sm:p-8 transition-all duration-300 ease-in-out", 
          isCollapsed ? "ml-[80px]" : "ml-[280px]"
        )}
      >
        <div className="mx-auto max-w-6xl space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
