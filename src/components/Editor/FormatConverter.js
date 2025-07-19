"use client";
import { useState, useRef } from 'react';
import { convertFormat } from './EditorUtils';
import { cx } from '@/src/utils';
import Button from '@/src/components/UI/Button';

/**
 * Component for importing and exporting editor content in different formats
 */
const FormatConverter = ({
    content,
    currentFormat = 'html',
    onImport,
    className = '',
}) => {
    const [exportFormat, setExportFormat] = useState('markdown');
    const [importFormat, setImportFormat] = useState('markdown');
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [exportedContent, setExportedContent] = useState('');
    const [showExportModal, setShowExportModal] = useState(false);
    const fileInputRef = useRef(null);

    // Handle export button click
    const handleExport = async () => {
        if (!content) return;

        setIsExporting(true);
        try {
            const converted = await convertFormat(content, currentFormat, exportFormat);

            // For JSON format, stringify with pretty printing
            const formattedContent = exportFormat === 'json'
                ? JSON.stringify(converted, null, 2)
                : converted;

            setExportedContent(formattedContent);
            setShowExportModal(true);
        } catch (error) {
            console.error('Error exporting content:', error);
            alert('Failed to export content. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    // Handle download of exported content
    const handleDownload = () => {
        if (!exportedContent) return;

        const fileExtension = exportFormat === 'json' ? 'json' :
            exportFormat === 'markdown' ? 'md' : 'html';

        const blob = new Blob([exportedContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `content.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Handle file selection for import
    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const text = await file.text();
            const converted = await convertFormat(text, importFormat, currentFormat);
            onImport?.(converted);
        } catch (error) {
            console.error('Error importing content:', error);
            alert('Failed to import content. Please check the file format and try again.');
        } finally {
            setIsImporting(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Copy exported content to clipboard
    const copyToClipboard = () => {
        navigator.clipboard.writeText(exportedContent)
            .then(() => alert('Content copied to clipboard!'))
            .catch(err => console.error('Failed to copy content:', err));
    };

    return (
        <div className={cx("flex flex-col gap-4", className)}>
            {/* Export Section */}
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Export as:
                </label>
                <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className={cx(
                        "px-3 py-2 border border-gray-300 rounded-lg shadow-sm",
                        "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
                        "dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    )}
                >
                    <option value="html">HTML</option>
                    <option value="markdown">Markdown</option>
                    <option value="json">JSON</option>
                </select>
                <Button
                    variant="secondary"
                    onClick={handleExport}
                    disabled={isExporting || !content}
                    loading={isExporting}
                >
                    Export
                </Button>
            </div>

            {/* Import Section */}
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Import from:
                </label>
                <select
                    value={importFormat}
                    onChange={(e) => setImportFormat(e.target.value)}
                    className={cx(
                        "px-3 py-2 border border-gray-300 rounded-lg shadow-sm",
                        "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
                        "dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    )}
                >
                    <option value="html">HTML</option>
                    <option value="markdown">Markdown</option>
                    <option value="json">JSON</option>
                </select>
                <div className="relative">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={
                            importFormat === 'json' ? '.json' :
                                importFormat === 'markdown' ? '.md,.markdown' : '.html,.htm'
                        }
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={isImporting}
                    />
                    <Button
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImporting}
                        loading={isImporting}
                    >
                        Import File
                    </Button>
                </div>
            </div>

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Exported Content ({exportFormat.toUpperCase()})
                            </h3>
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4 flex-1 overflow-auto">
                            <pre className={cx(
                                "p-4 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm overflow-auto",
                                "border border-gray-200 dark:border-gray-700",
                                "max-h-[50vh]"
                            )}>
                                {exportedContent}
                            </pre>
                        </div>
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                            <Button variant="secondary" onClick={copyToClipboard}>
                                Copy to Clipboard
                            </Button>
                            <Button variant="primary" onClick={handleDownload}>
                                Download
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FormatConverter;