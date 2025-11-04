import React, { Suspense } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { View } from '../../App';
import { Assignment } from '../../types';

const TeacherLmsView = React.lazy(() => import('./TeacherLmsView'));
const StudentLmsView = React.lazy(() => import('./StudentLmsView'));

interface LmsDashboardProps {
    setView?: (view: View) => void;
    setActiveQuiz?: (assignment: Assignment) => void;
}

const LmsDashboard: React.FC<LmsDashboardProps> = ({ setView, setActiveQuiz }) => {
    const { activeProfile } = useAuth();

    if (!activeProfile) {
        return <div className="text-center p-8">Loading profile...</div>;
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
