import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "lg",
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative w-full apple-glass rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200",
          maxWidthClasses[maxWidth]
        )}
      >
        {(title || description) && (
          <div className="px-6 py-4.5 border-b border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
            <div>
              {title && (
                <h3 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5 stroke-[2]" />
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
