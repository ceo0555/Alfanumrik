import React, { useState, Suspense } from 'react';
import { Course } from '../../types';
import { ArrowLeftIcon, XIcon, PlusIcon, BookIcon, ClipboardListIcon, DragIcon, UsersIcon, ChartBarIcon } from '../../constants/icons';
import { useAuth } from '../../contexts/AuthContext';
import Gradebook from './Gradebook';

const AddContentModal = React.lazy(() => import('./AddContentModal'));
const EnrollStudentModal = React.lazy(() => import('./EnrollStudentModal'));

interface CourseEditorProps {
    course: Course;
    onBack: () => void;
}

const CourseEditor: React.FC<CourseEditorProps> = ({ course, onBack }) => {
    const { allCourses, handleUpdateCourses, userProfiles } = useAuth();
    const [activeTab, setActiveTab] = useState<'content' | 'students' | 'gradebook'>('content');
    const [isAddContentOpen, setIsAddContentOpen] = useState(false);
    const [isEnrollStudentOpen, setIsEnrollStudentOpen] = useState(false);
    
    const updateCourse = (updatedCourse: Course) => {
        const updatedCourses = allCourses.map(c => c.id === updatedCourse.id ? updatedCourse : c);
        handleUpdateCourses(updatedCourses);
    };

    const handleAddContent = (contentIds: { id: string, name: string }[]) => {
        const newContent = contentIds.map(c => ({
            type: 'lesson' as 'lesson' | 'quiz',
            contentId: c.id,
            title: c.name
        }));
        
        const updatedCourse = {
            ...course,
            content: [...course.content, ...newContent.filter(nc => !course.content.some(oc => oc.contentId === nc.contentId))]
        };
        updateCourse(updatedCourse);
        setIsAddContentOpen(false);
    };
    
    const handleEnrollStudents = (studentIds: number[]) => {
        const updatedCourse = { ...course, enrolledStudentIds: studentIds };
        updateCourse(updatedCourse);
        setIsEnrollStudentOpen(false);
    };

    const handleRemoveContent = (contentIdToRemove: string) => {
        if (window.confirm("Are you sure you want to remove this content item from the course?")) {
            const updatedCourse = {
                ...course,
                content: course.content.filter(c => c.contentId !== contentIdToRemove)
            };
            updateCourse(updatedCourse);
        }
    };

    const enrolledStudents = userProfiles.filter(p => course.enrolledStudentIds.includes(p.id));

    return (
        <div>
            {/* Header with Back Button */}
            <button onClick={onBack} className="btn bg-slate-100 text-slate-700 hover:bg-slate-200 mb-6 flex items-center gap-2">
                <ArrowLeftIcon className="w-4 h-4"/> Back to Courses
            </button>

            {/* Course Header Card */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl p-6 mb-6 shadow-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-extrabold">{course.title}</h1>
                        <p className="text-indigo-100 mt-2">{course.description}</p>
                        <div className="flex items-center gap-4 mt-4 text-sm">
                            <div className="flex items-center gap-1">
                                <UsersIcon className="w-4 h-4" />
                                <span>{course.enrolledStudentIds.length} students</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <BookIcon className="w-4 h-4" />
                                <span>{course.content.length} items</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <ClipboardListIcon className="w-4 h-4" />
                                <span>{course.content.filter(i => i.type === 'quiz').length} assessments</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
                        <span className="text-xs font-semibold">Class {course.grade}</span>
                    </div>
                </div>
            </div>
            
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border mb-6">
                <div className="flex border-b">
                    <button 
                        onClick={() => setActiveTab('content')} 
                        className={`flex-1 py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
                            activeTab === 'content' 
                                ? 'border-indigo-500 text-indigo-600 bg-indigo-50' 
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        <BookIcon className="w-4 h-4 inline mr-2" />
                        Content
                    </button>
                    <button 
                        onClick={() => setActiveTab('students')} 
                        className={`flex-1 py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
                            activeTab === 'students' 
                                ? 'border-indigo-500 text-indigo-600 bg-indigo-50' 
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        <UsersIcon className="w-4 h-4 inline mr-2" />
                        Students
                    </button>
                    <button 
                        onClick={() => setActiveTab('gradebook')} 
                        className={`flex-1 py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
                            activeTab === 'gradebook' 
                                ? 'border-indigo-500 text-indigo-600 bg-indigo-50' 
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        <ChartBarIcon className="w-4 h-4 inline mr-2" />
                        Gradebook
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'content' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-slate-800">Course Content</h3>
                                <button 
                                    onClick={() => setIsAddContentOpen(true)} 
                                    className="btn btn-primary flex items-center gap-2"
                                >
                                    <PlusIcon className="w-4 h-4" /> Add Content
                                </button>
                            </div>
                            
                            {course.content.length > 0 ? (
                                <div className="space-y-2">
                                    {course.content.map((item, idx) => (
                                        <div 
                                            key={item.contentId} 
                                            className="group p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all flex items-center gap-3"
                                        >
                                            <DragIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-indigo-100 rounded-lg text-indigo-600 font-semibold text-sm">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    {item.type === 'lesson' ? (
                                                        <BookIcon className="w-4 h-4 text-emerald-600" />
                                                    ) : (
                                                        <ClipboardListIcon className="w-4 h-4 text-amber-600" />
                                                    )}
                                                    <span className="font-semibold text-slate-800">{item.title}</span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                                                        {item.type}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveContent(item.contentId)}
                                                className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-100 text-red-500 transition-all"
                                                aria-label={`Remove ${item.title}`}
                                            >
                                                <XIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                                    <BookIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                    <p className="text-slate-600 font-semibold mb-2">No content added yet</p>
                                    <p className="text-sm text-slate-500 mb-4">Start building your course by adding lessons and assessments</p>
                                    <button 
                                        onClick={() => setIsAddContentOpen(true)} 
                                        className="btn btn-primary"
                                    >
                                        <PlusIcon className="w-4 h-4 inline mr-2" /> Add Your First Content
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {activeTab === 'students' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-slate-800">Enrolled Students</h3>
                                <button 
                                    onClick={() => setIsEnrollStudentOpen(true)} 
                                    className="btn btn-primary flex items-center gap-2"
                                >
                                    <PlusIcon className="w-4 h-4" /> Manage Enrollment
                                </button>
                            </div>
                            
                            {enrolledStudents.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {enrolledStudents.map(student => (
                                        <div key={student.id} className="p-4 bg-slate-50 rounded-lg border">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-slate-800">{student.name}</p>
                                                    <p className="text-xs text-slate-500">Class {student.grade}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                                    <UsersIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                    <p className="text-slate-600 font-semibold mb-2">No students enrolled</p>
                                    <p className="text-sm text-slate-500 mb-4">Add students to start tracking their progress</p>
                                    <button 
                                        onClick={() => setIsEnrollStudentOpen(true)} 
                                        className="btn btn-primary"
                                    >
                                        <PlusIcon className="w-4 h-4 inline mr-2" /> Enroll Students
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {activeTab === 'gradebook' && (
                        <Gradebook course={course} />
                    )}
                </div>
            </div>
            
            {isAddContentOpen && (
                <Suspense>
                    <AddContentModal 
                        isOpen={isAddContentOpen}
                        onClose={() => setIsAddContentOpen(false)}
                        courseGrade={course.grade}
                        onAddContent={handleAddContent}
                    />
                </Suspense>
            )}
            
            {isEnrollStudentOpen && (
                <Suspense>
                    <EnrollStudentModal
                        isOpen={isEnrollStudentOpen}
                        onClose={() => setIsEnrollStudentOpen(false)}
                        course={course}
                        onSave={handleEnrollStudents}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default CourseEditor;