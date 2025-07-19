"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPost, updatePost } from "@/src/lib/actions/posts";
import { useUI } from "@/src/contexts/UIContext";
import AutoSaveEditor from "@/src/components/Editor/AutoSaveEditor";
import Button from "@/src/components/UI/Button";
import Input from "@/src/components/UI/Input";
import { cx } from "@/src/utils";
import Image from "next/image";

const WriteForm = ({ initialData = null, isEditing = false }) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || "");
  const [tags, setTags] = useState(initialData?.tags?.join(", ") || "");
  const [status, setStatus] = useState(initialData?.status || "draft");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const { showToast } = useUI();
  const router = useRouter();

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!content.trim()) {
      newErrors.content = "Content is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Show the first error as a toast
      const firstError = Object.values(errors)[0];
      showToast(firstError, "error");
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

      if (isEditing && initialData?.id) {
        // Update existing post
        await updatePost(initialData.id, formData);
        showToast("Post updated successfully!", "success");

        // Redirect based on status
        if (status === "published") {
          // If published, redirect to the post view
          router.push(`/posts/${initialData.slug}`);
        } else {
          // If draft, redirect to dashboard
          router.push("/dashboard");
        }
      } else {
        // Create new post
        await createPost(formData);
        showToast("Post created successfully!", "success");

        // The createPost function handles redirection based on status
        // If we're still here, it means there was an issue with redirection
        if (status === "published") {
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error(isEditing ? "Error updating post:" : "Error creating post:", error);
      showToast(error.message || (isEditing ? "Failed to update post" : "Failed to create post"), "error");
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
    // Validate required fields before publishing
    if (!title.trim()) {
      showToast("Title is required", "error");
      return;
    }

    if (!content.trim()) {
      showToast("Content is required", "error");
      return;
    }

    setStatus("published");
    setTimeout(() => {
      document.getElementById("submit-form").click();
    }, 0);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div>
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your story title..."
            className={`text-2xl font-bold border-none shadow-none p-0 focus:ring-0 ${errors.title ? 'border-red-500' : ''}`}
            required
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title}</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-4">
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cover Image
            </label>
            <div className="flex items-center gap-4">
              <Input
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
                type="url"
              />
              <span className="text-gray-500 dark:text-gray-400">or</span>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;

                  try {
                    // Create form data for upload
                    const formData = new FormData();
                    formData.append('file', file);

                    // Upload the file
                    const { uploadImage } = await import('@/src/lib/actions/uploads');
                    const response = await uploadImage(formData);

                    // Set the cover image URL
                    setCoverImage(response.url);
                  } catch (error) {
                    console.error('Error uploading cover image:', error);
                    showToast('Failed to upload cover image', 'error');
                  }
                }}
                className="block w-full text-sm text-gray-500 dark:text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded file:border-0
                  file:text-sm file:font-semibold
                  file:bg-accent file:text-white
                  hover:file:bg-accent/80"
              />
            </div>
          </div>

          {coverImage && (
            <div className="mt-4">
              <div className="relative w-full h-48 rounded-lg overflow-hidden">
                <Image
                  src={coverImage}
                  alt="Cover preview"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-sm border ${errors.content ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}`}>
        <AutoSaveEditor
          value={content}
          onChange={(newContent) => {
            setContent(newContent);
            if (newContent.trim() && errors.content) {
              setErrors({ ...errors, content: null });
            }
          }}
          onSave={async (content) => {
            try {
              // Save draft using server action
              const { saveDraft } = await import('@/src/lib/actions/drafts');
              await saveDraft({
                postId: initialData?.id || null,
                title,
                content,
                excerpt,
                coverImage,
                tags,
              });
              return true;
            } catch (error) {
              console.error('Error saving draft:', error);
              return false;
            }
          }}
          placeholder="Tell your story..."
          autoFocus
          autoSaveInterval={30000} // Save every 30 seconds
          postId={initialData?.id || null}
          postTitle={title}
          postExcerpt={excerpt}
          postCoverImage={coverImage}
          postTags={tags}
        />
        {errors.content && (
          <p className="mt-1 text-sm text-red-500 p-2">{errors.content}</p>
        )}
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