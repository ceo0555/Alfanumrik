import React from 'react';

interface StudyPetProps {
    accessories: string[];
}

const StudyPet: React.FC<StudyPetProps> = ({ accessories }) => {
    const hasHat = accessories.includes('pet-hat');

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-md font-bold text-slate-800 mb-3">My Study Pet</h3>
            <div className="flex justify-center items-center h-40">
                <svg viewBox="0 0 100 100" className="w-32 h-32">
                    {/* Hat */}
                    {hasHat && (
                        <g transform="translate(0, -5)">
                            <path d="M 30 40 Q 50 35, 70 40" stroke="#333" strokeWidth="2" fill="none" />
                            <rect x="30" y="30" width="40" height="10" fill="#555" rx="2" />
                            <rect x="25" y="40" width="50" height="5" fill="#555" rx="2" />
                        </g>
                    )}
                    
                    {/* Body */}
                    <rect x="20" y="45" width="60" height="40" rx="30" fill="#a0e9ff" />

                    {/* Eyes */}
                    <circle cx="40" cy="60" r="4" fill="black" />
                    <circle cx="60" cy="60" r="4" fill="black" />
                    
                    {/* Smile */}
                    <path d="M 40 75 Q 50 85, 60 75" stroke="black" strokeWidth="2" fill="none" />
                </svg>
            </div>
            <p className="text-xs text-center text-slate-500 mt-2">
                {hasHat ? "Looking sharp with my new hat!" : "Keep studying to earn me cool stuff!"}
            </p>
        </div>
    );
};

export default StudyPet;