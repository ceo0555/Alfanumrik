import React, { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface AnnouncementsTabProps {
    selectedGrade: string | null;
    setIsCreateAnnouncementOpen: (isOpen: boolean) => void;
}

const AnnouncementsTab: React.FC<AnnouncementsTabProps> = ({ selectedGrade, setIsCreateAnnouncementOpen }) => {
    const { allAnnouncements } = useAuth();
    
    const announcementsToDisplay = useMemo(() => {
        return selectedGrade ? allAnnouncements.filter(a => a.grade === selectedGrade) : allAnnouncements;
    }, [allAnnouncements, selectedGrade]);

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button onClick={() => setIsCreateAnnouncementOpen(true)} className="btn btn-primary" disabled={!selectedGrade}>
                    Create Announcement
                </button>
            </div>
            <div className="space-y-4">
                {announcementsToDisplay.length > 0 ? announcementsToDisplay.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(announcement => (
                    <div key={announcement.id} className="p-4 bg-slate-50 border rounded-lg">
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-slate-800">{announcement.title}</h4>
                            <span className="text-xs text-slate-500">{new Date(announcement.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{announcement.content}</p>
                    </div>
                )) : (
                    <div className="text-center py-12 text-slate-500">
                        <p>No announcements found for the selected grade.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnnouncementsTab;