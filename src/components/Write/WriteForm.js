"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "@/src/lib/actions/posts";
import { useUI } from "@/src/contexts/UIContext";
import TextEditor from "@/src/components/Editor/TextEditor";
import Button from "@/src/components/UI/Button";
import Input from "@/src/components/UI/Input";
import { cx } from "@/src/utils";

const WriteForm = ({ initialData = null }) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || "");
  const [tags, setTags] = useState(initialData?.tags?.join(", ") || "");
  const [status, setStatus] = useState(initialData?.status || "draft");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { showToast } = useUI();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      showToast("Title and content are required", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("excerpt", excerpt);
      formData.append("coverImage", coverImage);
      formData.append("tags", tags);
      formData.append("status", status);

      await createPost(formData);
      showToast("Post created successfully!", "success");
    } catch (error) {
      console.error("Error creating post:", error);
      showToast(error.message || "Failed to create post", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    setStatus("draft");
    setTimeout(() => {
      document.getElementById("submit-form").click();
    }, 0);
  };

  const handlePublish = () => {
    setStatus("published");
    setTimeout(() => {
      document.getElementById("submit-form").click();
    }, 0);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter your story title..."
          className="text-2xl font-bold border-none shadow-none p-0 focus:ring-0"
          required
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <Input
          label="Cover Image URL (optional)"
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
          placeholder="https://example.com/image.jpg"
          type="url"
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <TextEditor
          value={content}
          onChange={setContent}
          placeholder="Tell your story..."
          autoFocus
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Excerpt (optional)
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Brief description of your story..."
            rows={4}
            className={cx(
              "w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
              "dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-500"
            )}
          />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <Input
            label="Tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="technology, programming, web development"
          />
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {content.trim().split(/\s+/).length} words
        </div>
        
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            loading={isSubmitting && status === "draft"}
          >
            Save Draft
          </Button>
          
          <Button
            type="button"
            variant="primary"
            onClick={handlePublish}
            disabled={isSubmitting || !title.trim() || !content.trim()}
            loading={isSubmitting && status === "published"}
          >
            Publish
          </Button>
        </div>
      </div>

      <button
        id="submit-form"
        type="submit"
        className="hidden"
        disabled={isSubmitting}
      />
    </form>
  );
};

export default WriteForm;