"use client";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight';
import CodeBlock from './CodeBlock';
import { useState, useEffect, useRef } from 'react';
import { cx } from "@/src/utils";
import './TiptapEditor.css';
// Import serialization utilities
import { htmlToJson, jsonToHtml, htmlToMarkdown, markdownToHtml } from './EditorUtils';
const MenuBar = ({ editor }) => {
  const imageInputRef = useRef(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showEmbedInput, setShowEmbedInput] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');
  const [showCodeLanguageSelect, setShowCodeLanguageSelect] = useState(false);

  // Common programming languages for syntax highlighting
  const codeLanguages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'c', label: 'C' },
    { value: 'cpp', label: 'C++' },
    { value: 'csharp', label: 'C#' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'swift', label: 'Swift' },
    { value: 'bash', label: 'Bash' },
    { value: 'sql', label: 'SQL' },
    { value: 'json', label: 'JSON' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'yaml', label: 'YAML' },
    { value: 'plaintext', label: 'Plain Text' },
  ];

  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt('Enter the image URL');

    if (url) {
      editor.chain().focus().setImage({
        src: url,
        alt: 'Image',
        width: null,
        height: null,
        position: 'center'
      }).run();
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // Show loading indicator
      const loadingId = Date.now();
      editor.chain().focus().setImage({
        src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48c3R5bGU+QGtleWZyYW1lcyBzcGluIHt0byB7dHJhbnNmb3JtOiByb3RhdGUoMzYwZGVnKX19IHN2ZyB7IGFuaW1hdGlvbjogc3BpbiAxcyBsaW5lYXIgaW5maW5pdGU7IH08L3N0eWxlPjxwYXRoIGQ9Ik0xMiAyMmMtNS41MjMgMC0xMC00LjQ3Ny0xMC0xMHM0LjQ3Ny0xMCAxMC0xMCAxMCA0LjQ3NyAxMCAxMC00LjQ3NyAxMC0xMCAxMHptMC0xOGMtNC40MTEgMC04IDMuNTg5LTggOHMzLjU4OSA4IDggOCA4LTMuNTg5IDgtOC0zLjU4OS04LTgtOHoiIGZpbGw9IiM5OTkiLz48cGF0aCBkPSJNMTIgMjJjLTUuNTIzIDAtMTAtNC40NzctMTAtMTBoNGMwIDMuMzE0IDIuNjg2IDYgNiA2czYtMi42ODYgNi02aDRjMCA1LjUyMy00LjQ3NyAxMC0xMCAxMHoiIGZpbGw9IiM1NTUiLz48L3N2Zz4=',
        alt: 'Uploading...',
        'data-loading-id': loadingId
      }).run();

      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);

      // Upload the file
      let response;
      try {
        // Try to use the server action if available
        const { uploadImage } = await import('@/src/lib/actions/uploads');
        response = await uploadImage(formData);
      } catch (error) {
        // Fallback to client-side handling if server action fails or is not available
        console.warn('Server-side image upload failed, falling back to client-side:', error);

        // Use FileReader as fallback
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            // Find and replace the loading image
            const loadingNode = editor.state.doc.descendants((node) => {
              return node.type.name === 'image' && node.attrs['data-loading-id'] === loadingId;
            });

            if (loadingNode.length > 0) {
              editor.chain().focus().setImage({
                src: e.target.result,
                alt: file.name,
                width: null,
                height: null,
                position: 'center'
              }).run();
            }
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }

      // Find and replace the loading image with the uploaded image
      const loadingNode = editor.state.doc.descendants((node) => {
        return node.type.name === 'image' && node.attrs['data-loading-id'] === loadingId;
      });

      if (loadingNode.length > 0) {
        editor.chain().focus().setImage({
          src: response.url,
          alt: file.name,
          width: null,
          height: null,
          position: 'center'
        }).run();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      // Reset the input
      event.target.value = '';
    }
  };

  const setLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  const embedMedia = () => {
    if (!embedUrl) return;

    try {
      const url = new URL(embedUrl);
      let embedHtml = '';

      // YouTube
      if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
        let videoId = '';

        if (url.hostname.includes('youtube.com')) {
          videoId = url.searchParams.get('v');
        } else if (url.hostname.includes('youtu.be')) {
          videoId = url.pathname.substring(1);
        }

        if (videoId) {
          embedHtml = `<div class="media-embed youtube-embed">
            <iframe 
              src="https://www.youtube.com/embed/${videoId}" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen
            ></iframe>
          </div>`;
        }
      }
      // Vimeo
      else if (url.hostname.includes('vimeo.com')) {
        const videoId = url.pathname.substring(1);
        if (videoId) {
          embedHtml = `<div class="media-embed vimeo-embed">
            <iframe 
              src="https://player.vimeo.com/video/${videoId}" 
              frameborder="0" 
              allow="autoplay; fullscreen; picture-in-picture" 
              allowfullscreen
            ></iframe>
          </div>`;
        }
      }
      // Twitter
      else if (url.hostname.includes('twitter.com') || url.hostname.includes('x.com')) {
        embedHtml = `<div class="media-embed twitter-embed">
          <blockquote class="twitter-tweet">
            <a href="${embedUrl}"></a>
          </blockquote>
          <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
        </div>`;
      }
      // Instagram
      else if (url.hostname.includes('instagram.com')) {
        embedHtml = `<div class="media-embed instagram-embed">
          <blockquote class="instagram-media" data-instgrm-permalink="${embedUrl}">
            <a href="${embedUrl}"></a>
          </blockquote>
          <script async src="//www.instagram.com/embed.js"></script>
        </div>`;
      }
      // SoundCloud
      else if (url.hostname.includes('soundcloud.com')) {
        embedHtml = `<div class="media-embed soundcloud-embed">
          <iframe 
            width="100%" 
            height="166" 
            scrolling="no" 
            frameborder="no" 
            src="https://w.soundcloud.com/player/?url=${encodeURIComponent(embedUrl)}"
          ></iframe>
        </div>`;
      }
      // Spotify
      else if (url.hostname.includes('spotify.com')) {
        // Extract Spotify URI
        const parts = url.pathname.split('/');
        if (parts.length >= 3) {
          const type = parts[1]; // track, album, playlist
          const id = parts[2];

          embedHtml = `<div class="media-embed spotify-embed">
            <iframe 
              src="https://open.spotify.com/embed/${type}/${id}" 
              width="100%" 
              height="380" 
              frameborder="0" 
              allowtransparency="true" 
              allow="encrypted-media"
            ></iframe>
          </div>`;
        }
      }
      // Generic iframe for other URLs
      else {
        embedHtml = `<div class="media-embed generic-embed">
          <iframe 
            src="${embedUrl}" 
            frameborder="0" 
            allowfullscreen
          ></iframe>
        </div>`;
      }

      if (embedHtml) {
        editor.chain().focus().insertContent(embedHtml).run();
        setEmbedUrl('');
        setShowEmbedInput(false);
      } else {
        alert('Could not create embed for this URL. Please check the URL and try again.');
      }
    } catch (error) {
      console.error('Error creating media embed:', error);
      alert('Invalid URL. Please enter a valid URL.');
    }
  };

  const addCodeBlock = (language = 'plaintext') => {
    editor.chain().focus().toggleCodeBlock({ language }).run();
    setShowCodeLanguageSelect(false);
  };

  const setCodeLanguage = (language) => {
    if (editor.isActive('codeBlock')) {
      editor.chain().focus().updateAttributes('codeBlock', { language }).run();
    } else {
      editor.chain().focus().toggleCodeBlock({ language }).run();
    }
    setShowCodeLanguageSelect(false);
  };
  eturn(
    <div className="flex flex-col border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
      <div className="flex flex-wrap items-center gap-2 p-3">
        {/* Text formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cx(
            "p-2 rounded transition-colors",
            editor.isActive('bold')
              ? "bg-gray-200 dark:bg-gray-700"
              : "hover:bg-gray-200 dark:hover:bg-gray-700"
          )}
          title="Bold"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h4.5a3.5 3.5 0 001.852-6.47A3.5 3.5 0 009.5 3H5zm4.5 6a1.5 1.5 0 100-3H7v3h2.5zm0 2H7v3h2.5a1.5 1.5 0 100-3z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cx(
            "p-2 rounded transition-colors",
            editor.isActive('italic')
              ? "bg-gray-200 dark:bg-gray-700"
              : "hover:bg-gray-200 dark:hover:bg-gray-700"
          )}
          title="Italic"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6 3v2h4.5l-3 12H3v2h10v-2H8.5l3-12H16V3z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cx(
            "p-2 rounded transition-colors",
            editor.isActive('strike')
              ? "bg-gray-200 dark:bg-gray-700"
              : "hover:bg-gray-200 dark:hover:bg-gray-700"
          )}
          title="Strikethrough"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6 10h8M5 7.5C5 6.672 5.672 6 6.5 6h7c.828 0 1.5.672 1.5 1.5 0 .828-.672 1.5-1.5 1.5H6.5C5.672 9 5 8.328 5 7.5zm0 5c0-.828.672-1.5 1.5-1.5h7c.828 0 1.5.672 1.5 1.5 0 .828-.672 1.5-1.5 1.5h-7c-.828 0-1.5-.672-1.5-1.5z" strokeWidth="1.5" stroke="currentColor" fill="none" />
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

        {/* Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cx(
            "p-2 rounded transition-colors",
            editor.isActive('heading', { level: 1 })
              ? "bg-gray-200 dark:bg-gray-700"
              : "hover:bg-gray-200 dark:hover:bg-gray-700"
          )}
          title="Heading 1"
        >
          <span className="font-bold">H1</span>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cx(
            "p-2 rounded transition-colors",
            editor.isActive('heading', { level: 2 })
              ? "bg-gray-200 dark:bg-gray-700"
              : "hover:bg-gray-200 dark:hover:bg-gray-700"
          )}
          title="Heading 2"
        >
          <span className="font-bold">H2</span>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cx(
            "p-2 rounded transition-colors",
            editor.isActive('heading', { level: 3 })
              ? "bg-gray-200 dark:bg-gray-700"
              : "hover:bg-gray-200 dark:hover:bg-gray-700"
          )}
          title="Heading 3"
        >
          <span className="font-bold">H3</span>
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cx(
            "p-2 rounded transition-colors",
            editor.isActive('bulletList')
              ? "bg-gray-200 dark:bg-gray-700"
              : "hover:bg-gray-200 dark:hover:bg-gray-700"
          )}
          title="Bullet List"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cx(
            "p-2 rounded transition-colors",
            editor.isActive('orderedList')
              ? "bg-gray-200 dark:bg-gray-700"
              : "hover:bg-gray-200 dark:hover:bg-gray-700"
          )}
          title="Ordered List"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h10M7 16h10M3 8h.01M3 12h.01M3 16h.01" />
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

        {/* Block quotes and code */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cx(
            "p-2 rounded transition-colors",
            editor.isActive('blockquote')
              ? "bg-gray-200 dark:bg-gray-700"
              : "hover:bg-gray-200 dark:hover:bg-gray-700"
          )}
          title="Blockquote"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10.5h1.5a2 2 0 100-4H8v9m8-9h-1.5a2 2 0 00-2 2v1a2 2 0 002 2H16v-5" />
          </svg>
        </button>

        {/* Code Block Button */}
        <button
          type="button"
          onClick={() => setShowCodeLanguageSelect(!showCodeLanguageSelect)}
          className={cx(
            "p-2 rounded transition-colors",
            editor.isActive('codeBlock') || showCodeLanguageSelect
              ? "bg-gray-200 dark:bg-gray-700"
              : "hover:bg-gray-200 dark:hover:bg-gray-700"
          )}
          title="Code Block"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
        {/* Link */}
        <button
          type="button"
          onClick={() => setShowLinkInput(!showLinkInput)}
          className={cx(
            "p-2 rounded transition-colors",
            editor.isActive('link') || showLinkInput
              ? "bg-gray-200 dark:bg-gray-700"
              : "hover:bg-gray-200 dark:hover:bg-gray-700"
          )}
          title="Link"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>

        {/* Image */}
        <div className="relative">
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className={cx(
              "p-2 rounded transition-colors",
              "hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
            title="Upload Image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </button>
          <button
            type="button"
            onClick={addImage}
            className={cx(
              "p-2 rounded transition-colors ml-1",
              "hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
            title="Insert Image from URL"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
        </div>

        {/* Media Embed */}
        <button
          type="button"
          onClick={() => setShowEmbedInput(!showEmbedInput)}
          className={cx(
            "p-2 rounded transition-colors",
            showEmbedInput
              ? "bg-gray-200 dark:bg-gray-700"
              : "hover:bg-gray-200 dark:hover:bg-gray-700"
          )}
          title="Embed Media"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
      {/* Link input */}
      {showLinkInput && (
        <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Enter URL"
            className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            onKeyDown={(e) => e.key === 'Enter' && setLink()}
          />
          <button
            type="button"
            onClick={setLink}
            className="px-3 py-1 bg-accent text-white rounded hover:bg-accent/80 transition-colors"
          >
            Add
          </button>
        </div>
      )}

      {/* Embed input */}
      {showEmbedInput && (
        <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <input
            type="url"
            value={embedUrl}
            onChange={(e) => setEmbedUrl(e.target.value)}
            placeholder="Enter media URL (YouTube, Vimeo, etc.)"
            className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            onKeyDown={(e) => e.key === 'Enter' && embedMedia()}
          />
          <button
            type="button"
            onClick={embedMedia}
            className="px-3 py-1 bg-accent text-white rounded hover:bg-accent/80 transition-colors"
          >
            Embed
          </button>
        </div>
      )}

      {/* Code language select */}
      {showCodeLanguageSelect && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-700 dark:text-gray-300 mr-2">Select language:</div>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            <div className="grid grid-cols-3 gap-2 w-full">
              {codeLanguages.map((lang) => (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => setCodeLanguage(lang.value)}
                  className={cx(
                    "px-2 py-1 text-xs rounded transition-colors",
                    editor.isActive('codeBlock', { language: lang.value })
                      ? "bg-accent text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  )}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
          <div className="w-full mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setShowCodeLanguageSelect(false)}
              className="px-3 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};// Updated TiptapEditor component with enhanced serialization support
const TiptapEditor = ({
  value = "",
  onChange,
  placeholder = "Start writing your story...",
  className = "",
  autoFocus = false,
  outputFormat = "html", // Can be "html", "json", or "markdown"
  inputFormat = "html", // Can be "html", "json", or "markdown"
  showFormatTools = false, // Whether to show format conversion tools
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [initialContent, setInitialContent] = useState(value);
  const [editorContent, setEditorContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Convert input value to HTML based on inputFormat
  useEffect(() => {
    const convertInput = async () => {
      if (!value) {
        setInitialContent('');
        return;
      }

      setIsProcessing(true);
      try {
        let html = value;

        if (inputFormat === 'json') {
          html = jsonToHtml(typeof value === 'string' ? JSON.parse(value) : value);
        } else if (inputFormat === 'markdown') {
          html = await markdownToHtml(value);
        }

        setInitialContent(html);
      } catch (error) {
        console.error('Error converting input format:', error);
        setInitialContent(value);
      } finally {
        setIsProcessing(false);
      }
    };

    convertInput();
  }, [value, inputFormat]);

  // Initialize the editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable the default code block to use our custom one
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-accent underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
        allowBase64: true,
        inline: false,
        draggable: true,
        // Add additional attributes for positioning and sizing
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: null,
              renderHTML: (attributes) => {
                if (!attributes.width) {
                  return {};
                }
                return { width: attributes.width };
              },
            },
            height: {
              default: null,
              renderHTML: (attributes) => {
                if (!attributes.height) {
                  return {};
                }
                return { height: attributes.height };
              },
            },
            position: {
              default: 'center',
              renderHTML: (attributes) => {
                const position = attributes.position || 'center';
                let style = '';

                switch (position) {
                  case 'left':
                    style = 'float: left; margin-right: 1rem; margin-bottom: 0.5rem;';
                    break;
                  case 'right':
                    style = 'float: right; margin-left: 1rem; margin-bottom: 0.5rem;';
                    break;
                  case 'center':
                  default:
                    style = 'display: block; margin-left: auto; margin-right: auto;';
                    break;
                }

                return { style };
              },
            },
            'data-loading-id': {
              default: null,
              renderHTML: (attributes) => {
                if (!attributes['data-loading-id']) {
                  return {};
                }
                return { 'data-loading-id': attributes['data-loading-id'] };
              },
            },
          };
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'code-block',
        },
        languageClassPrefix: 'language-',
        renderHTMLAttributes: {
          'data-language': (attributes) => attributes.language || 'plaintext',
        },
        addNodeView() {
          return ({ node, editor, getPos, HTMLAttributes, decorations, extension }) => {
            return {
              dom: document.createElement('div'),
              contentDOM: document.createElement('pre'),
              update: (updatedNode) => {
                if (updatedNode.type !== extension.type) {
                  return false;
                }

                // Add language label
                const languageLabel = document.createElement('div');
                languageLabel.className = 'code-block-language';
                languageLabel.textContent = updatedNode.attrs.language || 'plaintext';

                return true;
              },
            };
          };
        },
      }),
    ],
    content: initialContent,
    autofocus: autoFocus,
    onUpdate: async ({ editor }) => {
      const html = editor.getHTML();
      setEditorContent(html);

      try {
        // Convert output based on outputFormat
        if (outputFormat === 'html') {
          onChange?.(html);
        } else if (outputFormat === 'json') {
          const json = htmlToJson(html);
          onChange?.(typeof value === 'string' ? JSON.stringify(json) : json);
        } else if (outputFormat === 'markdown') {
          const markdown = htmlToMarkdown(html);
          onChange?.(markdown);
        }
      } catch (error) {
        console.error('Error converting output format:', error);
        // Fallback to HTML if conversion fails
        onChange?.(html);
      }
    },
  });

  // Handle external value changes
  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  // Handle format conversion
  const handleFormatImport = (content) => {
    if (editor) {
      editor.commands.setContent(content);
    }
  };

  // Handle client-side rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  // Import FormatConverter component dynamically to avoid SSR issues
  const FormatConverter = showFormatTools ? require('./FormatConverter').default : null;

  return (
    <div className={cx("w-full", className)}>
      <MenuBar editor={editor} />
      <EditorContent
        editor={editor}
        className={cx(
          "min-h-[400px] p-6 border border-gray-200 dark:border-gray-700",
          !showFormatTools && "rounded-b-lg",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent",
          "prose prose-lg max-w-none dark:prose-invert",
          "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        )}
      />

      {showFormatTools && FormatConverter && (
        <div className="border border-t-0 border-gray-200 dark:border-gray-700 rounded-b-lg p-4 bg-gray-50 dark:bg-gray-800">
          <FormatConverter
            content={editorContent}
            currentFormat="html"
            onImport={handleFormatImport}
          />
        </div>
      )}

      {isProcessing && (
        <div className="absolute inset-0 bg-white bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center z-10">
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing content...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TiptapEditor;