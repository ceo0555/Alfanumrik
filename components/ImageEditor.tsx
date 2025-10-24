import React, { useState } from 'react';
import { editImage } from '../services/geminiService';
import { UploadIcon, ImageIcon, EditIcon } from '../constants/icons';

const ImageEditor: React.FC = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Reset state for new image
            setResultUrl(null);
            setError('');
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!imageFile || !prompt) {
            setError("Please upload an image and provide an edit instruction.");
            return;
        }

        setIsLoading(true);
        setResultUrl(null);
        setError('');

        try {
            const editedImageUrl = await editImage(imageFile, prompt);
            setResultUrl(editedImageUrl);
        } catch (err) {
            console.error(err);
            setError("Failed to edit the image. The model might have refused the prompt, or an error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="text-center">
            <h3 className="text-xl font-bold text-slate-800 mb-2">AI Image Editor</h3>
            <p className="text-slate-500 mb-6">Upload an image and tell MIGA how to change it.</p>

            <div className="flex flex-col gap-4 mb-6">
                <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg">
                    <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center justify-center">
                        <UploadIcon className="w-8 h-8 text-slate-400 mb-1" />
                        <span className="text-sm font-semibold text-slate-600">
                            {imageFile ? `Selected: ${imageFile.name}` : "Click to upload an image"}
                        </span>
                    </label>
                    <input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </div>

                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., 'Add a retro filter' or 'Make the sky look like a sunset'"
                    className="w-full p-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    rows={3}
                    disabled={isLoading || !imageFile}
                />

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !imageFile || !prompt}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? 'Generating...' : <><EditIcon className="w-5 h-5" /> Generate Edit</>}
                </button>
            </div>

            {error && <p className="my-4 text-red-500">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col items-center">
                    <h4 className="font-semibold text-slate-600 mb-2">Original</h4>
                    <div className="w-full aspect-video bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {previewUrl ? (
                            <img src={previewUrl} alt="Original" className="w-full h-full object-contain" />
                        ) : (
                            <ImageIcon className="w-12 h-12 text-slate-300" />
                        )}
                    </div>
                </div>
                <div className="flex flex-col items-center">
                    <h4 className="font-semibold text-slate-600 mb-2">Edited</h4>
                    <div className="w-full aspect-video bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {isLoading && <div className="w-10 h-10 border-4 border-dashed rounded-full animate-spin border-indigo-600"></div>}
                        {resultUrl && !isLoading && (
                            <img src={resultUrl} alt="Edited" className="w-full h-full object-contain" />
                        )}
                        {!resultUrl && !isLoading && <ImageIcon className="w-12 h-12 text-slate-300" />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageEditor;