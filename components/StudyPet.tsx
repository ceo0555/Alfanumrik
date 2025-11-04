import React from 'react';

interface StudyPetProps {
    accessories: string[];
}

const StudyPet: React.FC<StudyPetProps> = ({ accessories }) => {
    const hasHat = accessories.includes('pet-hat');

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
            <h3 className="text-md font-bold text-slate-800 mb-2">My Study Pet</h3>
            <div className="flex-grow flex justify-center items-center">
                <svg viewBox="0 0 100 100" className="w-32 h-32">
                    {/* Hat */}
                    {hasHat && (
                        <g transform="translate(0, -5) rotate(-10 50 50)" className="animate-bounce-slow">
                            <path d="M 30 40 Q 50 35, 70 40" stroke="#333" strokeWidth="2" fill="none" />
                            <rect x="30" y="30" width="40" height="10" fill="#555" rx="2" />
                            <rect x="25" y="40" width="50" height="5" fill="#555" rx="2" />
                        </g>
                    )}
                    
                    {/* Body */}
                    <g className="animate-float">
                        <rect x="20" y="45" width="60" height="40" rx="30" fill="#a0e9ff" />

                        {/* Eyes */}
                        <circle cx="40" cy="60" r="4" fill="black" />
                        <circle cx="60" cy="60" r="4" fill="black" />
                        
                        {/* Smile */}
                        <path d="M 40 75 Q 50 85, 60 75" stroke="black" strokeWidth="2" fill="none" />
                    </g>
                </svg>
            </div>
            <p className="text-xs text-center text-slate-500 mt-2">
                {hasHat ? "Looking sharp with my new hat!" : "Keep studying to earn me cool stuff!"}
            </p>
             <style>{`
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-5px); }
                    100% { transform: translateY(0px); }
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
                 @keyframes bounce-slow {
                    0%, 100% { transform: translate(0, -5px) rotate(-10 50 50); }
                    50% { transform: translate(0, -10px) rotate(-10 50 50); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default StudyPet;