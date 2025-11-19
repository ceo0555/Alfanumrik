import React, { useState } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { 
    SchoolIcon, 
    ChartBarIcon, 
    UserGroupIcon, 
    TrendingUpIcon,
    BrushIcon,
    UploadIcon,
    CheckCircleIcon
} from '../../constants/icons';
import SuperAdminDashboard from './SuperAdminDashboard';
import PilotMonitoring from './PilotMonitoring';
import PilotReporting from './PilotReporting';
import BulkImportModal from './BulkImportModal';
import SchoolBrandingEditor from './SchoolBrandingEditor';

type TabType = 'overview' | 'monitoring' | 'reporting' | 'schools';

const PilotDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [importType, setImportType] = useState<'students' | 'teachers'>('students');
    const [isBrandingOpen, setIsBrandingOpen] = useState(false);
    const { schools } = useSchool();

    const totalStudents = schools.reduce((sum, s) => sum + s.totalStudents, 0);
    const totalTeachers = schools.reduce((sum, s) => sum + s.totalTeachers, 0);
    const activeSchools = schools.filter(s => s.isActive).length;

    const openBulkImport = (type: 'students' | 'teachers') => {
        setImportType(type);
        setIsBulkImportOpen(true);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-lg">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-extrabold mb-1">🚀 Pilot Program Dashboard</h1>
                            <p className="text-purple-100">Managing 50,000 students across 10 schools</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsBrandingOpen(true)}
                                className="btn bg-white/20 hover:bg-white/30 text-white border-0 flex items-center gap-2"
                            >
                                <BrushIcon className="w-5 h-5" />
                                Branding
                            </button>
                            <button
                                onClick={() => openBulkImport('students')}
                                className="btn bg-white/20 hover:bg-white/30 text-white border-0 flex items-center gap-2"
                            >
                                <UploadIcon className="w-5 h-5" />
                                Bulk Import
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-white border-b shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="flex gap-6 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`py-4 px-2 font-semibold border-b-2 whitespace-nowrap flex items-center gap-2 ${
                                activeTab === 'overview' 
                                    ? 'border-indigo-600 text-indigo-600' 
                                    : 'border-transparent text-slate-600 hover:text-slate-800'
                            }`}
                        >
                            <TrendingUpIcon className="w-5 h-5" />
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('schools')}
                            className={`py-4 px-2 font-semibold border-b-2 whitespace-nowrap flex items-center gap-2 ${
                                activeTab === 'schools' 
                                    ? 'border-indigo-600 text-indigo-600' 
                                    : 'border-transparent text-slate-600 hover:text-slate-800'
                            }`}
                        >
                            <SchoolIcon className="w-5 h-5" />
                            Schools ({schools.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('monitoring')}
                            className={`py-4 px-2 font-semibold border-b-2 whitespace-nowrap flex items-center gap-2 ${
                                activeTab === 'monitoring' 
                                    ? 'border-indigo-600 text-indigo-600' 
                                    : 'border-transparent text-slate-600 hover:text-slate-800'
                            }`}
                        >
                            <CheckCircleIcon className="w-5 h-5" />
                            System Health
                        </button>
                        <button
                            onClick={() => setActiveTab('reporting')}
                            className={`py-4 px-2 font-semibold border-b-2 whitespace-nowrap flex items-center gap-2 ${
                                activeTab === 'reporting' 
                                    ? 'border-indigo-600 text-indigo-600' 
                                    : 'border-transparent text-slate-600 hover:text-slate-800'
                            }`}
                        >
                            <ChartBarIcon className="w-5 h-5" />
                            Analytics & Reports
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats Banner */}
            {activeTab === 'overview' && (
                <div className="bg-white border-b">
                    <div className="container mx-auto px-4 py-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                                <p className="text-purple-100 text-sm font-medium">Total Schools</p>
                                <p className="text-3xl font-bold mt-1">{schools.length}</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                                <p className="text-blue-100 text-sm font-medium">Active Schools</p>
                                <p className="text-3xl font-bold mt-1">{activeSchools}</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
                                <p className="text-green-100 text-sm font-medium">Total Students</p>
                                <p className="text-3xl font-bold mt-1">{totalStudents.toLocaleString()}</p>
                            </div>
                            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-4 text-white">
                                <p className="text-indigo-100 text-sm font-medium">Total Teachers</p>
                                <p className="text-3xl font-bold mt-1">{totalTeachers.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        <div className="bg-white rounded-xl shadow-md p-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">Welcome to the Pilot Program</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg text-slate-700">Platform Features</h3>
                                    <ul className="space-y-2">
                                        {[
                                            'Multi-school management with data isolation',
                                            'Bulk import for students and teachers',
                                            'Real-time performance monitoring',
                                            'Comprehensive analytics and reporting',
                                            'School-specific branding and customization',
                                            'Role-based access control (RBAC)',
                                            'Virtualized lists for 50,000+ users',
                                            'Audit logging for compliance',
                                        ].map((feature, index) => (
                                            <li key={index} className="flex items-center gap-2">
                                                <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                                                <span className="text-slate-700">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg text-slate-700">Quick Actions</h3>
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => openBulkImport('students')}
                                            className="btn bg-blue-500 hover:bg-blue-600 text-white w-full flex items-center justify-center gap-2"
                                        >
                                            <UserGroupIcon className="w-5 h-5" />
                                            Import Students
                                        </button>
                                        <button
                                            onClick={() => openBulkImport('teachers')}
                                            className="btn bg-indigo-500 hover:bg-indigo-600 text-white w-full flex items-center justify-center gap-2"
                                        >
                                            <UserGroupIcon className="w-5 h-5" />
                                            Import Teachers
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('reporting')}
                                            className="btn bg-purple-500 hover:bg-purple-600 text-white w-full flex items-center justify-center gap-2"
                                        >
                                            <ChartBarIcon className="w-5 h-5" />
                                            View Reports
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('monitoring')}
                                            className="btn bg-green-500 hover:bg-green-600 text-white w-full flex items-center justify-center gap-2"
                                        >
                                            <CheckCircleIcon className="w-5 h-5" />
                                            System Health
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'schools' && <SuperAdminDashboard />}
                {activeTab === 'monitoring' && <PilotMonitoring />}
                {activeTab === 'reporting' && <PilotReporting />}
            </main>

            {/* Modals */}
            <BulkImportModal
                isOpen={isBulkImportOpen}
                onClose={() => setIsBulkImportOpen(false)}
                type={importType}
            />
            <SchoolBrandingEditor
                isOpen={isBrandingOpen}
                onClose={() => setIsBrandingOpen(false)}
            />
        </div>
    );
};

export default PilotDashboard;
