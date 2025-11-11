import React, { useState, useCallback } from 'react';
import { SparklesIcon, UploadIcon, XIcon, CheckCircleIcon } from '../constants/icons';
import { gradeHandwrittenAnswer } from '../services/geminiService';
import Loader from './Loader';

interface GradingResult {
    transcribedText: string;
    awardedMarks: number;
    feedback: string;
}

const PaperGrader: React.FC = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [question, setQuestion] = useState('');
    const [rubric, setRubric] = useState('');
    const [totalMarks, setTotalMarks] = useState(5);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<GradingResult | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleGrade = async () => {
        if (!imageFile || !question.trim() || !rubric.trim()) {
            setError("Please upload an image and fill in all fields.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const gradingResult = await gradeHandwrittenAnswer(imageFile, question, rubric, totalMarks);
            setResult(gradingResult);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An unknown error occurred during grading.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">AI Paper Grader</h3>
            <p className="text-slate-500 mb-6">Upload an image of a handwritten answer, provide the context, and let AI do the grading.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-4">
                    <div>
                        <label className="form-label font-semibold">1. Upload Student's Answer</label>
                        {!imagePreview ? (
                            <div 
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                className="mt-2 flex justify-center rounded-lg border border-dashed border-slate-900/25 px-6 py-10"
                            >
                                <div className="text-center">
                                    <UploadIcon className="mx-auto h-12 w-12 text-slate-300" />
                                    <div className="mt-4 flex text-sm leading-6 text-slate-600">
                                        <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500">
                                            <span>Upload a file</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs leading-5 text-slate-600">PNG, JPG, GIF up to 10MB</p>
                                </div>
                            </div>
                        ) : (
                             <div className="mt-2 relative">
                                <img src={imagePreview} alt="Answer preview" className="w-full rounded-lg border" />
                                <button onClick={handleRemoveImage} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70">
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="form-label font-semibold">2. Provide Context</label>
                        <textarea value={question} onChange={e => setQuestion(e.target.value)} className="form-textarea w-full mt-2" rows={3} placeholder="Paste the question here..."></textarea>
                        <textarea value={rubric} onChange={e => setRubric(e.target.value)} className="form-textarea w-full mt-2" rows={4} placeholder="Paste the marking rubric here..."></textarea>
                        <input type="number" value={totalMarks} onChange={e => setTotalMarks(Number(e.target.value))} className="form-input w-full mt-2" placeholder="Total Marks" />
                    </div>

                    <button onClick={handleGrade} disabled={isLoading || !imageFile} className="btn btn-primary w-full flex items-center justify-center gap-2">
                        <SparklesIcon className="w-5 h-5" /> {isLoading ? "Grading..." : "Grade with AI"}
                    </button>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                </div>

                {/* Output Section */}
                <div className="p-4 bg-slate-50 rounded-lg border">
                    <h4 className="font-bold text-lg mb-4 text-center">Grading Results</h4>
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full">
                           <Loader />
                        </div>
                    )}
                    {result && (
                        <div className="space-y-4 animate-fade-in">
                             <div>
                                <h5 className="font-semibold text-sm text-slate-600">AI Awarded Marks:</h5>
                                <p className="text-2xl font-bold text-indigo-600">{result.awardedMarks} / {totalMarks}</p>
                            </div>
                            <div>
                                <h5 className="font-semibold text-sm text-slate-600">Transcribed Answer:</h5>
                                <p className="p-2 bg-white rounded border text-sm italic">"{result.transcribedText}"</p>
                            </div>
                            <div>
                                <h5 className="font-semibold text-sm text-slate-600">Feedback:</h5>
                                <p className="p-2 bg-white rounded border text-sm whitespace-pre-wrap">{result.feedback}</p>
                            </div>
                        </div>
                    )}
                    {!isLoading && !result && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <CheckCircleIcon className="w-12 h-12 mb-2" />
                            <p className="text-sm text-center">Results will appear here once grading is complete.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaperGrader;
