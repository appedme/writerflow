import { cx } from "@/src/utils";
import { forwardRef } from "react";

const Input = forwardRef(({ 
  label, 
  error, 
  className = "", 
  type = "text",
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={cx(
          "w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
          "dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-500",
          error && "border-red-500 focus:ring-red-500",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;