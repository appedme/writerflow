"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/src/components/UI/Button";
import { togglePostStatus, schedulePostPublishing } from "@/src/lib/actions/posts";
import { useUI } from "@/src/contexts/UIContext";

const PublishToggle = ({ post }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showScheduler, setShowScheduler] = useState(false);
    const [scheduledDate, setScheduledDate] = useState("");
    const router = useRouter();
    const { showToast } = useUI();

    const isPublished = post.status === "published";

    const handleToggleStatus = async () => {
        setIsLoading(true);
        try {
            const result = await togglePostStatus(post.id);
            showToast(
                result.published
                    ? "Post published successfully!"
                    : "Post unpublished successfully!",
                "success"
            );
            router.refresh();
        } catch (error) {
            console.error("Error toggling post status:", error);
            showToast(error.message || "Failed to update post status", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSchedulePublish = async (e) => {
        e.preventDefault();
        if (!scheduledDate) {
            showToast("Please select a date and time", "error");
            return;
        }

        setIsLoading(true);
        try {
            await schedulePostPublishing(post.id, scheduledDate);
            showToast("Post scheduled for publishing!", "success");
            setShowScheduler(false);
            router.refresh();
        } catch (error) {
            console.error("Error scheduling post:", error);
            showToast(error.message || "Failed to schedule post", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate minimum date-time for the scheduler (current time + 5 minutes)
    const getMinDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 5);
        return now.toISOString().slice(0, 16); // Format: YYYY-MM-DDThh:mm
    };

    return (
        <div className="relative">
            {post.scheduledPublishAt && !isPublished && (
                <div className="absolute -top-10 right-0 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    Scheduled: {new Date(post.scheduledPublishAt).toLocaleString()}
                </div>
            )}

            <div className="flex gap-2">
                <Button
                    variant={isPublished ? "danger" : "success"}
                    size="sm"
                    onClick={handleToggleStatus}
                    disabled={isLoading}
                    loading={isLoading && !showScheduler}
                >
                    {isPublished ? "Unpublish" : "Publish Now"}
                </Button>

                {!isPublished && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowScheduler(!showScheduler)}
                        disabled={isLoading}
                    >
                        Schedule
                    </Button>
                )}
            </div>

            {showScheduler && (
                <div className="absolute right-0 mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 w-72">
                    <form onSubmit={handleSchedulePublish} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Schedule Publication
                            </label>
                            <input
                                type="datetime-local"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                min={getMinDateTime()}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowScheduler(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                size="sm"
                                disabled={isLoading || !scheduledDate}
                                loading={isLoading}
                            >
                                Schedule
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default PublishToggle;