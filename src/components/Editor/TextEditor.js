"use client";
import { useState, useRef, useEffect } from "react";
import { cx } from "@/src/utils";

const TextEditor = ({ 
  value = "", 
  onChange, 
  placeholder = "Start writing your story...",
  className = "",
  autoFocus = false 
}) => {
  const [content, setContent] = useState(value);
  const editorRef = useRef(null);

  useEffect(() => {
    setContent(value);
  }, [value]);

  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus();
    }
  }, [autoFocus]);

  const handleInput = (e) => {
    const newContent = e.target.innerHTML;
    setContent(newContent);
    onChange?.(newContent);
  };

  const handleKeyDown = (e) => {
    // Handle Enter key for better formatting
    if (e.key === "Enter") {
      e.preventDefault();
      document.execCommand("insertHTML", false, "<br><br>");
    }
  };

  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  return (
    <div className={cx("w-full", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
        <button
          type="button"
          onClick={() => formatText("bold")}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Bold"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h4.5a3.5 3.5 0 001.852-6.47A3.5 3.5 0 009.5 3H5zm4.5 6a1.5 1.5 0 100-3H7v3h2.5zm0 2H7v3h2.5a1.5 1.5 0 100-3z" />
          </svg>
        </button>
        
        <button
          type="button"
          onClick={() => formatText("italic")}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Italic"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 3a1 1 0 000 2h1.5l-3 12H5a1 1 0 100 2h6a1 1 0 100-2h-1.5l3-12H14a1 1 0 100-2H8z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => formatText("underline")}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Underline"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 17h12v2H4v-2zm6-14a4 4 0 00-4 4v6a4 4 0 008 0V7a4 4 0 00-4-4z" />
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        <button
          type="button"
          onClick={() => formatText("formatBlock", "h1")}
          className="px-3 py-1 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Heading 1"
        >
          H1
        </button>

        <button
          type="button"
          onClick={() => formatText("formatBlock", "h2")}
          className="px-3 py-1 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Heading 2"
        >
          H2
        </button>

        <button
          type="button"
          onClick={() => formatText("formatBlock", "h3")}
          className="px-3 py-1 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Heading 3"
        >
          H3
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        <button
          type="button"
          onClick={() => formatText("insertUnorderedList")}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Bullet List"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => formatText("insertOrderedList")}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Numbered List"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
          </svg>
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className={cx(
          "min-h-[400px] p-6 border border-gray-200 dark:border-gray-700 rounded-b-lg",
          "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
          "prose prose-lg max-w-none dark:prose-invert",
          "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        )}
        dangerouslySetInnerHTML={{ __html: content }}
        data-placeholder={placeholder}
        style={{
          "&:empty:before": {
            content: "attr(data-placeholder)",
            color: "#9CA3AF",
            fontStyle: "italic",
          }
        }}
      />
    </div>
  );
};

export default TextEditor;