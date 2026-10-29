import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "danger" | "outline" | "indigo";
}

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default:
      "bg-black/[0.04] dark:bg-white/[0.08] text-neutral-800 dark:text-neutral-200 border-black/[0.04] dark:border-white/[0.06]",
    secondary:
      "bg-black/[0.02] dark:bg-white/[0.04] text-neutral-600 dark:text-neutral-400 border-black/[0.03] dark:border-white/[0.04]",
    success:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    warning:
      "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    danger:
      "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
    indigo:
      "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
    outline:
      "bg-transparent text-neutral-700 dark:text-neutral-300 border-black/[0.08] dark:border-white/[0.1]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border backdrop-blur-md transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
