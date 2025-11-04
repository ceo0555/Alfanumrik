import React from 'react';

interface MasteryCircleProps {
    mastery: number; // 0.0 to 1.0
    label: string;
    onClick: () => void;
}

const MasteryCircle: React.FC<MasteryCircleProps> = ({ mastery, label, onClick }) => {
    const percentage = Math.round(mastery * 100);
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (mastery * circumference);

    const getColor = () => {
        if (percentage < 40) return 'stroke-red-500';
        if (percentage < 75) return 'stroke-yellow-500';
        return 'stroke-indigo-500';
    };
    
    const colorClass = getColor();

    return (
        <button onClick={onClick} className="flex flex-col items-center text-center group">
            <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 120 120">
                    <circle
                        className="text-slate-200"
                        strokeWidth="10"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="60"
                        cy="60"
                    />
                    <circle
                        className={`transition-all duration-1000 ease-out ${colorClass}`}
                        strokeWidth="10"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="60"
                        cy="60"
                        transform="rotate(-90 60 60)"
                    />
                    <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dy=".3em"
                        className="text-2xl font-bold fill-current text-slate-700"
                    >
                        {percentage}%
                    </text>
                </svg>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors max-w-[120px]">
                {label}
            </p>
        </button>
    );
};

export default MasteryCircle;