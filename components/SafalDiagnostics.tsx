import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SafalDiagnosticResult, RemediationGroup } from '../types';
import { SAFAL_COMPETENCIES_BY_GRADE } from '../constants/safalCompetencies';
import { generateRemediationGroups } from '../services/geminiService';
import { SparklesIcon } from '../constants/icons';

interface SafalDiagnosticsProps {
    schoolGrade: string | null;
    onOpenRemediationAssignment: (studentIds: number[], instructions: string) => void;
}

const SafalDiagnostics: React.FC<SafalDiagnosticsProps> = ({ schoolGrade, onOpenRemediationAssignment }) => {
    const { userProfiles } = useAuth();
    const [selectedGrade, setSelectedGrade] = useState(schoolGrade || '3');
    const [results, setResults] = useState<SafalDiagnosticResult[] | null>(null);
    const [remediationGroups, setRemediationGroups] = useState<RemediationGroup[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState('');

    const handleRunDiagnostic = () => {
        setIsLoading(true);
        setError('');
        setResults(null);
        setRemediationGroups(null);

        const studentsInGrade = userProfiles.filter(p => p.grade === selectedGrade);
        if (studentsInGrade.length === 0) {
            setError(`No students found in Class ${selectedGrade}.`);
            setIsLoading(false);
            return;
        }

        const competencies = SAFAL_COMPETENCIES_BY_GRADE[selectedGrade];
        if (!competencies) {
            setError(`No SAFAL competencies defined for Class ${selectedGrade}.`);
            setIsLoading(false);
            return;
        }
        
        // Simulate generating mock results
        setTimeout(() => {
            const mockResults = studentsInGrade.map(student => {
                const studentCompetencies: { [key: string]: 'high' | 'medium' | 'low' } = {};
                competencies.forEach(comp => {
                    const rand = Math.random();
                    studentCompetencies[comp] = rand > 0.7 ? 'high' : rand > 0.3 ? 'medium' : 'low';
                });
                return {
                    studentId: student.id,
                    studentName: student.name,
                    competencies: studentCompetencies,
                };
            });
            setResults(mockResults);
            setIsLoading(false);
        }, 1000);
    };

    const handleAnalyzeResults = async () => {
        if (!results) return;
        setIsAnalyzing(true);
        setError('');
        try {
            const groups = await generateRemediationGroups(results);
            setRemediationGroups(groups);
        } catch (e) {
            setError("Failed to generate remediation groups from AI.");
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleCreateAssignment = (group: RemediationGroup) => {
        const studentIds = userProfiles
            .filter(p => group.students.includes(p.name))
            .map(p => p.id);
        onOpenRemediationAssignment(studentIds, group.suggestedTask);
    };

    const competencies = SAFAL_COMPETENCIES_BY_GRADE[selectedGrade] || [];
    const colorMap = { high: 'bg-emerald-400', medium: 'bg-yellow-400', low: 'bg-red-400' };
    const textColorMap = { high: 'text-emerald-800', medium: 'text-yellow-800', low: 'text-red-800' };

    return (
        <div>
            <div className="flex items-center gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
                <label htmlFor="safal-grade" className="font-semibold">Select Grade:</label>
                <select id="safal-grade" value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} className="form-select">
                    <option value="3">Class 3</option>
                    <option value="5">Class 5</option>
                    <option value="8">Class 8</option>
                </select>
                <button onClick={handleRunDiagnostic} disabled={isLoading} className="btn btn-primary">
                    {isLoading ? 'Running...' : 'Run Diagnostic Test'}
                </button>
            </div>
            {error && <p className="text-red-500">{error}</p>}
            {results && (
                <div className="animate-fade-in">
                    <h3 className="font-bold text-lg mb-2">Competency Heatmap - Class {selectedGrade}</h3>
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="p-2 text-left font-semibold sticky left-0 bg-slate-100">Student Name</th>
                                    {competencies.map(comp => <th key={comp} className="p-2 font-semibold min-w-[150px]">{comp}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {results.map(res => (
                                    <tr key={res.studentId} className="border-t">
                                        <td className="p-2 font-medium sticky left-0 bg-white">{res.studentName}</td>
                                        {competencies.map(comp => (
                                            <td key={comp} className={`p-0 text-center ${colorMap[res.competencies[comp]]}`}>
                                                <span className={`capitalize font-bold text-xs ${textColorMap[res.competencies[comp]]}`}>
                                                    {res.competencies[comp]}
                                                </span>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 text-center">
                        <button onClick={handleAnalyzeResults} disabled={isAnalyzing} className="btn btn-primary flex items-center gap-2 mx-auto">
                            <SparklesIcon className="w-5 h-5"/>
                            {isAnalyzing ? "AI is Analyzing..." : "AI: Create Remediation Groups"}
                        </button>
                    </div>

                    {remediationGroups && (
                        <div className="mt-6 animate-fade-in">
                            <h3 className="font-bold text-lg mb-2">AI-Suggested Remediation Groups</h3>
                            <div className="space-y-4">
                                {remediationGroups.map((group, i) => (
                                    <div key={i} className="p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-lg">
                                        <h4 className="font-bold text-indigo-800">{group.competency}</h4>
                                        <p className="text-sm mt-1"><strong>Students:</strong> {group.students.join(', ')}</p>
                                        <p className="text-sm mt-2 p-2 bg-white rounded border"><strong>Suggested Task:</strong> {group.suggestedTask}</p>
                                        <button onClick={() => handleCreateAssignment(group)} className="btn btn-primary text-xs mt-2">
                                            Create Remediation Assignment
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SafalDiagnostics;