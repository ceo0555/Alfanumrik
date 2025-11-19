import React, { Suspense, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { View } from '../../App';
import { Assignment } from '../../types';

const TeacherLmsView = React.lazy(() => import('./TeacherLmsView'));
const StudentLmsView = React.lazy(() => import('./StudentLmsView'));
const LmsLanding = React.lazy(() => import('./LmsLanding'));

interface LmsDashboardProps {
    setView?: (view: View) => void;
    setActiveQuiz?: (assignment: Assignment) => void;
}

const LmsDashboard: React.FC<LmsDashboardProps> = ({ setView, setActiveQuiz }) => {
    const { activeProfile, allCourses } = useAuth();
    const [showLanding, setShowLanding] = useState(false);

    if (!activeProfile) {
        return <div className="text-center p-8">Loading profile...</div>;
    }

    // Check if user is a first-time visitor (no courses enrolled/created)
    const isFirstTimeUser = activeProfile.schoolRole 
        ? allCourses.filter(c => c.teacherId === activeProfile.id).length === 0
        : allCourses.filter(c => c.enrolledStudentIds.includes(activeProfile.id)).length === 0;

    // Show landing page if it's a first-time user or explicitly requested
    if (showLanding || isFirstTimeUser) {
        return (
            <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
                <LmsLanding onGetStarted={() => setShowLanding(false)} />
            </Suspense>
        );
    }

    if (activeProfile.schoolRole) { // Teacher or Principal view
        return (
            <Suspense fallback={<div className="text-center p-8">Loading Teacher Dashboard...</div>}>
                <TeacherLmsView />
            </Suspense>
        );
    } else { // Student view
        return (
            <Suspense fallback={<div className="text-center p-8">Loading Your Courses...</div>}>
                <StudentLmsView setView={setView!} setActiveQuiz={setActiveQuiz!} />
            </Suspense>
        );
    }
};

export default LmsDashboard;
