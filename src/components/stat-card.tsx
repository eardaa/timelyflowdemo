import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon,
  className,
  ...props 
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-surface rounded-xl border border-border p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between space-y-0 pb-2">
        <h3 className="tracking-tight text-sm font-medium text-muted">
          {title}
        </h3>
        {icon && (
          <div className="h-4 w-4 text-muted">
            {icon}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-2xl font-bold font-display text-text">
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
