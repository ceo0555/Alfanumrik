import React, { useState } from 'react';
import { LightbulbIcon, SparklesIcon } from '../constants/icons';
import { explainConceptInDepth } from '../services/geminiService';

const ConceptExplainer: React.FC = () => {
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    const handleExplain = async () => {
        if (!text.trim()) {
            setError("Please paste some text to explain.");
            return;
        }
        if (!process.env.API_KEY) {
            setError("API_KEY is not configured.");
            return;
        }

        setIsLoading(true);
        setResult('');
        setError('');

        try {
            const explanation = await explainConceptInDepth(text);
            setResult(explanation);
        } catch (err) {
            console.error(err);
            setError("Sorry, an error occurred while generating the explanation. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderMarkdown = (markdown: string) => {
        if (!markdown) return null;

        const processInline = (text: string): string => {
            return text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
                .replace(/\*(.*?)\*/g, '<em>$1</em>');           // Italic
        };

        const blocks = markdown.trim().split(/\n\s*\n/); // Split by one or more blank lines

        const html = blocks.map(block => {
            const trimmedBlock = block.trim();

            // Fenced Code Blocks for Math
            if (trimmedBlock.startsWith('```') && trimmedBlock.endsWith('```')) {
                const code = trimmedBlock.substring(3, trimmedBlock.length - 3).trim();
                const escapedCode = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                return `<pre><code>${escapedCode}</code></pre>`;
            }
            
            // Headings
            if (trimmedBlock.startsWith('### ')) return `<h3>${processInline(trimmedBlock.substring(4))}</h3>`;
            if (trimmedBlock.startsWith('## ')) return `<h2>${processInline(trimmedBlock.substring(3))}</h2>`;
            if (trimmedBlock.startsWith('# ')) return `<h1>${processInline(trimmedBlock.substring(2))}</h1>`;

            // Lists
            if (trimmedBlock.startsWith('* ') || trimmedBlock.startsWith('- ') || trimmedBlock.match(/^\d+\.\s/)) {
                const isOrdered = trimmedBlock.match(/^\d+\.\s/);
                const listTag = isOrdered ? 'ol' : 'ul';
                const items = trimmedBlock.split('\n').map(item => {
                    let content = item.trim().replace(/^(\* |-\s|\d+\.\s)/, '');
                    return `<li>${processInline(content)}</li>`;
                }).join('');
                return `<${listTag}>${items}</${listTag}>`;
            }

            // Paragraphs
            return `<p>${processInline(trimmedBlock)}</p>`;

        }).join('');

        return <div dangerouslySetInnerHTML={{ __html: html }} />;
    };

    return (
        <div className="text-center">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Concept Explainer</h3>
            <p className="text-slate-500 mb-6">Paste any complex text from your textbook or the web, and MIGA will break it down for you.</p>

            <div className="flex flex-col gap-4">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste your text here..."
                    className="w-full p-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    rows={8}
                    disabled={isLoading}
                />
                <button
                    onClick={handleExplain}
                    disabled={isLoading || !text.trim()}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? 'Explaining...' : <> <SparklesIcon className="w-5 h-5" /> Explain Concept </>}
                </button>
            </div>
            
            {error && <p className="mt-4 text-red-500">{error}</p>}
            
            {isLoading && (
                 <div className="mt-6 text-center p-8">
                    <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-slate-500">MIGA is thinking...</p>
                </div>
            )}
            
            {result && (
                <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg text-left">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                        <LightbulbIcon className="w-5 h-5 text-amber-500" />
                        Here's the breakdown:
                    </h4>
                    <div className="prose prose-sm max-w-none prose-slate text-slate-700">{renderMarkdown(result)}</div>
                </div>
            )}
        </div>
    );
};

export default ConceptExplainer;