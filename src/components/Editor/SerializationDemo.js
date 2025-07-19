"use client";
import { useState } from 'react';
import TiptapEditor from './TiptapEditor';
import { cx } from '@/src/utils';
import { convertFormat } from './EditorUtils';

/**
 * Demo component to showcase serialization and deserialization functionality
 */
const SerializationDemo = () => {
    const [content, setContent] = useState('<h2>Try the serialization features!</h2><p>This editor supports conversion between different formats:</p><ul><li><p>HTML - The standard format for web content</p></li><li><p>JSON - Great for storing structured content</p></li><li><p>Markdown - Perfect for text-based editing</p></li></ul><p>Use the format tools below to import and export content in different formats.</p>');
    const [outputFormat, setOutputFormat] = useState('html');
    const [inputFormat, setInputFormat] = useState('html');
    const [outputContent, setOutputContent] = useState('');

    // Handle content change
    const handleContentChange = (newContent) => {
        setContent(newContent);
        updateOutputContent(newContent);
    };

    // Update output content when format changes
    const updateOutputContent = async (contentToConvert = content) => {
        try {
            const converted = await convertFormat(contentToConvert, inputFormat, outputFormat);
            setOutputContent(
                typeof converted === 'object'
                    ? JSON.stringify(converted, null, 2)
                    : converted
            );
        } catch (error) {
            console.error('Error converting content:', error);
            setOutputContent('Error converting content');
        }
    };

    // Handle format change
    const handleFormatChange = async (e) => {
        const newFormat = e.target.value;
        setOutputFormat(newFormat);

        try {
            const converted = await convertFormat(content, inputFormat, newFormat);
            setOutputContent(
                typeof converted === 'object'
                    ? JSON.stringify(converted, null, 2)
                    : converted
            );
        } catch (error) {
            console.error('Error converting content:', error);
            setOutputContent('Error converting content');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <TiptapEditor
                    value={content}
                    onChange={handleContentChange}
                    outputFormat={inputFormat}
                    inputFormat={inputFormat}
                    showFormatTools={true}
                />
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-4">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Output Format:
                        </label>
                        <select
                            value={outputFormat}
                            onChange={handleFormatChange}
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
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Output Content ({outputFormat.toUpperCase()})
                        </h3>
                        <pre className={cx(
                            "p-4 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm overflow-auto",
                            "border border-gray-200 dark:border-gray-700",
                            "max-h-[300px]"
                        )}>
                            {outputContent}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SerializationDemo;