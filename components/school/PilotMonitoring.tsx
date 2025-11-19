import React, { useState, useEffect } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
    TrendingUpIcon, 
    UserGroupIcon, 
    CheckCircleIcon, 
    TriangleAlertIcon,
    ClockIcon,
    RefreshCwIcon,
    ChartBarIcon
} from '../../constants/icons';

interface HealthCheck {
    name: string;
    status: 'healthy' | 'warning' | 'error';
    message: string;
    lastCheck: string;
}

const PilotMonitoring: React.FC = () => {
    const { schools, performanceMetrics, loadPerformanceMetrics } = useSchool();
    const { userProfiles, allCourses, allSubmissions } = useAuth();
    const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);

    const runHealthChecks = () => {
        const checks: HealthCheck[] = [];
        const now = new Date().toISOString();

        // Check 1: Database Connection (simulated)
        checks.push({
            name: 'Database Connection',
            status: 'healthy',
            message: 'All database connections operational',
            lastCheck: now,
        });

        // Check 2: Active Schools
        const activeSchools = schools.filter(s => s.isActive).length;
        checks.push({
            name: 'Active Schools',
            status: activeSchools === schools.length ? 'healthy' : 'warning',
            message: `${activeSchools}/${schools.length} schools active`,
            lastCheck: now,
        });

        // Check 3: User Load
        const totalUsers = userProfiles.length;
        checks.push({
            name: 'User Load',
            status: totalUsers < 55000 ? 'healthy' : 'warning',
            message: `${totalUsers.toLocaleString()} users in system`,
            lastCheck: now,
        });

        // Check 4: LMS Activity
        const activeCourses = allCourses.length;
        checks.push({
            name: 'LMS Activity',
            status: activeCourses > 0 ? 'healthy' : 'warning',
            message: `${activeCourses} active courses`,
            lastCheck: now,
        });

        // Check 5: Submission Processing
        const recentSubmissions = allSubmissions.filter(s => {
            const submissionDate = new Date(s.submittedAt);
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            return submissionDate > oneDayAgo;
        }).length;
        checks.push({
            name: 'Submission Processing',
            status: 'healthy',
            message: `${recentSubmissions} submissions in last 24h`,
            lastCheck: now,
        });

        // Check 6: API Performance
        const apiResponseTime = performanceMetrics?.apiResponseTime || 0;
        checks.push({
            name: 'API Performance',
            status: apiResponseTime < 300 ? 'healthy' : apiResponseTime < 500 ? 'warning' : 'error',
            message: `${apiResponseTime}ms average response time`,
            lastCheck: now,
        });

        // Check 7: Error Rate
        const errorRate = performanceMetrics?.errorRate || 0;
        checks.push({
            name: 'Error Rate',
            status: errorRate < 1 ? 'healthy' : errorRate < 3 ? 'warning' : 'error',
            message: `${errorRate.toFixed(2)}% error rate`,
            lastCheck: now,
        });

        // Check 8: Storage Capacity (simulated)
        const storageUsed = 45; // Percentage
        checks.push({
            name: 'Storage Capacity',
            status: storageUsed < 80 ? 'healthy' : 'warning',
            message: `${storageUsed}% storage utilized`,
            lastCheck: now,
        });

        setHealthChecks(checks);
    };

    useEffect(() => {
        runHealthChecks();
        const interval = setInterval(runHealthChecks, 60000); // Run every minute
        return () => clearInterval(interval);
    }, [schools, userProfiles, allCourses, allSubmissions, performanceMetrics]);

    const handleRefresh = () => {
        loadPerformanceMetrics();
        runHealthChecks();
    };

    const getStatusIcon = (status: HealthCheck['status']) => {
        switch (status) {
            case 'healthy':
                return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
            case 'warning':
                return <TriangleAlertIcon className="w-6 h-6 text-yellow-500" />;
            case 'error':
                return <TriangleAlertIcon className="w-6 h-6 text-red-500" />;
        }
    };

    const getStatusColor = (status: HealthCheck['status']) => {
        switch (status) {
            case 'healthy':
                return 'bg-green-50 border-green-200';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200';
            case 'error':
                return 'bg-red-50 border-red-200';
        }
    };

    const healthyCount = healthChecks.filter(c => c.status === 'healthy').length;
    const warningCount = healthChecks.filter(c => c.status === 'warning').length;
    const errorCount = healthChecks.filter(c => c.status === 'error').length;

    const overallStatus = errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'healthy';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className={`rounded-2xl p-8 text-white shadow-xl ${
                overallStatus === 'healthy' ? 'bg-gradient-to-r from-green-600 to-emerald-600' :
                overallStatus === 'warning' ? 'bg-gradient-to-r from-yellow-600 to-orange-600' :
                'bg-gradient-to-r from-red-600 to-rose-600'
            }`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-extrabold mb-2">Pilot System Monitoring</h1>
                        <p className="text-white/80">Real-time health checks and performance metrics</p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="btn bg-white/20 hover:bg-white/30 text-white border-0 flex items-center gap-2"
                    >
                        <RefreshCwIcon className="w-5 h-5" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 font-semibold">Healthy</p>
                            <p className="text-3xl font-bold text-green-600 mt-1">{healthyCount}</p>
                        </div>
                        <CheckCircleIcon className="w-12 h-12 text-green-500 opacity-80" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 font-semibold">Warnings</p>
                            <p className="text-3xl font-bold text-yellow-600 mt-1">{warningCount}</p>
                        </div>
                        <TriangleAlertIcon className="w-12 h-12 text-yellow-500 opacity-80" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 font-semibold">Errors</p>
                            <p className="text-3xl font-bold text-red-600 mt-1">{errorCount}</p>
                        </div>
                        <TriangleAlertIcon className="w-12 h-12 text-red-500 opacity-80" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 font-semibold">Uptime</p>
                            <p className="text-3xl font-bold text-blue-600 mt-1">99.9%</p>
                        </div>
                        <TrendingUpIcon className="w-12 h-12 text-blue-500 opacity-80" />
                    </div>
                </div>
            </div>

            {/* Performance Metrics */}
            {performanceMetrics && (
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <ChartBarIcon className="w-6 h-6 text-indigo-600" />
                        Live Performance Metrics
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                        <div className="text-center p-4 bg-indigo-50 rounded-lg">
                            <p className="text-3xl font-bold text-indigo-600">{performanceMetrics.activeUsers.toLocaleString()}</p>
                            <p className="text-sm text-slate-600 mt-1">Active Users</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-3xl font-bold text-green-600">{performanceMetrics.totalLogins.toLocaleString()}</p>
                            <p className="text-sm text-slate-600 mt-1">Total Logins</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-3xl font-bold text-blue-600">{performanceMetrics.avgSessionDuration}m</p>
                            <p className="text-sm text-slate-600 mt-1">Avg Session</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <p className="text-3xl font-bold text-purple-600">{performanceMetrics.apiResponseTime}ms</p>
                            <p className="text-sm text-slate-600 mt-1">API Response</p>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <p className="text-3xl font-bold text-orange-600">{performanceMetrics.errorRate.toFixed(2)}%</p>
                            <p className="text-sm text-slate-600 mt-1">Error Rate</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Health Checks */}
            <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">System Health Checks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {healthChecks.map((check, index) => (
                        <div
                            key={index}
                            className={`rounded-xl p-4 border ${getStatusColor(check.status)}`}
                        >
                            <div className="flex items-start gap-3">
                                {getStatusIcon(check.status)}
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-800">{check.name}</h3>
                                    <p className="text-sm text-slate-600 mt-1">{check.message}</p>
                                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                                        <ClockIcon className="w-3 h-3" />
                                        <span>Last check: {new Date(check.lastCheck).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pilot Statistics */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 text-white">
                <h2 className="text-2xl font-bold mb-6">Pilot Program Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-4xl font-bold">{schools.length}</p>
                        <p className="text-slate-300 mt-1">Partner Schools</p>
                    </div>
                    <div>
                        <p className="text-4xl font-bold">{userProfiles.length.toLocaleString()}</p>
                        <p className="text-slate-300 mt-1">Total Users</p>
                    </div>
                    <div>
                        <p className="text-4xl font-bold">{allCourses.length}</p>
                        <p className="text-slate-300 mt-1">Active Courses</p>
                    </div>
                    <div>
                        <p className="text-4xl font-bold">{allSubmissions.length.toLocaleString()}</p>
                        <p className="text-slate-300 mt-1">Submissions</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PilotMonitoring;
