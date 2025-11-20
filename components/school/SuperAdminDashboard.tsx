import React, { useState, useMemo } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { 
    SchoolIcon, 
    UserGroupIcon, 
    ChartBarIcon, 
    TrendingUpIcon,
    CheckCircleIcon,
    TriangleAlertIcon,
    RefreshCwIcon
} from '../../constants/icons';
import { School } from '../../types';

const SuperAdminDashboard: React.FC = () => {
    const { schools, activeSchool, setActiveSchool, performanceMetrics, loadPerformanceMetrics } = useSchool();
    const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

    const selectedSchool = useMemo(() => {
        return schools.find(s => s.id === selectedSchoolId) || null;
    }, [schools, selectedSchoolId]);

    const totalStats = useMemo(() => {
        return {
            totalSchools: schools.length,
            activeSchools: schools.filter(s => s.isActive).length,
            totalStudents: schools.reduce((sum, s) => sum + s.totalStudents, 0),
            totalTeachers: schools.reduce((sum, s) => sum + s.totalTeachers, 0),
            avgStudentsPerSchool: Math.round(schools.reduce((sum, s) => sum + s.totalStudents, 0) / schools.length),
        };
    }, [schools]);

    const getStatusColor = (school: School) => {
        const expiryDate = new Date(school.subscriptionExpiry);
        const now = new Date();
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (!school.isActive) return 'bg-red-100 text-red-700';
        if (daysUntilExpiry < 30) return 'bg-yellow-100 text-yellow-700';
        return 'bg-green-100 text-green-700';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-extrabold mb-2">Super Admin Dashboard</h1>
                        <p className="text-purple-100">Multi-School Management & Analytics</p>
                    </div>
                    <button
                        onClick={loadPerformanceMetrics}
                        className="btn bg-white/20 hover:bg-white/30 text-white border-0 flex items-center gap-2"
                    >
                        <RefreshCwIcon className="w-5 h-5" />
                        Refresh Metrics
                    </button>
                </div>
            </div>

            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 font-semibold">Total Schools</p>
                            <p className="text-3xl font-bold text-slate-800 mt-1">{totalStats.totalSchools}</p>
                        </div>
                        <SchoolIcon className="w-12 h-12 text-purple-500 opacity-80" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 font-semibold">Active Schools</p>
                            <p className="text-3xl font-bold text-slate-800 mt-1">{totalStats.activeSchools}</p>
                        </div>
                        <CheckCircleIcon className="w-12 h-12 text-green-500 opacity-80" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 font-semibold">Total Students</p>
                            <p className="text-3xl font-bold text-slate-800 mt-1">{totalStats.totalStudents.toLocaleString()}</p>
                        </div>
                        <UserGroupIcon className="w-12 h-12 text-blue-500 opacity-80" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 font-semibold">Total Teachers</p>
                            <p className="text-3xl font-bold text-slate-800 mt-1">{totalStats.totalTeachers.toLocaleString()}</p>
                        </div>
                        <UserGroupIcon className="w-12 h-12 text-indigo-500 opacity-80" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 font-semibold">Avg per School</p>
                            <p className="text-3xl font-bold text-slate-800 mt-1">{totalStats.avgStudentsPerSchool.toLocaleString()}</p>
                        </div>
                        <ChartBarIcon className="w-12 h-12 text-orange-500 opacity-80" />
                    </div>
                </div>
            </div>

            {/* Platform Metrics */}
            {performanceMetrics && (
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <TrendingUpIcon className="w-6 h-6 text-indigo-600" />
                        Platform Performance Metrics
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-indigo-600">{performanceMetrics.activeUsers.toLocaleString()}</p>
                            <p className="text-sm text-slate-600 mt-1">Active Users</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-green-600">{performanceMetrics.totalLogins.toLocaleString()}</p>
                            <p className="text-sm text-slate-600 mt-1">Total Logins</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-blue-600">{performanceMetrics.avgSessionDuration}m</p>
                            <p className="text-sm text-slate-600 mt-1">Avg Session</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-purple-600">{performanceMetrics.apiResponseTime}ms</p>
                            <p className="text-sm text-slate-600 mt-1">API Response</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-orange-600">{performanceMetrics.errorRate.toFixed(2)}%</p>
                            <p className="text-sm text-slate-600 mt-1">Error Rate</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Schools Grid */}
            <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">School Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {schools.map(school => (
                        <button
                            key={school.id}
                            onClick={() => setSelectedSchoolId(school.id)}
                            className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 text-left border-2 ${
                                selectedSchoolId === school.id ? 'border-indigo-500' : 'border-transparent'
                            }`}
                        >
                            {/* School Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div 
                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                                            style={{ backgroundColor: school.primaryColor }}
                                        >
                                            {school.code}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800">{school.name}</h3>
                                            <p className="text-xs text-slate-500">Est. {school.established}</p>
                                        </div>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(school)}`}>
                                    {school.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-blue-50 rounded-lg p-3">
                                    <p className="text-2xl font-bold text-blue-700">{school.totalStudents.toLocaleString()}</p>
                                    <p className="text-xs text-blue-600">Students</p>
                                </div>
                                <div className="bg-indigo-50 rounded-lg p-3">
                                    <p className="text-2xl font-bold text-indigo-700">{school.totalTeachers}</p>
                                    <p className="text-xs text-indigo-600">Teachers</p>
                                </div>
                            </div>

                            {/* Principal */}
                            <p className="text-sm text-slate-600 mb-2">
                                <span className="font-semibold">Principal:</span> {school.principalName}
                            </p>

                            {/* Subscription */}
                            <div className="flex items-center justify-between text-xs">
                                <span className={`px-2 py-1 rounded-full font-semibold ${
                                    school.subscriptionTier === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                                    school.subscriptionTier === 'premium' ? 'bg-blue-100 text-blue-700' :
                                    'bg-slate-100 text-slate-700'
                                }`}>
                                    {school.subscriptionTier.toUpperCase()}
                                </span>
                                <span className="text-slate-500">
                                    Expires: {new Date(school.subscriptionExpiry).toLocaleDateString()}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Selected School Details */}
            {selectedSchool && (
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-800 mb-2">{selectedSchool.name}</h2>
                            <p className="text-slate-600">{selectedSchool.address}</p>
                        </div>
                        <button
                            onClick={() => setActiveSchool(selectedSchool.id)}
                            className="btn btn-primary"
                        >
                            Switch to School
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Contact Info */}
                        <div>
                            <h3 className="font-semibold text-slate-700 mb-3">Contact Information</h3>
                            <div className="space-y-2 text-sm">
                                <p><span className="font-semibold">Email:</span> {selectedSchool.contactEmail}</p>
                                <p><span className="font-semibold">Phone:</span> {selectedSchool.contactPhone}</p>
                                <p><span className="font-semibold">Principal:</span> {selectedSchool.principalName}</p>
                            </div>
                        </div>

                        {/* Settings */}
                        <div>
                            <h3 className="font-semibold text-slate-700 mb-3">Settings</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    {selectedSchool.settings.enableLMS ? 
                                        <CheckCircleIcon className="w-4 h-4 text-green-600" /> : 
                                        <TriangleAlertIcon className="w-4 h-4 text-red-600" />
                                    }
                                    <span>LMS Enabled</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedSchool.settings.enableAIFeatures ? 
                                        <CheckCircleIcon className="w-4 h-4 text-green-600" /> : 
                                        <TriangleAlertIcon className="w-4 h-4 text-red-600" />
                                    }
                                    <span>AI Features</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedSchool.settings.allowParentAccess ? 
                                        <CheckCircleIcon className="w-4 h-4 text-green-600" /> : 
                                        <TriangleAlertIcon className="w-4 h-4 text-red-600" />
                                    }
                                    <span>Parent Access</span>
                                </div>
                                <p><span className="font-semibold">Max Class Size:</span> {selectedSchool.settings.maxStudentsPerClass}</p>
                                <p><span className="font-semibold">Grade System:</span> {selectedSchool.settings.gradeSystem.toUpperCase()}</p>
                            </div>
                        </div>

                        {/* Academic Year */}
                        <div>
                            <h3 className="font-semibold text-slate-700 mb-3">Academic Year</h3>
                            <div className="space-y-2 text-sm">
                                <p><span className="font-semibold">Start:</span> {new Date(selectedSchool.settings.academicYearStart).toLocaleDateString()}</p>
                                <p><span className="font-semibold">End:</span> {new Date(selectedSchool.settings.academicYearEnd).toLocaleDateString()}</p>
                                <p><span className="font-semibold">Established:</span> {selectedSchool.established}</p>
                                <p><span className="font-semibold">Last Updated:</span> {new Date(selectedSchool.updatedAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;
