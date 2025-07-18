"use client";
import { cx } from "@/src/utils";

const PostContent = ({ content }) => {
  return (
    <div 
      className={cx(
        "prose prose-lg max-w-none dark:prose-invert",
        "prose-headings:text-dark dark:prose-headings:text-light",
        "prose-p:text-gray-700 dark:prose-p:text-gray-300",
        "prose-a:text-accent dark:prose-a:text-accentDark prose-a:no-underline hover:prose-a:underline",
        "prose-strong:text-dark dark:prose-strong:text-light",
        "prose-code:text-accent dark:prose-code:text-accentDark prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
        "prose-pre:bg-gray-900 dark:prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700",
        "prose-blockquote:border-l-accent dark:prose-blockquote:border-l-accentDark prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-gray-800 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r",
        "prose-ul:text-gray-700 dark:prose-ul:text-gray-300",
        "prose-ol:text-gray-700 dark:prose-ol:text-gray-300",
        "prose-li:text-gray-700 dark:prose-li:text-gray-300"
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default PostContent;