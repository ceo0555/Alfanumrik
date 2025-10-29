import React from 'react';

interface MarkdownRendererProps {
    content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    // The 'pre-wrap' value for white-space is crucial for preserving
    // the line breaks from the AI's plain-text, step-by-step answers.
    // By simply rendering the content as is, we avoid stripping important formatting
    // like newlines, which the previous regex-based implementation was doing.
    return (
        <div style={{ whiteSpace: 'pre-wrap' }}>
            {content}
        </div>
    );
};

export default MarkdownRenderer;