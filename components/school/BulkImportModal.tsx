import React, { useState, useRef } from 'react';
import { XIcon, UploadIcon, CheckCircleIcon, TriangleAlertIcon, DownloadIcon } from '../../constants/icons';
import { BulkImportResult } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';

interface BulkImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'students' | 'teachers';
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, type }) => {
    const { handleSaveUser } = useAuth();
    const { activeSchool } = useSchool();
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<BulkImportResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const parseCsvData = (text: string): any[] => {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        return lines.slice(1).map((line, index) => {
            const values = line.split(',').map(v => v.trim());
            const obj: any = { row: index + 2 }; // +2 because row 1 is header, and we're 0-indexed
            headers.forEach((header, i) => {
                obj[header] = values[i] || '';
            });
            return obj;
        });
    };

    const validateStudentData = (data: any): { valid: boolean; error?: string } => {
        if (!data.name || data.name.length < 2) {
            return { valid: false, error: 'Name must be at least 2 characters' };
        }
        if (!data.grade || !['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].includes(data.grade)) {
            return { valid: false, error: 'Grade must be between 1 and 12' };
        }
        return { valid: true };
    };

    const validateTeacherData = (data: any): { valid: boolean; error?: string } => {
        if (!data.name || data.name.length < 2) {
            return { valid: false, error: 'Name must be at least 2 characters' };
        }
        if (!data.subject) {
            return { valid: false, error: 'Subject is required' };
        }
        return { valid: true };
    };

    const handleImport = async () => {
        if (!file || !activeSchool) return;

        setIsProcessing(true);
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const rows = parseCsvData(text);
                
                const importResult: BulkImportResult = {
                    totalRows: rows.length,
                    successCount: 0,
                    failedCount: 0,
                    errors: [],
                    importedIds: [],
                };

                rows.forEach((row) => {
                    const validation = type === 'students' 
                        ? validateStudentData(row) 
                        : validateTeacherData(row);

                    if (!validation.valid) {
                        importResult.failedCount++;
                        importResult.errors.push({
                            row: row.row,
                            error: validation.error || 'Invalid data',
                            data: row,
                        });
                    } else {
                        try {
                            // Create user data
                            const userData: any = {
                                name: row.name,
                                grade: type === 'students' ? row.grade : '12',
                                schoolId: activeSchool.id,
                            };

                            if (type === 'teachers') {
                                userData.schoolRole = 'teacher';
                                userData.subject = row.subject;
                            }

                            // This would normally call an API
                            handleSaveUser(userData);
                            
                            importResult.successCount++;
                            importResult.importedIds.push(importResult.successCount);
                        } catch (error) {
                            importResult.failedCount++;
                            importResult.errors.push({
                                row: row.row,
                                error: error instanceof Error ? error.message : 'Import failed',
                                data: row,
                            });
                        }
                    }
                });

                setResult(importResult);
            } catch (error) {
                alert('Error parsing CSV file. Please check the format.');
            } finally {
                setIsProcessing(false);
            }
        };

        reader.readAsText(file);
    };

    const downloadTemplate = () => {
        let csvContent = '';
        
        if (type === 'students') {
            csvContent = 'name,grade\n';
            csvContent += 'John Doe,10\n';
            csvContent += 'Jane Smith,9\n';
            csvContent += 'Mike Johnson,11\n';
        } else {
            csvContent = 'name,subject\n';
            csvContent += 'Dr. Sarah Williams,Mathematics\n';
            csvContent += 'Prof. David Brown,Physics\n';
            csvContent += 'Ms. Emily Davis,English\n';
        }

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_import_template.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">Bulk Import {type === 'students' ? 'Students' : 'Teachers'}</h2>
                            <p className="text-indigo-100 text-sm mt-1">Upload CSV file to import multiple users at once</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {!result ? (
                        <div className="space-y-6">
                            {/* Instructions */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
                                <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                                    <li>Download the CSV template below</li>
                                    <li>Fill in the data (one {type === 'students' ? 'student' : 'teacher'} per row)</li>
                                    <li>Save the file as CSV format</li>
                                    <li>Upload the file using the button below</li>
                                    <li>Click "Import" to process the data</li>
                                </ol>
                            </div>

                            {/* Download Template */}
                            <button
                                onClick={downloadTemplate}
                                className="btn bg-green-500 hover:bg-green-600 text-white w-full flex items-center justify-center gap-2"
                            >
                                <DownloadIcon className="w-5 h-5" />
                                Download CSV Template
                            </button>

                            {/* File Upload */}
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                {file ? (
                                    <div>
                                        <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                        <p className="font-semibold text-slate-800">{file.name}</p>
                                        <p className="text-sm text-slate-500 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="btn bg-slate-200 text-slate-700 hover:bg-slate-300 mt-4"
                                        >
                                            Change File
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <UploadIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                                        <p className="font-semibold text-slate-700">Click to upload CSV file</p>
                                        <p className="text-sm text-slate-500 mt-1">or drag and drop</p>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="btn btn-primary mt-4"
                                        >
                                            Select File
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Expected Format */}
                            <div className="bg-slate-50 rounded-xl p-4">
                                <h3 className="font-semibold text-slate-800 mb-2">Expected CSV Format:</h3>
                                <pre className="text-xs bg-white p-3 rounded border font-mono overflow-x-auto">
                                    {type === 'students' 
                                        ? 'name,grade\nJohn Doe,10\nJane Smith,9'
                                        : 'name,subject\nDr. Sarah Williams,Mathematics\nProf. David Brown,Physics'
                                    }
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Results Summary */}
                            <div className={`rounded-xl p-6 ${result.failedCount === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                                <div className="flex items-center gap-3 mb-4">
                                    {result.failedCount === 0 ? (
                                        <CheckCircleIcon className="w-8 h-8 text-green-600" />
                                    ) : (
                                        <TriangleAlertIcon className="w-8 h-8 text-yellow-600" />
                                    )}
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800">Import Complete</h3>
                                        <p className="text-sm text-slate-600">
                                            {result.successCount} successful, {result.failedCount} failed out of {result.totalRows} total
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-slate-800">{result.totalRows}</p>
                                        <p className="text-xs text-slate-600">Total Rows</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-green-600">{result.successCount}</p>
                                        <p className="text-xs text-slate-600">Successful</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-red-600">{result.failedCount}</p>
                                        <p className="text-xs text-slate-600">Failed</p>
                                    </div>
                                </div>
                            </div>

                            {/* Errors List */}
                            {result.errors.length > 0 && (
                                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                                    <h3 className="font-semibold text-red-900 mb-3">Errors:</h3>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {result.errors.map((error, index) => (
                                            <div key={index} className="bg-white rounded-lg p-3 text-sm">
                                                <p className="font-semibold text-red-700">Row {error.row}: {error.error}</p>
                                                {error.data && (
                                                    <p className="text-slate-600 mt-1 text-xs">
                                                        Data: {JSON.stringify(error.data)}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-slate-50">
                    <div className="flex gap-3">
                        {!result ? (
                            <>
                                <button onClick={onClose} className="btn bg-slate-200 text-slate-700 hover:bg-slate-300 flex-1">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={!file || isProcessing}
                                    className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? 'Importing...' : 'Import Data'}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        setFile(null);
                                        setResult(null);
                                    }}
                                    className="btn bg-slate-200 text-slate-700 hover:bg-slate-300 flex-1"
                                >
                                    Import More
                                </button>
                                <button onClick={onClose} className="btn btn-primary flex-1">
                                    Done
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkImportModal;
