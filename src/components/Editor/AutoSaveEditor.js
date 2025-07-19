"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import TiptapEditor from './TiptapEditor';
import { useUI } from '@/src/contexts/UIContext';
import { cx } from '@/src/utils';
import { saveDraft, getDraftVersions } from '@/src/lib/actions/drafts';

const AutoSaveEditor = ({
    value = "",
    onChange,
    onSave,
    placeholder = "Start writing your story...",
    className = "",
    autoFocus = false,
    outputFormat = "html",
    inputFormat = "html",
    autoSaveInterval = 10000, // 10 seconds
    showAutoSaveIndicator = true,
    postId = null, // ID of the post being edited (null for new posts)
    postTitle = "", // Title of the post
    postExcerpt = "", // Excerpt of the post
    postCoverImage = "", // Cover image URL
    postTags = "", // Comma-separated tags
}) => {
    const [content, setContent] = useState(value);
    const [lastSavedContent, setLastSavedContent] = useState(value);
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [draftVersions, setDraftVersions] = useState([]);
    const [showVersionHistory, setShowVersionHistory] = useState(false);
    const [isLoadingVersions, setIsLoadingVersions] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [isRecovering, setIsRecovering] = useState(false);
    const { showToast, showModal, hideModal } = useUI();

    // Track content changes for debouncing
    const contentRef = useRef(content);
    const saveTimeoutRef = useRef(null);

    // Track if component is mounted
    const isMountedRef = useRef(true);

    // Handle content changes
    const handleChange = useCallback((newContent) => {
        setContent(newContent);
        contentRef.current = newContent;
        onChange?.(newContent);
        setHasUnsavedChanges(true);

        // Clear any existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set a new timeout for debounced saving
        saveTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
                saveContent(newContent);
            }
        }, 2000); // Debounce for 2 seconds
    }, [onChange]);

    // Save content
    const saveContent = useCallback(async (contentToSave = null) => {
        const currentContent = contentToSave || contentRef.current;
        if (!hasUnsavedChanges && currentContent === lastSavedContent) return;

        try {
            setIsSaving(true);

            // Call the save function provided by the parent component
            if (onSave) {
                await onSave(currentContent);
            }

            // Save to server if we have the draft actions available
            try {
                await saveDraft({
                    postId,
                    title: postTitle,
                    content: currentContent,
                    excerpt: postExcerpt,
                    coverImage: postCoverImage,
                    tags: postTags,
                });

                // Refresh draft versions after saving
                await loadDraftVersions();
            } catch (error) {
                console.error('Error saving draft to server:', error);
                // Fall back to local storage if server save fails
                saveDraftToLocalStorage(currentContent);
            }

            // Update last saved state
            setLastSavedContent(currentContent);
            setLastSavedAt(new Date());
            setHasUnsavedChanges(false);

            if (showAutoSaveIndicator) {
                showToast('Draft saved', 'success');
            }
        } catch (error) {
            console.error('Error saving content:', error);
            showToast('Failed to save draft', 'error');

            // Try to save to local storage as fallback
            saveDraftToLocalStorage(currentContent);
        } finally {
            if (isMountedRef.current) {
                setIsSaving(false);
            }
        }
    }, [hasUnsavedChanges, lastSavedContent, onSave, postId, postTitle, postExcerpt, postCoverImage, postTags, showAutoSaveIndicator, showToast]);

    // Save draft to localStorage as fallback
    const saveDraftToLocalStorage = useCallback((draftContent) => {
        try {
            const storageKey = postId ? `draft_${postId}` : 'draft_new_post';
            const newDraft = {
                content: draftContent,
                timestamp: new Date().toISOString(),
                id: `local_draft_${Date.now()}`,
                title: postTitle,
                excerpt: postExcerpt,
                coverImage: postCoverImage,
                tags: postTags,
            };

            // Get existing drafts
            const existingDraftsJson = localStorage.getItem(storageKey);
            let existingDrafts = [];

            if (existingDraftsJson) {
                try {
                    existingDrafts = JSON.parse(existingDraftsJson);
                    if (!Array.isArray(existingDrafts)) {
                        existingDrafts = [];
                    }
                } catch (e) {
                    console.error('Error parsing drafts from localStorage:', e);
                    existingDrafts = [];
                }
            }

            // Add new draft and keep only the last 10
            const updatedDrafts = [newDraft, ...existingDrafts].slice(0, 10);
            localStorage.setItem(storageKey, JSON.stringify(updatedDrafts));

            // Update state
            setDraftVersions(prev => {
                // Merge with any server drafts, ensuring no duplicates by ID
                const existingIds = new Set(prev.map(d => d.id));
                const localDrafts = updatedDrafts.filter(d => !existingIds.has(d.id));
                return [...localDrafts, ...prev].slice(0, 20);
            });

            setLastSavedAt(new Date());
            setLastSavedContent(draftContent);
            setHasUnsavedChanges(false);
        } catch (error) {
            console.error('Error saving draft to localStorage:', error);
        }
    }, [postId, postTitle, postExcerpt, postCoverImage, postTags]);

    // Load draft versions from server and localStorage
    const loadDraftVersions = useCallback(async () => {
        setIsLoadingVersions(true);

        try {
            // Try to load from server first
            let serverDrafts = [];
            try {
                serverDrafts = await getDraftVersions(postId);
            } catch (error) {
                console.error('Error loading drafts from server:', error);
            }

            // Then load from localStorage as fallback
            let localDrafts = [];
            try {
                const storageKey = postId ? `draft_${postId}` : 'draft_new_post';
                const localDraftsJson = localStorage.getItem(storageKey);

                if (localDraftsJson) {
                    localDrafts = JSON.parse(localDraftsJson);
                    if (!Array.isArray(localDrafts)) {
                        localDrafts = [];
                    }
                }
            } catch (error) {
                console.error('Error loading drafts from localStorage:', error);
            }

            // Combine drafts, ensuring no duplicates by timestamp
            const allDrafts = [...serverDrafts, ...localDrafts];

            // Sort by timestamp (newest first)
            allDrafts.sort((a, b) => {
                const dateA = new Date(a.createdAt || a.timestamp);
                const dateB = new Date(b.createdAt || b.timestamp);
                return dateB - dateA;
            });

            // Keep only the last 20 versions
            const limitedDrafts = allDrafts.slice(0, 20);

            setDraftVersions(limitedDrafts);
        } catch (error) {
            console.error('Error loading draft versions:', error);
        } finally {
            setIsLoadingVersions(false);
        }
    }, [postId]);

    // Auto-save on interval
    useEffect(() => {
        // Load draft versions when component mounts
        loadDraftVersions();

        // Set up auto-save interval
        const intervalId = setInterval(() => {
            if (hasUnsavedChanges) {
                saveContent();
            }
        }, autoSaveInterval);

        return () => {
            isMountedRef.current = false;
            clearInterval(intervalId);
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [autoSaveInterval, hasUnsavedChanges, saveContent, loadDraftVersions]);

    // Save on window unload if there are unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                // Save content before unload
                saveContent();

                // Show browser confirmation dialog
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges, saveContent]);

    // Recover from a specific draft version
    const recoverDraftVersion = useCallback((draft) => {
        setIsRecovering(true);
        try {
            const draftContent = draft.content;
            setContent(draftContent);
            onChange?.(draftContent);
            setSelectedVersion(null);
            showToast('Draft version recovered', 'success');
        } catch (error) {
            console.error('Error recovering draft version:', error);
            showToast('Failed to recover draft version', 'error');
        } finally {
            setIsRecovering(false);
            setShowVersionHistory(false);
        }
    }, [onChange, showToast]);

    // Format time for display
    const formatTime = (date) => {
        if (!date) return '';
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    // Show version history modal
    const openVersionHistory = useCallback(() => {
        loadDraftVersions().then(() => {
            setShowVersionHistory(true);
        });
    }, [loadDraftVersions]);

    // Render version history modal
    const renderVersionHistoryModal = () => {
        if (!showVersionHistory) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Draft Version History</h3>
                        <button
                            onClick={() => setShowVersionHistory(false)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="overflow-y-auto flex-1 p-4">
                        {isLoadingVersions ? (
                            <div className="flex justify-center items-center h-32">
                                <svg className="animate-spin h-8 w-8 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        ) : draftVersions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                No draft versions available
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {draftVersions.map((draft, index) => {
                                    const timestamp = draft.createdAt || draft.timestamp;
                                    const isSelected = selectedVersion === draft.id;

                                    return (
                                        <div
                                            key={draft.id || index}
                                            className={cx(
                                                "p-3 border rounded-lg cursor-pointer transition-colors",
                                                isSelected
                                                    ? "border-accent bg-accent/10"
                                                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                                            )}
                                            onClick={() => setSelectedVersion(draft.id)}
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="font-medium">
                                                    {index === 0 ? 'Latest version' : `Version ${draftVersions.length - index}`}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {formatTime(new Date(timestamp))}
                                                </div>
                                            </div>

                                            <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                                {draft.content ? (
                                                    <div dangerouslySetInnerHTML={{
                                                        __html: draft.content.substring(0, 150) + (draft.content.length > 150 ? '...' : '')
                                                    }} />
                                                ) : (
                                                    <span className="italic text-gray-400">No content</span>
                                                )}
                                            </div>

                                            {isSelected && (
                                                <div className="mt-3 flex justify-end">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            recoverDraftVersion(draft);
                                                        }}
                                                        disabled={isRecovering}
                                                        className={cx(
                                                            "px-3 py-1 text-sm rounded-md",
                                                            "bg-accent text-white hover:bg-accent/80 transition-colors",
                                                            isRecovering && "opacity-50 cursor-not-allowed"
                                                        )}
                                                    >
                                                        {isRecovering ? 'Recovering...' : 'Recover this version'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                        <button
                            onClick={() => setShowVersionHistory(false)}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={cx("w-full", className)}>
            <TiptapEditor
                value={content}
                onChange={handleChange}
                placeholder={placeholder}
                autoFocus={autoFocus}
                outputFormat={outputFormat}
                inputFormat={inputFormat}
            />

            {showAutoSaveIndicator && (
                <div className="flex items-center justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                        {isSaving ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Saving...</span>
                            </>
                        ) : lastSavedAt ? (
                            <>
                                <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                <span>Last saved at {formatTime(lastSavedAt)}</span>
                            </>
                        ) : null}
                    </div>

                    <div className="flex items-center space-x-4">
                        <button
                            type="button"
                            onClick={openVersionHistory}
                            className="text-accent hover:text-accent/80 transition-colors flex items-center"
                        >
                            <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Version history</span>
                        </button>

                        {draftVersions.length > 0 && (
                            <button
                                type="button"
                                onClick={() => recoverDraftVersion(draftVersions[0])}
                                className="text-accent hover:text-accent/80 transition-colors"
                            >
                                Recover latest draft
                            </button>
                        )}
                    </div>
                </div>
            )}

            {renderVersionHistoryModal()}
        </div>
    );
};

export default AutoSaveEditor;