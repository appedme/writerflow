"use client";
import { useUI } from "@/src/contexts/UIContext";
import { cx } from "@/src/utils";
import { useEffect } from "react";

const Toast = () => {
  const { toast } = useUI();

  if (!toast) return null;

  const variants = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    warning: "bg-yellow-500 text-black",
    info: "bg-blue-500 text-white",
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
      <div className={cx(
        "px-4 py-3 rounded-lg shadow-lg max-w-sm",
        variants[toast.type] || variants.info
      )}>
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
    </div>
  );
};

export default Toast;