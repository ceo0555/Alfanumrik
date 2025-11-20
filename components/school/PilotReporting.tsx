import React, { useMemo, useState } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
    ChartBarIcon, 
    DownloadIcon, 
    TrendingUpIcon,
    UserGroupIcon,
    BookIcon,
    CheckCircleIcon
} from '../../constants/icons';

const PilotReporting: React.FC = () => {
    const { schools } = useSchool();
    const { userProfiles, allCourses, allSubmissions, allAssignments } = useAuth();
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

    const aggregateStats = useMemo(() => {
        const stats = schools.map(school => {
            const schoolUsers = userProfiles.filter(u => u.schoolId === school.id);
            const students = schoolUsers.filter(u => !u.schoolRole);
            const teachers = schoolUsers.filter(u => u.schoolRole === 'teacher');
            
            const schoolTeacherIds = teachers.map(t => t.id);
            const schoolCourses = allCourses.filter(c => schoolTeacherIds.includes(c.teacherId));
            
            const schoolStudentIds = students.map(s => s.id);
            const schoolSubmissions = allSubmissions.filter(s => schoolStudentIds.includes(s.studentId));
            const schoolAssignments = allAssignments.filter(a => 
                a.assignedStudentIds && schoolStudentIds.some(id => a.assignedStudentIds!.includes(id))
            );

            return {
                schoolId: school.id,
                schoolName: school.name,
                schoolCode: school.code,
                students: students.length,
                teachers: teachers.length,
                courses: schoolCourses.length,
                submissions: schoolSubmissions.length,
                assignments: schoolAssignments.length,
                avgSubmissionsPerStudent: students.length > 0 
                    ? (schoolSubmissions.length / students.length).toFixed(2) 
                    : '0',
                avgCoursesPerTeacher: teachers.length > 0
                    ? (schoolCourses.length / teachers.length).toFixed(2)
                    : '0',
            };
        });

        return stats;
    }, [schools, userProfiles, allCourses, allSubmissions, allAssignments]);

    const overallStats = useMemo(() => {
        return {
            totalStudents: aggregateStats.reduce((sum, s) => sum + s.students, 0),
            totalTeachers: aggregateStats.reduce((sum, s) => sum + s.teachers, 0),
            totalCourses: aggregateStats.reduce((sum, s) => sum + s.courses, 0),
            totalSubmissions: aggregateStats.reduce((sum, s) => sum + s.submissions, 0),
            totalAssignments: aggregateStats.reduce((sum, s) => sum + s.assignments, 0),
            avgStudentsPerSchool: Math.round(
                aggregateStats.reduce((sum, s) => sum + s.students, 0) / schools.length
            ),
        };
    }, [aggregateStats, schools]);

    const downloadReport = () => {
        let csvContent = 'School Name,School Code,Students,Teachers,Courses,Submissions,Assignments,Avg Submissions/Student,Avg Courses/Teacher\n';
        
        aggregateStats.forEach(stat => {
            csvContent += `${stat.schoolName},${stat.schoolCode},${stat.students},${stat.teachers},${stat.courses},${stat.submissions},${stat.assignments},${stat.avgSubmissionsPerStudent},${stat.avgCoursesPerTeacher}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pilot_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-extrabold mb-2">Pilot Program Reporting</h1>
                        <p className="text-blue-100">Comprehensive analytics across all pilot schools</p>
                    </div>
                    <button
                        onClick={downloadReport}
                        className="btn bg-white/20 hover:bg-white/30 text-white border-0 flex items-center gap-2"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Period Selector */}
            <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-slate-700">Report Period:</span>
                    <div className="flex gap-2">
                        {['week', 'month', 'year'].map(period => (
                            <button
                                key={period}
                                onClick={() => setSelectedPeriod(period as any)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    selectedPeriod === period
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                {period.charAt(0).toUpperCase() + period.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Overall Stats */}
            <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Overall Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                        <p className="text-sm text-slate-600 font-semibold">Schools</p>
                        <p className="text-3xl font-bold text-purple-600 mt-2">{schools.length}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                        <p className="text-sm text-slate-600 font-semibold">Students</p>
                        <p className="text-3xl font-bold text-blue-600 mt-2">{overallStats.totalStudents.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
                        <p className="text-sm text-slate-600 font-semibold">Teachers</p>
                        <p className="text-3xl font-bold text-indigo-600 mt-2">{overallStats.totalTeachers.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                        <p className="text-sm text-slate-600 font-semibold">Courses</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">{overallStats.totalCourses.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
                        <p className="text-sm text-slate-600 font-semibold">Assignments</p>
                        <p className="text-3xl font-bold text-orange-600 mt-2">{overallStats.totalAssignments.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-teal-500">
                        <p className="text-sm text-slate-600 font-semibold">Submissions</p>
                        <p className="text-3xl font-bold text-teal-600 mt-2">{overallStats.totalSubmissions.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* School Comparison */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <ChartBarIcon className="w-6 h-6 text-indigo-600" />
                    School-wise Breakdown
                </h2>
                
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left py-3 px-4 font-semibold text-slate-700">School</th>
                                <th className="text-center py-3 px-4 font-semibold text-slate-700">Code</th>
                                <th className="text-center py-3 px-4 font-semibold text-slate-700">Students</th>
                                <th className="text-center py-3 px-4 font-semibold text-slate-700">Teachers</th>
                                <th className="text-center py-3 px-4 font-semibold text-slate-700">Courses</th>
                                <th className="text-center py-3 px-4 font-semibold text-slate-700">Submissions</th>
                                <th className="text-center py-3 px-4 font-semibold text-slate-700">Avg Sub/Stu</th>
                                <th className="text-center py-3 px-4 font-semibold text-slate-700">Engagement</th>
                            </tr>
                        </thead>
                        <tbody>
                            {aggregateStats.map(stat => {
                                const engagementScore = parseFloat(stat.avgSubmissionsPerStudent);
                                const engagementLevel = engagementScore > 5 ? 'high' : engagementScore > 2 ? 'medium' : 'low';
                                
                                return (
                                    <tr key={stat.schoolId} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="py-4 px-4">
                                            <p className="font-semibold text-slate-800">{stat.schoolName}</p>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <span className="px-2 py-1 bg-slate-100 rounded font-mono text-sm">
                                                {stat.schoolCode}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-center font-semibold text-blue-600">
                                            {stat.students.toLocaleString()}
                                        </td>
                                        <td className="py-4 px-4 text-center font-semibold text-indigo-600">
                                            {stat.teachers}
                                        </td>
                                        <td className="py-4 px-4 text-center font-semibold text-green-600">
                                            {stat.courses}
                                        </td>
                                        <td className="py-4 px-4 text-center font-semibold text-teal-600">
                                            {stat.submissions.toLocaleString()}
                                        </td>
                                        <td className="py-4 px-4 text-center font-semibold text-purple-600">
                                            {stat.avgSubmissionsPerStudent}
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                engagementLevel === 'high' ? 'bg-green-100 text-green-700' :
                                                engagementLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {engagementLevel.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Key Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center gap-3 mb-4">
                        <CheckCircleIcon className="w-8 h-8 text-green-600" />
                        <h3 className="text-xl font-bold text-green-900">Top Performers</h3>
                    </div>
                    <div className="space-y-2">
                        {aggregateStats
                            .sort((a, b) => parseFloat(b.avgSubmissionsPerStudent) - parseFloat(a.avgSubmissionsPerStudent))
                            .slice(0, 3)
                            .map((stat, index) => (
                                <div key={stat.schoolId} className="flex items-center justify-between p-3 bg-white rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-bold text-green-600">{index + 1}</span>
                                        <span className="font-semibold text-slate-800">{stat.schoolName}</span>
                                    </div>
                                    <span className="text-green-600 font-bold">{stat.avgSubmissionsPerStudent} avg</span>
                                </div>
                            ))}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center gap-3 mb-4">
                        <TrendingUpIcon className="w-8 h-8 text-blue-600" />
                        <h3 className="text-xl font-bold text-blue-900">Growth Opportunities</h3>
                    </div>
                    <div className="space-y-2">
                        {aggregateStats
                            .sort((a, b) => parseFloat(a.avgSubmissionsPerStudent) - parseFloat(b.avgSubmissionsPerStudent))
                            .slice(0, 3)
                            .map((stat, index) => (
                                <div key={stat.schoolId} className="flex items-center justify-between p-3 bg-white rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-bold text-blue-600">{index + 1}</span>
                                        <span className="font-semibold text-slate-800">{stat.schoolName}</span>
                                    </div>
                                    <span className="text-blue-600 font-bold">{stat.avgSubmissionsPerStudent} avg</span>
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 text-white">
                <h2 className="text-2xl font-bold mb-4">Pilot Program Recommendations</h2>
                <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                        <span className="text-2xl">✅</span>
                        <p>Average engagement across schools is strong with {overallStats.avgStudentsPerSchool.toLocaleString()} students per school</p>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="text-2xl">📈</span>
                        <p>Focus on increasing course creation - currently {(overallStats.totalCourses / overallStats.totalTeachers).toFixed(1)} courses per teacher</p>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="text-2xl">🎯</span>
                        <p>Total of {overallStats.totalSubmissions.toLocaleString()} submissions shows active platform usage</p>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="text-2xl">💡</span>
                        <p>Consider onboarding schools with lower engagement for targeted support</p>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default PilotReporting;
