import React, { useState } from 'react';
import { analyzeImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileHelpers';
import { UploadIcon } from '../constants/icons';

const ImageAnalyzer: React.FC = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyze = async () => {
        if (!imageFile || !prompt) {
            setError("Please upload an image and provide a prompt.");
            return;
        }

        setIsLoading(true);
        setResult('');
        setError('');

        try {
            const analysisResult = await analyzeImage(imageFile, prompt);
            setResult(analysisResult);
        } catch (err) {
            console.error(err);
            setError("Failed to analyze the image. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="text-center">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Image Analyzer</h3>
            <p className="text-slate-500 mb-6">Upload a diagram or photo and ask a question about it.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="max-h-64 w-auto rounded-md object-contain"/>
                    ) : (
                        <div className="text-center text-slate-500">
                            <UploadIcon className="w-12 h-12 mx-auto mb-2"/>
                            <p>Upload an image</p>
                        </div>
                    )}
                     <input type="file" accept="image/*" onChange={handleFileChange} className="mt-4 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                </div>
                <div className="flex flex-col gap-4">
                     <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., 'What type of chemical bond is shown here?'"
                        className="w-full flex-grow p-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        rows={5}
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading || !imageFile || !prompt}
                        className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                         {isLoading ? 'Analyzing...' : 'Analyze Image'}
                    </button>
                </div>
            </div>
            
            {error && <p className="mt-4 text-red-500">{error}</p>}
            
            {result && (
                <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg text-left">
                    <h4 className="font-bold text-slate-800">Analysis Result:</h4>
                    <p className="mt-2 text-slate-700 whitespace-pre-wrap">{result}</p>
                </div>
            )}
        </div>
    );
};

export default ImageAnalyzer;