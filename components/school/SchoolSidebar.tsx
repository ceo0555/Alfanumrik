import React from 'react';
import { SchoolTab } from '../SchoolDashboard';
import { useAuth } from '../../contexts/AuthContext';
import { BarChartIcon, UsersIcon, ClipboardListIcon, FileTextIcon, ClipboardCheckIcon, TargetIcon, CpuIcon, CalendarDaysIcon, SpeakerIcon, DollarSignIcon, TrendingUpIcon, SchoolIcon } from '../../constants/icons';

interface SchoolSidebarProps {
    activeTab: SchoolTab;
    setActiveTab: (tab: SchoolTab) => void;
}

const SchoolSidebar: React.FC<SchoolSidebarProps> = ({ activeTab, setActiveTab }) => {
    const { activeProfile } = useAuth();
    const schoolRole = activeProfile?.schoolRole;
    
    const NavLink: React.FC<{ tab: SchoolTab, label: string, icon: React.ReactNode }> = ({ tab, label, icon }) => {
        const isActive = activeTab === tab;
        return (
            <button 
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors ${isActive ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
                {icon}
                <span>{label}</span>
            </button>
        );
    };

    const NavGroup: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
        <div>
            <h4 className="px-3 text-xs font-bold uppercase text-slate-400 mb-2">{title}</h4>
            <div className="space-y-1">{children}</div>
        </div>
    );

    return (
        <aside className="w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col">
            <div className="flex items-center gap-3 h-16 px-4 border-b border-slate-200">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-inner">
                    <SchoolIcon className="w-6 h-6 text-white"/>
                </div>
                <div>
                    <span className="text-lg font-bold font-poppins">School OS</span>
                    <p className="text-xs text-slate-500 -mt-1">{activeProfile?.name} ({schoolRole})</p>
                </div>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
                <NavGroup title="Academics">
                    <NavLink tab="overview" label="Overview" icon={<BarChartIcon className="w-5 h-5"/>} />
                    <NavLink tab="classroom" label="Classroom Core" icon={<ClipboardCheckIcon className="w-5 h-5"/>} />
                    <NavLink tab="students" label="Students" icon={<UsersIcon className="w-5 h-5"/>} />
                    <NavLink tab="assignments" label="Assignments" icon={<ClipboardListIcon className="w-5 h-5"/>} />
                    <NavLink tab="reports" label="Reports" icon={<FileTextIcon className="w-5 h-5"/>} />
                </NavGroup>

                <NavGroup title="Assessment">
                     <NavLink tab="exam_suite" label="Exam Suite" icon={<FileTextIcon className="w-5 h-5"/>} />
                     <NavLink tab="diagnostics" label="Diagnostics" icon={<TargetIcon className="w-5 h-5"/>} />
                </NavGroup>
                
                 <NavGroup title="Enrichment">
                    <NavLink tab="ai_coding" label="AI & Coding" icon={<CpuIcon className="w-5 h-5"/>} />
                </NavGroup>

                {schoolRole === 'principal' && (
                    <NavGroup title="Administration">
                        <NavLink tab="board_planner" label="Board Planner" icon={<CalendarDaysIcon className="w-5 h-5"/>} />
                        <NavLink tab="announcements" label="Announcements" icon={<SpeakerIcon className="w-5 h-5"/>} />
                    </NavGroup>
                )}
                
                {schoolRole === 'principal' && (
                    <NavGroup title="Operations">
                        <NavLink tab="finance_ops" label="Finance & Ops" icon={<DollarSignIcon className="w-5 h-5"/>} />
                        <NavLink tab="growth" label="Growth" icon={<TrendingUpIcon className="w-5 h-5"/>} />
                    </NavGroup>
                )}
            </nav>
        </aside>
    );
};

export default SchoolSidebar;