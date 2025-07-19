"use client";
import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';

const CodeBlock = ({ node, updateAttributes, extension }) => {
    const language = node.attrs.language || 'plaintext';

    return (
        <NodeViewWrapper className="code-block-wrapper relative">
            <pre>
                <code className={`language-${language}`}>{node.textContent}</code>
            </pre>
            <div className="code-block-language">
                {language === 'plaintext' ? 'text' : language}
            </div>
        </NodeViewWrapper>
    );
};

export default CodeBlock;