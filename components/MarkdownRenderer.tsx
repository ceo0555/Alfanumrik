import React from 'react';
import { cleanText } from '../utils/textHelpers';

interface MarkdownRendererProps {
    content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    // The 'pre-wrap' value for white-space is crucial for preserving
    // the line breaks from the AI's plain-text, step-by-step answers.
    // We also use cleanText to remove any unwanted markdown characters like * or #.
    return (
        <div style={{ whiteSpace: 'pre-wrap' }}>
            {cleanText(content)}
        </div>
    );
};

export default MarkdownRenderer;