import React from 'react';

const commonStyles = `
    .font-sans { font-family: 'Inter', sans-serif; }
    .font-poppins { font-family: 'Poppins', sans-serif; }
    .text-3xs { font-size: 0.5rem; line-height: 0.75rem; }
    .text-2xs { font-size: 0.625rem; line-height: 0.875rem; }
    .text-xs { font-size: 0.75rem; line-height: 1rem; }
    .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
    .text-base { font-size: 1rem; line-height: 1.5rem; }
    .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
    .font-medium { font-weight: 500; }
    .font-semibold { font-weight: 600; }
    .font-bold { font-weight: 700; }
    .fill-white { fill: #fff; }
    .fill-slate-50 { fill: #f8fafc; }
    .fill-slate-100 { fill: #f1f5f9; }
    .fill-slate-200 { fill: #e2e8f0; }
    .fill-slate-300 { fill: #cbd5e1; }
    .fill-indigo-50 { fill: #eef2ff; }
    .fill-indigo-100 { fill: #e0e7ff; }
    .fill-indigo-500 { fill: #6366f1; }
    .fill-indigo-600 { fill: #4f46e5; }
    .fill-emerald-100 { fill: #d1fae5; }
    .fill-emerald-500 { fill: #10b981; }
    .fill-emerald-600 { fill: #059669; }
    .fill-orange-500 { fill: #f97316; }
    .fill-amber-400 { fill: #facc15; }
    .stroke-slate-200 { stroke: #e2e8f0; }
    .stroke-slate-300 { stroke: #cbd5e1; }
    .stroke-indigo-500 { stroke: #6366f1; }
    .stroke-emerald-500 { stroke: #10b981; }
    .stroke-amber-400 { stroke: #facc15; }
    .text-slate-400 { fill: #94a3b8; }
    .text-slate-500 { fill: #64748b; }
    .text-slate-600 { fill: #475569; }
    .text-slate-700 { fill: #334155; }
    .text-slate-800 { fill: #1e293b; }
    .text-white { fill: #fff; }
    .text-indigo-600 { fill: #4f46e5; }
    .text-indigo-700 { fill: #4338ca; }
    .text-emerald-700 { fill: #047857; }
    .text-orange-700 { fill: #c2410c; }
`;

export const AdaptiveLessonPlayerMockup: React.FC = () => (
    <svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
        <defs><style>{commonStyles}</style></defs>
        <rect width="600" height="400" className="fill-white" />
        <g className="font-sans">
            <text x="30" y="35" className="text-sm font-semibold text-slate-700">Light - Reflection and Refraction</text>
            <text x="570" y="35" className="text-sm font-semibold text-slate-500" textAnchor="end">Step 3 of 12</text>
            <rect x="30" y="45" width="540" height="6" rx="3" className="fill-slate-200" />
            <rect x="30" y="45" width="135" height="6" rx="3" className="fill-indigo-500" />
            <rect x="30" y="70" width="540" height="1" className="fill-slate-200" />

            <g transform="translate(30, 95)">
                <text x="0" y="10" className="text-lg font-bold text-slate-800 font-poppins">Core Concept: Reflection of Light</text>
                <foreignObject x="0" y="25" width="260" height="200">
                    <p className="text-sm text-slate-600 font-sans" xmlns="http://www.w3.org/1999/xhtml">
                        When a ray of light approaches a smooth, polished surface and the light ray bounces back, it is called the reflection of light.
                        <br/><br/>The two laws of reflection are:
                        <br/>1. The angle of incidence is equal to the angle of reflection.
                        <br/>2. The incident ray, the reflected ray and the normal to the mirror at the point of incidence all lie in the same plane.
                    </p>
                </foreignObject>
            </g>
            
            <g transform="translate(320, 90)">
                <rect x="0" y="0" width="250" height="200" rx="8" className="fill-slate-50 stroke-slate-200" />
                <line x1="25" y1="150" x2="225" y2="150" stroke="#999" strokeWidth="2" />
                <path d="M 25 150 l 0 10 l 5 -5 z" fill="#999" transform="translate(-2, -5)" />
                <line x1="125" y1="50" x2="125" y2="150" stroke="#333" strokeDasharray="4 2" />
                <line x1="50" y1="50" x2="125" y2="150" stroke="#f87171" strokeWidth="2" />
                <path d="M 85 97 l -8 5 l 2 -9 z" fill="#f87171" />
                <line x1="125" y1="150" x2="200" y2="50" stroke="#4ade80" strokeWidth="2" />
                <path d="M 165 97 l 8 5 l -2 -9 z" fill="#4ade80" />
                
                <path d="M 113.4 134.1 A 20 20 0 0 1 125 130" fill="none" stroke="#64748b" strokeWidth="1"/>
                <path d="M 125 130 A 20 20 0 0 1 136.6 134.1" fill="none" stroke="#64748b" strokeWidth="1"/>
                
                <text x="110" y="128" className="text-2xs font-bold text-slate-600">i</text>
                <text x="138" y="128" className="text-2xs font-bold text-slate-600">r</text>
                
                <text x="35" y="45" className="text-xs text-slate-500">Incident Ray</text>
                <text x="215" y="45" className="text-xs text-slate-500" textAnchor="end">Reflected Ray</text>
                <text x="125" y="45" className="text-xs text-slate-500" textAnchor="middle">Normal</text>
            </g>

            <rect x="30" y="340" width="100" height="36" rx="8" className="fill-white stroke-slate-300" />
            <text x="80" y="363" textAnchor="middle" className="font-semibold text-sm text-slate-700">Previous</text>
            <rect x="470" y="340" width="100" height="36" rx="8" className="fill-indigo-600" />
            <text x="520" y="363" textAnchor="middle" className="font-semibold text-sm text-white">Next</text>
        </g>
    </svg>
);

export const SchoolOSDashboardMockup: React.FC = () => (
     <svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
        <defs><style>{commonStyles}</style></defs>
        <rect width="600" height="400" className="fill-slate-50" />
        <g className="font-sans">
            <text x="30" y="40" className="text-xl font-bold font-poppins text-slate-800">School Dashboard</text>
            <text x="570" y="40" className="text-sm text-slate-500" textAnchor="end">Overview</text>
            
            <g transform="translate(30, 70)">
                <rect width="260" height="140" rx="12" className="fill-white stroke-slate-200" />
                <text x="20" y="30" className="text-base font-bold text-slate-800">Average Mastery</text>
                <circle cx="90" cy="95" r="35" fill="none" className="stroke-slate-200" strokeWidth="8"/>
                <circle cx="90" cy="95" r="35" fill="none" className="stroke-indigo-500" strokeWidth="8" strokeDasharray="180, 220" strokeLinecap="round" transform="rotate(-90 90 95)"/>
                <text x="90" y="100" textAnchor="middle" className="text-2xl font-bold text-indigo-600">82%</text>
                <text x="170" y="85" className="font-semibold text-sm text-slate-700">Top Subject:</text>
                <text x="170" y="105" className="font-bold text-base text-emerald-600">Science</text>
            </g>
            
             <g transform="translate(310, 70)">
                <rect width="260" height="140" rx="12" className="fill-white stroke-slate-200" />
                <text x="20" y="30" className="text-base font-bold text-slate-800">Syllabus Pacing</text>
                <text x="20" y="60" className="text-xs text-slate-500">Class 10</text>
                <rect x="20" y="68" width="220" height="4" rx="2" className="fill-slate-200" />
                <rect x="20" y="68" width="180" height="4" rx="2" className="fill-emerald-500" />
                <text x="20" y="90" className="text-xs text-slate-500">Class 9</text>
                <rect x="20" y="98" width="220" height="4" rx="2" className="fill-slate-200" />
                <rect x="20" y="98" width="200" height="4" rx="2" className="fill-emerald-500" />
                 <text x="20" y="120" className="text-xs text-slate-500">Class 8</text>
                <rect x="20" y="128" width="220" height="4" rx="2" className="fill-slate-200" />
                <rect x="20" y="128" width="150" height="4" rx="2" className="fill-amber-400" />
            </g>

            <g transform="translate(30, 230)">
                <rect width="540" height="140" rx="12" className="fill-white stroke-slate-200" />
                <text x="20" y="30" className="text-base font-bold text-slate-800">AI Insights</text>
                <foreignObject x="20" y="45" width="500" height="100">
                     <div className="font-sans text-sm" xmlns="http://www.w3.org/1999/xhtml">
                        <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#f97316' }}>●</span>
                            <span style={{ color: '#475569' }}>Class 8 Maths is trending <strong>5% below</strong> syllabus pace.</span>
                        </p>
                         <p style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <span style={{ color: '#ef4444' }}>●</span>
                            <span style={{ color: '#475569' }}>High number of incorrect attempts in Class 10 Physics on 'Lens Formula'. Remediation recommended.</span>
                        </p>
                    </div>
                </foreignObject>
            </g>
        </g>
    </svg>
);


export const StudentUIMockup: React.FC = () => (
    <svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg">
        <defs><style>{commonStyles}</style></defs>
        <rect width="500" height="400" className="fill-slate-50" />
        <g className="font-sans">
            <rect x="20" y="20" width="460" height="60" rx="12" fill="url(#grad1)" />
            <defs><linearGradient id="grad1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#818cf8"/><stop offset="100%" stopColor="#a78bfa"/></linearGradient></defs>
            <text x="40" y="50" className="text-lg font-bold text-white">Welcome back, Rohan!</text>
            <text x="40" y="68" className="text-xs text-white" opacity="0.8">Let's continue your learning journey.</text>

            <g transform="translate(20, 100)">
                <rect width="280" height="120" rx="12" className="fill-white stroke-slate-200" />
                <text x="15" y="25" className="text-sm font-bold text-slate-800">Recommended for You</text>
                <rect x="15" y="40" width="250" height="40" rx="8" className="fill-slate-100" />
                <text x="25" y="58" className="font-semibold text-sm text-slate-800">Next Up: Light - Reflection</text>
                <text x="25" y="72" className="text-2xs text-slate-500">Class 10 - Science</text>
                <rect x="15" y="90" width="250" height="20" rx="8" className="fill-indigo-600" />
                <text x="140" y="104" textAnchor="middle" className="text-xs font-bold text-white">Let's Go</text>
            </g>
            <g transform="translate(320, 100)">
                <rect width="160" height="120" rx="12" className="fill-white stroke-slate-200" />
                <text x="15" y="25" className="text-sm font-bold text-slate-800">Level Progress</text>
                <text x="80" y="60" textAnchor="middle" className="text-2xl font-bold text-indigo-600">Level 5</text>
                <rect x="15" y="80" width="130" height="6" rx="3" className="fill-slate-200" />
                <rect x="15" y="80" width="80" height="6" rx="3" className="fill-amber-400" />
                <text x="15" y="98" className="text-2xs text-slate-500">1250 / 1600 XP</text>
            </g>
             <g transform="translate(20, 240)">
                <rect width="460" height="140" rx="12" className="fill-white stroke-slate-200" />
                <text x="15" y="25" className="text-sm font-bold text-slate-800">Daily Challenge</text>
                <text x="15" y="50" className="font-semibold text-sm text-slate-700">Earn 150 XP today</text>
                <rect x="15" y="70" width="430" height="8" rx="4" className="fill-slate-200" />
                <rect x="15" y="70" width="300" height="8" rx="4" fill="url(#grad2)" />
                <defs><linearGradient id="grad2"><stop stopColor="#a855f7"/><stop offset="1" stopColor="#d946ef"/></linearGradient></defs>
                <text x="15" y="90" className="text-xs text-slate-500">105 / 150 XP</text>
                <text x="445" y="90" textAnchor="end" className="text-xs font-bold text-amber-800">+50 XP</text>
             </g>
        </g>
    </svg>
);

export const TeacherUIMockup: React.FC = () => (
    <svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg">
        <defs><style>{commonStyles}</style></defs>
        <rect width="500" height="400" className="fill-slate-50" />
        <g className="font-sans">
            <text x="20" y="35" className="text-lg font-bold font-poppins text-slate-800">Classroom Core</text>
            <text x="480" y="35" textAnchor="end" className="text-sm text-slate-500">Today's Schedule</text>
            
            <g transform="translate(20, 60)">
                <rect width="460" height="80" rx="12" className="fill-white stroke-slate-200" />
                <rect x="15" y="22" width="60" height="20" rx="10" className="fill-indigo-100" />
                <text x="45" y="36" className="text-xs font-bold text-indigo-700" textAnchor="middle">09:00</text>
                <text x="90" y="30" className="font-bold text-slate-800">Class 10 - Science</text>
                <text x="90" y="45" className="text-sm text-slate-500">Chemical Reactions</text>
                <rect x="260" y="55" width="100" height="18" rx="9" className="fill-emerald-100" />
                <text x="310" y="68" className="text-3xs font-bold text-emerald-700" textAnchor="middle">ATTENDANCE TAKEN</text>
                <rect x="370" y="55" width="75" height="18" rx="9" className="fill-slate-200" />
                <text x="407" y="68" className="text-3xs font-bold text-slate-600" textAnchor="middle">EXIT TICKET</text>
                <rect x="15" y="55" width="235" height="18" rx="9" className="fill-emerald-100" />
                <text x="132" y="68" className="text-3xs font-bold text-emerald-700" textAnchor="middle">✓ TOPIC TAUGHT</text>
            </g>
             <g transform="translate(20, 150)">
                <rect width="460" height="80" rx="12" className="fill-white stroke-slate-200" />
                <rect x="15" y="30" width="60" height="20" rx="10" className="fill-indigo-100" />
                <text x="45" y="44" className="text-xs font-bold text-indigo-700" textAnchor="middle">09:40</text>
                <text x="90" y="38" className="font-bold text-slate-800">Class 9 - Maths</text>
                <text x="90" y="53" className="text-sm text-slate-500">Number Systems</text>
                <rect x="335" y="30" width="110" height="24" rx="8" className="fill-slate-200" />
                <text x="390" y="46" className="text-xs font-bold text-slate-600" textAnchor="middle">TAKE ATTENDANCE</text>
            </g>
        </g>
    </svg>
);

export const SchoolUIMockup: React.FC = () => <SchoolOSDashboardMockup />;

export const ParentUIMockup: React.FC = () => (
    <svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg">
        <defs><style>{commonStyles}</style></defs>
        <rect width="500" height="400" className="fill-slate-50" />
        <g className="font-sans">
            <text x="20" y="35" className="text-lg font-bold font-poppins text-slate-800">Parent Dashboard</text>
            <text x="480" y="35" textAnchor="end" className="text-base font-semibold text-indigo-600">Rohan Sharma</text>
            
             <g transform="translate(20, 60)">
                <rect width="460" height="120" rx="12" className="fill-white stroke-slate-200" />
                <text x="15" y="28" className="text-sm font-bold text-slate-800">MIGA's Performance Analysis</text>
                 <foreignObject x="15" y="40" width="430" height="80">
                    <p className="font-sans text-xs text-slate-600" xmlns="http://www.w3.org/1999/xhtml">
                        Rohan is showing excellent progress in Science, with a mastery of over 90% in Physics concepts. He seems to be finding 'Acids, Bases and Salts' a bit challenging. Consistent practice in this chapter would be beneficial.
                    </p>
                </foreignObject>
            </g>
            <g transform="translate(20, 1