import React, { useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { ImageIcon } from '../constants/icons';

const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError("Please enter a prompt to generate an image.");
            return;
        }
        if (!process.env.API_KEY) {
            setError("API_KEY is not configured. This feature is disabled.");
            return;
        }

        setIsLoading(true);
        setImageUrl('');
        setError('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const educationalPrompt = `
**Style**: A visually correct, clear, and relatable educational illustration for a K-12 CBSE student in India. High quality, not cartoonish.
**Content**: Create an image illustrating: "${prompt}".
**Instructions**:
- Ensure all text and labels in the image are spelled correctly and are clearly legible.
- The image must be factually and visually accurate for the subject matter.
- The overall aesthetic should be clean, professional, and suitable for a textbook or learning material.
- The diagram must be 100% authentic and correctly marked for the CBSE curriculum.
`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [{ text: educationalPrompt }],
                },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    const url = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                    setImageUrl(url);
                    setIsLoading(false);
                    return;
                }
            }
            
            throw new Error("No image data found in response.");

        } catch (err) {
            console.error(err);
            setError("Failed to generate image. The model may have refused the prompt. Please try a different, education-focused prompt.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="text-center">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Image Generator</h3>
            <p className="text-slate-500 mb-6">Create a visual aid for any concept. Describe what you want to see.</p>

            <div className="flex flex-col gap-4">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., 'A diagram of the human heart with chambers labeled'"
                    className="w-full p-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    rows={3}
                />
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? 'Generating...' : 'Generate Image'}
                    </button>
                </div>
            </div>
            
            {error && <p className="mt-4 text-red-500">{error}</p>}
            
            <div className="mt-6 p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg min-h-[200px] flex items-center justify-center">
                {isLoading && <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-indigo-600"></div>}
                {imageUrl && <img src={imageUrl} alt="Generated visual aid" className="max-h-96 w-auto rounded-md" />}
                {!isLoading && !imageUrl && 
                    <div className="text-slate-400 text-center">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2"/>
                        <p>Your generated image will appear here.</p>
                    </div>
                }
            </div>
        </div>
    );
};

export default ImageGenerator;