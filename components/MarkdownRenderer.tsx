import React, { useMemo } from 'react';

interface MarkdownRendererProps {
    content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    const plainText = useMemo(() => {
        if (!content) return '';

        // This function aims to strip markdown-like syntax to produce clean text.
        // It's designed to be less aggressive on newlines compared to some regexes.
        return content
            // Remove HTML tags
            .replace(/<[^>]*>/g, '')
            // Remove code fences but keep content
            .replace(/```[\s\S]*?```/g, match => match.replace(/`/g, ''))
            // Remove inline code
            .replace(/`/g, '')
            // Remove headings
            .replace(/^#{1,6}\s+/gm, '')
            // Remove bold/italic/strikethrough
            .replace(/(\*\*|__|\*|_|~~)/g, '')
            // Remove links but keep text
            .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
            // Remove images
            .replace(/!\[.*?\]\(.*?\)/g, '')
            // Remove horizontal rules
            .replace(/^(---|___|\*\*\*)\s*$/gm, '')
            // Remove blockquotes
            .replace(/^>\s?/gm, '');

    }, [content]);

    // The 'pre-wrap' value for white-space is crucial for preserving
    // the line breaks from the AI's plain-text, step-by-step answers.
    return (
        <div style={{ whiteSpace: 'pre-wrap' }}>
            {plainText}
        </div>
    );
};

export default MarkdownRenderer;