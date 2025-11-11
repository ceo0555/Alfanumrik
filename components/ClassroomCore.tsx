import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TeacherSchedule, UserProfile, AttendanceRecord, QuickFormativeAssessment, QfaResult, RemediationGroup } from '../types';
import { CheckCircleIcon, ClipboardCheckIcon, SparklesIcon, XIcon, BookIcon } from '../constants/icons';
import { generateQfaRemediation } from '../services/geminiService';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-500">{title}</h4>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
);

// --- MAIN COMPONENT ---
const ClassroomCore: React.FC<{ grade: string | null }> = ({ grade }) => {
    const { 
        userProfiles, 
        teacherSchedules, 
        attendanceRecords, 
        handleSaveAttendance, 
        quickFormativeAssessments,
        handleSaveQfas,
        activeProfile,
        teacherAssignments
    } = useAuth();
    
    const schoolRole = activeProfile?.schoolRole;
    
    const activeQfa = useMemo(() => quickFormativeAssessments.find(q => q.status === 'active'), [quickFormativeAssessments]);

    const [attendanceModalSchedule, setAttendanceModalSchedule] = useState<TeacherSchedule | null>(null);
    const [createQfaModalSchedule, setCreateQfaModalSchedule] = useState<TeacherSchedule | null>(null);
    const [qfaResults, setQfaResults] = useState<QfaResult[]>([]);

    const handleCreateQfa = (qfaData: Omit<QuickFormativeAssessment, 'id' | 'createdAt' | 'status'>) => {
        const newQfa: QuickFormativeAssessment = {
            ...qfaData,
            id: `qfa-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: 'active'
        };
        handleSaveQfas([...quickFormativeAssessments, newQfa]);
        setCreateQfaModalSchedule(null);
    };
    
    const scheduleForView = useMemo(() => {
        if (schoolRole === 'teacher' && activeProfile) {
            const teacherClasses = teacherAssignments.filter(a => a.teacherId === activeProfile.id);
            return teacherSchedules.filter(s => 
                teacherClasses.some(tc => tc.grade === s.grade && tc.subject === s.subject)
            );
        }
        return teacherSchedules;
    }, [teacherSchedules, schoolRole, activeProfile, teacherAssignments]);

    useEffect(() => {
        if (!activeQfa) return;
        const studentsInGrade = userProfiles.filter(p => p.grade === activeQfa.grade);
        const interval = setInterval(() => {
            setQfaResults(prev => {
                if (prev.length >= studentsInGrade.length) {
                    clearInterval(interval);
                    return prev;
                }
                const submittedStudentIds = new Set(prev.map(r => r.studentId));
                const nextStudent = studentsInGrade.find(s => !submittedStudentIds.has(s.id));
                if (nextStudent) {
                    const newResult: QfaResult = {
                        assessmentId: activeQfa.id,
                        studentId: nextStudent.id,
                        studentName: nextStudent.name,
                        answers: activeQfa.questions.map(q => Math.random() < 0.7 ? q.answer : "Incorrect answer"),
                        submittedAt: new Date().toISOString(),
                    };
                    return [...prev, newResult];
                }
                return prev;
            });
        }, 2000);
        return () => clearInterval(interval);
    }, [activeQfa, userProfiles]);

    const handleEndAssessment = () => {
        if (!activeQfa) return;
        const updatedQfas: QuickFormativeAssessment[] = quickFormativeAssessments.map(q => q.id === activeQfa.id ? { ...q, status: 'completed' } : q);
        handleSaveQfas(updatedQfas);
    };

    if (activeQfa) {
        return <LiveAssessmentDashboard assessment={activeQfa} results={qfaResults} onEnd={handleEndAssessment} />;
    }
    
    return (
        <div>
            <TeacherTimetable 
                schedule={scheduleForView} 
                attendance={attendanceRecords}
                onTakeAttendance={setAttendanceModalSchedule}
                onCreateQfa={setCreateQfaModalSchedule}
            />
            {attendanceModalSchedule && (
                <AttendanceModal
                    isOpen={!!attendanceModalSchedule}
                    onClose={() => setAttendanceModalSchedule(null)}
                    schedule={attendanceModalSchedule}
                    students={userProfiles.filter(p => p.grade === attendanceModalSchedule.grade)}
                    onSave={handleSaveAttendance}
                />
            )}
            {createQfaModalSchedule && (
                <CreateQfaModal
                    isOpen={!!createQfaModalSchedule}
                    onClose={() => setCreateQfaModalSchedule(null)}
                    schedule={createQfaModalSchedule}
                    onCreate={handleCreateQfa}
                />
            )}
        </div>
    );
};

// --- SUB-COMPONENTS ---

const TimetableRow: React.FC<{ item: TeacherSchedule, isAttendanceTaken: boolean, onTakeAttendance: () => void, onCreateQfa: () => void }> = ({ item, isAttendanceTaken, onTakeAttendance, onCreateQfa }) => {
    const { handleUpdateTeacherSchedule } = useAuth();
    const [isLogging, setIsLogging] = useState(false);
    const [notes, setNotes] = useState(item.notes || '');

    const handleSaveLog = () => {
        handleUpdateTeacherSchedule(item.id, { isTaught: true, notes: notes });
        setIsLogging(false);
    };

    return (
        <div className="p-4 bg-white rounded-lg border flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                 <div className="flex-grow">
                    <div className="flex items-center gap-4">
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{item.time}</span>
                        <div>
                            <p className="font-bold text-slate-800">Class {item.grade} - {item.subject}</p>
                            <p className="text-sm text-slate-500">{item.topic}</p>
                        </div>
                    </div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                    <button onClick={onTakeAttendance} disabled={isAttendanceTaken} className="btn text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:bg-emerald-100 disabled:text-emerald-700">
                        {isAttendanceTaken ? "Attendance Taken" : "Take Attendance"}
                    </button>
                    <button onClick={onCreateQfa} className="btn text-sm bg-slate-100 text-slate-700 hover:bg-slate-200">Exit Ticket</button>
                    {!item.isTaught && !isLogging && <button onClick={() => setIsLogging(true)} className="btn text-sm bg-blue-100 text-blue-700 hover:bg-blue-200">Mark as Taught</button>}
                </div>
            </div>

            {item.isTaught && (
                <div className="p-3 bg-emerald-50 border-l-4 border-emerald-400 rounded-r-lg flex items-center gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                    <div>
                        <p className="font-bold text-sm text-emerald-800">Topic Taught</p>
                        {item.notes && <p className="text-xs text-slate-600 mt-1 italic">Note: "{item.notes}"</p>}
                    </div>
                </div>
            )}
            
            {isLogging && !item.isTaught && (
                 <div className="p-3 bg-blue-50 border-blue-200 border rounded-lg space-y-2">
                     <label className="font-semibold text-sm flex items-center gap-2"><BookIcon className="w-4 h-4" /> Add a Log Note (Optional)</label>
                     <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="form-textarea w-full text-sm" placeholder="e.g., Students found the concept of osmosis challenging."></textarea>
                     <div className="flex gap-2 justify-end">
                         <button onClick={() => setIsLogging(false)} className="btn text-xs bg-slate-200">Cancel</button>
                         <button onClick={handleSaveLog} className="btn btn-primary text-xs">Save Log</button>
                     </div>
                 </div>
            )}
        </div>
    );
};

const TeacherTimetable: React.FC<{
    schedule: TeacherSchedule[];
    attendance: AttendanceRecord;
    onTakeAttendance: (schedule: TeacherSchedule) => void;
    onCreateQfa: (schedule: TeacherSchedule) => void;
}> = ({ schedule, attendance, onTakeAttendance, onCreateQfa }) => {
    return (
        <div>
            <h3 className="font-bold text-lg mb-4">Today's Schedule</h3>
            <div className="space-y-4">
                {schedule.map(item => (
                    <TimetableRow 
                        key={item.id}
                        item={item}
                        isAttendanceTaken={!!attendance[item.id]}
                        onTakeAttendance={() => onTakeAttendance(item)}
                        onCreateQfa={() => onCreateQfa(item)}
                    />
                ))}
            </div>
        </div>
    );
};

const AttendanceModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    schedule: TeacherSchedule;
    students: UserProfile[];
    onSave: (scheduleId: string, attendance: { [studentId: number]: 'present' | 'absent' }) => void;
}> = ({ isOpen, onClose, schedule, students, onSave }) => {
    const [attendance, setAttendance] = useState<{ [studentId: number]: 'present' | 'absent' }>({});

    useEffect(() => {
        // Initialize all as present
        const initial = students.reduce((acc, student) => {
            acc[student.id] = 'present';
            return acc;
        }, {} as { [studentId: number]: 'present' | 'absent' });
        setAttendance(initial);
    }, [students]);

    const toggleStatus = (studentId: number) => {
        setAttendance(prev => ({ ...prev, [studentId]: prev[studentId] === 'present' ? 'absent' : 'present' }));
    };

    const handleSave = () => {
        onSave(schedule.id, attendance);
        onClose();
        alert('Attendance saved. Catch-up assignments have been automatically created for absent students.');
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-lg mb-2">Take Attendance</h3>
                <p className="text-sm text-slate-500 mb-4">Class {schedule.grade} - {schedule.subject} ({schedule.time})</p>
                <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                    {students.map(student => (
                        <div key={student.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                            <span className="font-semibold">{student.name}</span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => toggleStatus(student.id)} className={`px-3 py-1 text-xs rounded-full ${attendance[student.id] === 'present' ? 'bg-emerald-500 text-white' : 'bg-slate-200'}`}>Present</button>
                                <button onClick={() => toggleStatus(student.id)} className={`px-3 py-1 text-xs rounded-full ${attendance[student.id] === 'absent' ? 'bg-red-500 text-white' : 'bg-slate-200'}`}>Absent</button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex gap-4">
                    <button onClick={onClose} className="btn w-full bg-slate-200">Cancel</button>
                    <button onClick={handleSave} className="btn btn-primary w-full">Save Attendance</button>
                </div>
            </div>
        </div>
    );
};

const CreateQfaModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    schedule: TeacherSchedule;
    onCreate: (data: Omit<QuickFormativeAssessment, 'id' | 'createdAt' | 'status'>) => void;
}> = ({ isOpen, onClose, schedule, onCreate }) => {
    const [title, setTitle] = useState(`Exit Ticket: ${schedule.topic}`);
    const [questions, setQuestions] = useState([{ text: '', answer: '' }]);

    const handleAddQuestion = () => setQuestions(prev => [...prev, { text: '', answer: '' }]);
    const handleQuestionChange = (index: number, field: 'text' | 'answer', value: string) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const handleCreate = () => {
        if (questions.some(q => !q.text.trim() || !q.answer.trim())) {
            alert('Please fill out all question and answer fields.');
            return;
        }
        onCreate({ title, grade: schedule.grade, scheduleId: schedule.id, questions });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-lg mb-4">Create Quick Assessment</h3>
                <div className="space-y-4">
                    <div>
                        <label className="form-label">Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="form-input w-full" />
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {questions.map((q, i) => (
                            <div key={i} className="p-3 bg-slate-50 rounded-lg border">
                                <label className="form-label text-sm">Question {i+1}</label>
                                <input type="text" value={q.text} onChange={e => handleQuestionChange(i, 'text', e.target.value)} className="form-input w-full text-sm" placeholder="Question text"/>
                                <input type="text" value={q.answer} onChange={e => handleQuestionChange(i, 'answer', e.target.value)} className="form-input w-full text-sm mt-2" placeholder="Correct answer"/>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleAddQuestion} className="btn text-sm w-full bg-slate-200">Add Another Question</button>
                </div>
                 <div className="mt-6 flex gap-4">
                    <button onClick={onClose} className="btn w-full bg-slate-200">Cancel</button>
                    <button onClick={handleCreate} className="btn btn-primary w-full">Launch Assessment</button>
                </div>
            </div>
        </div>
    );
};

const LiveAssessmentDashboard: React.FC<{
    assessment: QuickFormativeAssessment;
    results: QfaResult[];
    onEnd: () => void;
}> = ({ assessment, results, onEnd }) => {
    const { userProfiles } = useAuth();
    const [remediationGroups, setRemediationGroups] = useState<RemediationGroup[] | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const studentsInGrade = useMemo(() => userProfiles.filter(p => p.grade === assessment.grade), [userProfiles, assessment.grade]);
    const submittedStudentIds = new Set(results.map(r => r.studentId));
    const notSubmittedStudents = studentsInGrade.filter(s => !submittedStudentIds.has(s.id));

    const handleGenerateRemediation = async () => {
        setIsAnalyzing(true);
        try {
            const groups = await generateQfaRemediation(assessment, results);
            setRemediationGroups(groups);
        } catch (e) { console.error(e); } finally {
            setIsAnalyzing(false);
        }
    };
    
    if (assessment.status === 'completed') {
        // Post-assessment view
        return (
            <div className="p-4 bg-white rounded-lg border">
                <h3 className="font-bold text-lg mb-4">Assessment Results: {assessment.title}</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                     <StatCard title="Submissions" value={`${results.length} / ${studentsInGrade.length}`} icon={<ClipboardCheckIcon className="w-6 h-6"/>} />
                     <StatCard title="Avg. Score" value="N/A" icon={<SparklesIcon className="w-6 h-6"/>} />
                </div>
                <div className="text-center">
                    <button onClick={handleGenerateRemediation} disabled={isAnalyzing} className="btn btn-primary flex items-center gap-2 mx-auto">
                        <SparklesIcon className="w-5 h-5"/>
                        {isAnalyzing ? "AI is Analyzing..." : "AI: Create Remediation Groups"}
                    </button>
                </div>
                {remediationGroups && (
                    <div className="mt-6 space-y-4">
                        {remediationGroups.map((group, i) => (
                            <div key={i} className="p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-lg">
                                <h4 className="font-bold text-indigo-800">{group.competency}</h4>
                                <p className="text-sm mt-1"><strong>Students:</strong> {group.students.join(', ')}</p>
                                <p className="text-sm mt-2 p-2 bg-white rounded border"><strong>Suggested Task:</strong> {group.suggestedTask}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="p-4 bg-white rounded-lg border animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-red-600 animate-pulse">Live Assessment: {assessment.title}</h3>
                <button onClick={onEnd} className="btn bg-red-500 hover:bg-red-600 text-white">End Assessment</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-semibold mb-2">Submissions ({results.length}/{studentsInGrade.length})</h4>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {results.map(res => (
                            <div key={res.studentId} className="p-2 bg-emerald-50 rounded-lg flex items-center gap-2">
                                <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                                <span className="font-medium text-sm">{res.studentName}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold mb-2">Waiting For ({notSubmittedStudents.length})</h4>
                     <div className="space-y-2 max-h-80 overflow-y-auto">
                        {notSubmittedStudents.map(student => (
                            <div key={student.id} className="p-2 bg-slate-100 rounded-lg">
                                <span className="font-medium text-sm text-slate-500">{student.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClassroomCore;