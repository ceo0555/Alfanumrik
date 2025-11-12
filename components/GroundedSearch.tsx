import React, { useState } from 'react';
import { analyzeQueryComplexity } from '../services/geminiService';
import { GroundingChunk } from '../types';
import { SearchIcon, SparklesIcon } from '../constants/icons';
import { GoogleGenAI } from '@google/genai';
import MarkdownRenderer from './MarkdownRenderer';
import Loader from './Loader';
import { getGeminiApiKey } from '../utils/env';

const GroundedSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{ answer: string; sources: GroundingChunk[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<'simple' | 'complex' | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult({ answer: '', sources: [] }); // Initialize for streaming
    setAnalysis(null);

    try {
      const complexity = await analyzeQueryComplexity(query);
      setAnalysis(complexity);

        const apiKey = getGeminiApiKey();
        if (!apiKey) {
          throw new Error("Gemini API key is not configured.");
        }
        const ai = new GoogleGenAI({ apiKey });
      
      let prompt: string;
      let model: string;
      let config: any;

      if (complexity === 'complex') {
        model = 'gemini-2.5-pro';
        prompt = `
          You are MIGA, an expert academic AI specializing in the Indian K-12 CBSE curriculum. Your task is to perform a deep analysis and provide a comprehensive, step-by-step explanation for the following student's query. The query is complex and requires deep reasoning.

          **Query**: "${query}"

          **Instructions**:
          1.  **Adhere to CBSE Standards**: Your answer must be strictly aligned with the CBSE curriculum, standards, and marking schemes.
          2.  **Detailed Explanation**: Break down the concept into fundamental principles. Explain complex terminology in simple terms. Use analogies if helpful.
          3.  **Structured Answer**: Organize your response logically. For problem-solving, outline the strategy, state the formulas, substitute the values, and then derive the solution.
          4.  **Clean Text Output**: Provide the final answer as clean plain text ONLY. Do not use any markdown or special formatting. Use line breaks to create paragraphs and structure.
          5.  **Educational Focus**: If the query is unrelated to academic subjects, politely decline to answer.
        `;
        config = {
            thinkingConfig: { thinkingBudget: 32768 }
        };
      } else {
        model = 'gemini-2.5-flash';
        prompt = `
          You are MIGA, an expert academic tutor specializing in the Indian K-12 CBSE curriculum. Your task is to answer the following student's query using up-to-date information from your search tool.

          **CRITICAL INSTRUCTIONS (MUST be followed)**:
          1.  **Pedagogical Soundness & Accuracy**: Your answer must be 100% factually accurate and pedagogically sound for a K-12 student. Simplify complex concepts and use relatable Indian contexts where possible.
          2.  **CBSE Alignment**: Ensure the answer is strictly aligned with the CBSE curriculum, standards, and marking schemes.
          3.  **Clean, Direct Answer**: Provide the final answer as clean, plain text ONLY. Do not use any Markdown, headings, or lists. Do not mention your sources or that you performed a search.
          4.  **Educational Focus**: If the query is unrelated to academics, politely decline to answer.

          **Student Query**: "${query}"
        `;
        config = {
            tools: [{googleSearch: {}}],
        };
      }

      const responseStream = await ai.models.generateContentStream({ model, contents: prompt, config });

      setIsLoading(false); // Stop main loader, start showing streaming text

      let fullAnswer = '';
      const sourceMap = new Map<string, GroundingChunk>();

      for await (const chunk of responseStream) {
          fullAnswer += chunk.text;
          
          const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (groundingChunks) {
              for (const gc of groundingChunks) {
                  if (gc.web?.uri && !sourceMap.has(gc.web.uri)) {
                      sourceMap.set(gc.web.uri, gc);
                  }
              }
          }
          
          setResult({
              answer: fullAnswer,
              sources: Array.from(sourceMap.values())
          });
      }

    } catch (err) {
      setError('Failed to get an answer. Please check the API key and try again.');
      console.error(err);
      setIsLoading(false); // Ensure loading is off on error
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-slide-in-up">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-extrabold text-slate-800">Ask MIGA</h2>
        <p className="text-slate-500 mt-2 text-lg">Your intelligent assistant for curriculum-focused questions.</p>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-200 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <SearchIcon className="w-6 h-6 text-slate-400" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask any educational question..."
                className="form-input w-full pl-12 pr-4 py-3 text-lg rounded-xl"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="btn btn-primary py-3 px-8 text-lg rounded-xl"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-dashed rounded-full animate-spin border-white"></div>
              ) : (
                <span>Ask</span>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {isLoading && (
          <div className="text-center p-8">
            <Loader />
          </div>
      )}

      {error && <div className="text-center text-red-500 bg-red-50 p-4 rounded-lg">{error}</div>}

      {result && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 animate-scale-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-slate-800">Answer</h3>
            {analysis && (
              <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                analysis === 'complex' ? 'bg-purple-100 text-purple-800' : 'bg-sky-100 text-sky-800'
              }`}>
                {analysis === 'complex' ? <SparklesIcon className="w-3.5 h-3.5" /> : null}
                {analysis === 'complex' ? 'Deep Analysis' : 'Grounded Answer'}
              </span>
            )}
          </div>

          <div className="prose prose-base max-w-none prose-indigo">
            <MarkdownRenderer content={result.answer} />
            {result.answer.length === 0 && !isLoading && (
              <div className="w-6 h-6 border-2 border-dashed rounded-full animate-spin border-indigo-600"></div>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
};

export default GroundedSearch;
