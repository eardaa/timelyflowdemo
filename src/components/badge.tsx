import { cn } from "@/lib/utils";
import React from "react";

export type BadgeVariant = 
  | "default" 
  | "success" 
  | "warning" 
  | "danger" 
  | "ai" 
  | "muted" 
  | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ 
  className, 
  variant = "default", 
  ...props 
}: BadgeProps) {
  
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold whitespace-nowrap transition-colors";
  
  const variants: Record<BadgeVariant, string> = {
    default: "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
    ai: "bg-ai/10 text-ai",
    muted: "bg-muted/10 text-muted",
    outline: "border border-border text-muted-foreground",
  };

  return (
    <span
      className={cn(baseClasses, variants[variant], className)}
      {...props}
    />
  );
}
