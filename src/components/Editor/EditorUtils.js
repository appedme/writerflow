"use client";
import { generateHTML } from '@tiptap/html';
import { generateJSON } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight';
import TurndownService from 'turndown';

// Extensions for serialization/deserialization
const extensions = [
    StarterKit.configure({
        codeBlock: false,
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
    }),
];

/**
 * Convert HTML content to JSON format for storage
 * @param {string} html - HTML content from the editor
 * @returns {Object} - JSON representation of the content
 */
export const htmlToJson = (html) => {
    if (!html) return {};

    try {
        const json = generateJSON(html, extensions);

        // Add metadata for storage
        return {
            ...json,
            meta: {
                version: '1.0',
                timestamp: new Date().toISOString(),
                wordCount: getWordCount(html),
                readingTime: getReadingTime(html),
            }
        };
    } catch (error) {
        console.error('Error converting HTML to JSON:', error);
        return {};
    }
};

/**
 * Convert JSON content to HTML for display in the editor
 * @param {Object} json - JSON representation of the content
 * @returns {string} - HTML content
 */
export const jsonToHtml = (json) => {
    if (!json || Object.keys(json).length === 0) return '';

    try {
        // If the JSON has our metadata wrapper, extract just the document part
        const documentJson = json.type ? json : (json.doc || json);
        return generateHTML(documentJson, extensions);
    } catch (error) {
        console.error('Error converting JSON to HTML:', error);
        return '';
    }
};

/**
 * Convert HTML content to Markdown
 * @param {string} html - HTML content from the editor
 * @returns {string} - Markdown content
 */
export const htmlToMarkdown = (html) => {
    if (!html) return '';

    try {
        const turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            emDelimiter: '*',
        });

        // Custom rules for code blocks with language
        turndownService.addRule('codeBlocks', {
            filter: (node) => {
                return (
                    node.nodeName === 'PRE' &&
                    node.firstChild &&
                    node.firstChild.nodeName === 'CODE'
                );
            },
            replacement: (content, node) => {
                // Try to get language from data-language attribute first
                let language = '';

                if (node.hasAttribute('data-language')) {
                    language = node.getAttribute('data-language');
                } else if (node.firstChild && node.firstChild.className) {
                    // Try to extract from class name (language-xxx)
                    const match = node.firstChild.className.match(/language-(\w+)/);
                    if (match) {
                        language = match[1];
                    }
                }

                // Don't include "plaintext" in the markdown
                if (language === 'plaintext') {
                    language = '';
                }

                return `\n\`\`\`${language}\n${content}\n\`\`\`\n`;
            },
        });

        // Custom rules for images with position and size attributes
        turndownService.addRule('images', {
            filter: 'img',
            replacement: (content, node) => {
                const alt = node.getAttribute('alt') || '';
                const src = node.getAttribute('src') || '';
                const width = node.getAttribute('width');
                const height = node.getAttribute('height');

                // Basic markdown image
                let markdown = `![${alt}](${src})`;

                // Add custom attributes if present (using HTML comment syntax for metadata)
                const attributes = [];
                if (width) attributes.push(`width="${width}"`);
                if (height) attributes.push(`height="${height}"`);

                // Get position from style attribute if present
                const style = node.getAttribute('style') || '';
                let position = '';
                if (style.includes('float: left')) {
                    position = 'left';
                } else if (style.includes('float: right')) {
                    position = 'right';
                } else if (style.includes('margin-left: auto') && style.includes('margin-right: auto')) {
                    position = 'center';
                }

                if (position) attributes.push(`position="${position}"`);

                // Add attributes as HTML comment if any exist
                if (attributes.length > 0) {
                    markdown += ` <!-- ${attributes.join(' ')} -->`;
                }

                return markdown;
            },
        });

        // Custom rule for links
        turndownService.addRule('links', {
            filter: (node) => {
                return node.nodeName === 'A' && node.getAttribute('href');
            },
            replacement: (content, node) => {
                const href = node.getAttribute('href');
                const title = node.getAttribute('title') || '';

                if (title) {
                    return `[${content}](${href} "${title}")`;
                }
                return `[${content}](${href})`;
            }
        });

        // Handle media embeds
        turndownService.addRule('mediaEmbeds', {
            filter: (node) => {
                return node.classList && node.classList.contains('media-embed');
            },
            replacement: (content, node) => {
                // Try to extract the URL from iframe src or anchor href
                let url = '';
                const iframe = node.querySelector('iframe');
                if (iframe && iframe.getAttribute('src')) {
                    url = iframe.getAttribute('src');
                }

                const anchor = node.querySelector('a');
                if (!url && anchor && anchor.getAttribute('href')) {
                    url = anchor.getAttribute('href');
                }

                if (url) {
                    // Determine the type of embed
                    let embedType = 'generic';
                    if (node.classList.contains('youtube-embed')) embedType = 'youtube';
                    else if (node.classList.contains('vimeo-embed')) embedType = 'vimeo';
                    else if (node.classList.contains('twitter-embed')) embedType = 'twitter';
                    else if (node.classList.contains('instagram-embed')) embedType = 'instagram';

                    // Return a special markdown syntax for embeds
                    return `\n\n@[${embedType}](${url})\n\n`;
                }

                // If we can't determine the URL, just return the original HTML
                return `\n\n<div class="media-embed">${node.innerHTML}</div>\n\n`;
            }
        });

        return turndownService.turndown(html);
    } catch (error) {
        console.error('Error converting HTML to Markdown:', error);
        return '';
    }
};

/**
 * Convert Markdown content to HTML
 * @param {string} markdown - Markdown content
 * @returns {Promise<string>} - HTML content
 */
export const markdownToHtml = async (markdown) => {
    if (!markdown) return '';

    try {
        // We'll use a dynamic import for the markdown parser to avoid SSR issues
        const { unified } = await import('unified');
        const { default: remarkParse } = await import('remark-parse');
        const { default: remarkRehype } = await import('remark-rehype');
        const { default: rehypeStringify } = await import('rehype-stringify');
        const { default: remarkGfm } = await import('remark-gfm');

        // Process custom embed syntax before parsing
        const processedMarkdown = processCustomEmbeds(markdown);

        // Process the markdown
        const result = await unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkRehype, { allowDangerousHtml: true }) // Allow HTML in markdown
            .use(rehypeStringify, { allowDangerousHtml: true })
            .process(processedMarkdown);

        // Process image metadata comments
        let html = result.toString();
        html = processImageMetadata(html);

        return html;
    } catch (error) {
        console.error('Error converting Markdown to HTML:', error);
        return '';
    }
};

/**
 * Process custom embed syntax in markdown
 * @param {string} markdown - Markdown content
 * @returns {string} - Processed markdown
 */
const processCustomEmbeds = (markdown) => {
    // Match @[type](url) syntax
    const embedRegex = /@\[(youtube|vimeo|twitter|instagram|generic)\]\(([^)]+)\)/g;

    return markdown.replace(embedRegex, (match, type, url) => {
        switch (type) {
            case 'youtube':
                // Extract video ID
                let videoId = '';
                try {
                    const urlObj = new URL(url);
                    if (urlObj.hostname.includes('youtube.com')) {
                        videoId = new URLSearchParams(urlObj.search).get('v');
                    } else if (urlObj.hostname.includes('youtu.be')) {
                        videoId = urlObj.pathname.substring(1);
                    }
                } catch (e) {
                    // If URL parsing fails, try to extract ID directly
                    const idMatch = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
                    if (idMatch) videoId = idMatch[1];
                }

                if (videoId) {
                    return `<div class="media-embed youtube-embed">
                        <iframe 
                            src="https://www.youtube.com/embed/${videoId}" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen
                        ></iframe>
                    </div>`;
                }
                break;

            case 'vimeo':
                // Extract video ID
                const vimeoId = url.split('/').pop();
                if (vimeoId) {
                    return `<div class="media-embed vimeo-embed">
                        <iframe 
                            src="https://player.vimeo.com/video/${vimeoId}" 
                            frameborder="0" 
                            allow="autoplay; fullscreen; picture-in-picture" 
                            allowfullscreen
                        ></iframe>
                    </div>`;
                }
                break;

            case 'twitter':
                return `<div class="media-embed twitter-embed">
                    <blockquote class="twitter-tweet">
                        <a href="${url}"></a>
                    </blockquote>
                    <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
                </div>`;

            case 'instagram':
                return `<div class="media-embed instagram-embed">
                    <blockquote class="instagram-media" data-instgrm-permalink="${url}">
                        <a href="${url}"></a>
                    </blockquote>
                    <script async src="//www.instagram.com/embed.js"></script>
                </div>`;

            default:
                return `<div class="media-embed generic-embed">
                    <iframe 
                        src="${url}" 
                        frameborder="0" 
                        allowfullscreen
                    ></iframe>
                </div>`;
        }

        // Return original if processing failed
        return match;
    });
};

/**
 * Process image metadata comments in HTML
 * @param {string} html - HTML content
 * @returns {string} - Processed HTML
 */
const processImageMetadata = (html) => {
    // Match image tags followed by HTML comments with metadata
    const metadataRegex = /<img([^>]*)>(\s*<!--\s*([^>]*)\s*-->)/g;

    return html.replace(metadataRegex, (match, imgAttrs, comment, metadata) => {
        // Parse attributes from the comment
        const attributes = {};
        const attrRegex = /(\w+)="([^"]*)"/g;
        let attrMatch;

        while ((attrMatch = attrRegex.exec(metadata)) !== null) {
            attributes[attrMatch[1]] = attrMatch[2];
        }

        // Build new image tag with extracted attributes
        let newImgTag = `<img${imgAttrs}`;

        if (attributes.width) newImgTag += ` width="${attributes.width}"`;
        if (attributes.height) newImgTag += ` height="${attributes.height}"`;

        if (attributes.position) {
            let style = '';
            switch (attributes.position) {
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

            // Check if there's already a style attribute
            if (imgAttrs.includes('style="')) {
                newImgTag = newImgTag.replace(/style="([^"]*)"/, `style="$1; ${style}"`);
            } else {
                newImgTag += ` style="${style}"`;
            }
        }

        return `${newImgTag}>`;
    });
};

/**
 * Convert between different formats
 * @param {string} content - Content to convert
 * @param {string} fromFormat - Source format ('html', 'json', 'markdown')
 * @param {string} toFormat - Target format ('html', 'json', 'markdown')
 * @returns {Promise<string|Object>} - Converted content
 */
export const convertFormat = async (content, fromFormat, toFormat) => {
    if (!content) return fromFormat === 'json' ? {} : '';
    if (fromFormat === toFormat) return content;

    try {
        let intermediateHtml = '';

        // First convert to HTML as intermediate format
        switch (fromFormat) {
            case 'html':
                intermediateHtml = content;
                break;
            case 'json':
                intermediateHtml = jsonToHtml(typeof content === 'string' ? JSON.parse(content) : content);
                break;
            case 'markdown':
                intermediateHtml = await markdownToHtml(content);
                break;
            default:
                throw new Error(`Unsupported source format: ${fromFormat}`);
        }

        // Then convert from HTML to target format
        switch (toFormat) {
            case 'html':
                return intermediateHtml;
            case 'json':
                return htmlToJson(intermediateHtml);
            case 'markdown':
                return htmlToMarkdown(intermediateHtml);
            default:
                throw new Error(`Unsupported target format: ${toFormat}`);
        }
    } catch (error) {
        console.error(`Error converting from ${fromFormat} to ${toFormat}:`, error);
        return fromFormat === 'json' ? {} : '';
    }
};

/**
 * Get word count from HTML content
 * @param {string} html - HTML content from the editor
 * @returns {number} - Word count
 */
export const getWordCount = (html) => {
    if (!html) return 0;

    // Create a temporary element to parse the HTML
    const tempElement = document.createElement('div');
    tempElement.innerHTML = html;

    // Get the text content and count words
    const text = tempElement.textContent || '';
    return text.trim().split(/\s+/).filter(Boolean).length;
};

/**
 * Get reading time estimate from HTML content
 * @param {string} html - HTML content from the editor
 * @param {number} wordsPerMinute - Reading speed in words per minute
 * @returns {number} - Reading time in minutes
 */
export const getReadingTime = (html, wordsPerMinute = 200) => {
    const wordCount = getWordCount(html);
    return Math.ceil(wordCount / wordsPerMinute);
};