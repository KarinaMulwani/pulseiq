import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:opacity-40 disabled:pointer-events-none select-none active:scale-[0.98]";

    const sizeStyles = {
      sm: "h-8 px-3 text-xs rounded-xl gap-1.5",
      md: "h-9 px-4 text-xs rounded-xl gap-2",
      lg: "h-10 px-5 text-sm rounded-xl gap-2.5",
      icon: "h-8 w-8 rounded-xl p-0",
    };

    const variantStyles = {
      primary:
        "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 shadow-xs",
      secondary:
        "backdrop-blur-xl bg-black/[0.04] dark:bg-white/[0.08] text-neutral-800 dark:text-neutral-200 hover:bg-black/[0.07] dark:hover:bg-white/[0.12] border border-black/[0.04] dark:border-white/[0.06]",
      outline:
        "backdrop-blur-xl bg-white/40 dark:bg-zinc-900/40 text-neutral-800 dark:text-neutral-200 border border-black/[0.08] dark:border-white/[0.1] hover:bg-black/[0.03] dark:hover:bg-white/[0.05]",
      ghost:
        "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.06]",
      danger:
        "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-0.5 h-3.5 w-3.5 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Processing...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
