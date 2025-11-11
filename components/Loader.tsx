import React, { useState, useEffect } from 'react';

const loadingMessages = [
  "Connecting to Alfanumrik AI...",
  "Analyzing the latest CBSE syllabus...",
  "Crafting student-friendly explanations...",
  "Just a moment more..."
];

const Loader: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prevIndex => (prevIndex + 1) % loadingMessages.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4 text-center p-4">
      <style>{`
        @keyframes pulse-glow-loader {
          0%, 100% { box-shadow: 0 0 20px 5px rgba(79, 70, 229, 0.2); }
          50% { box-shadow: 0 0 35px 15px rgba(79, 70, 229, 0.3); }
        }
        .pulse-glow-animation-loader { animation: pulse-glow-loader 3s ease-in-out infinite; }
      `}</style>
      <div className="relative w-24 h-24 flex items-center justify-center">
        <div className="absolute w-full h-full border-2 border-indigo-200 rounded-full pulse-glow-animation-loader"></div>
        <div className="relative w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-poppins font-bold text-4xl shadow-lg">
          A
        </div>
      </div>

      <div className="h-5">
        <p className="text-slate-600 font-semibold animate-fade-in-out" key={messageIndex}>
          {loadingMessages[messageIndex]}
        </p>
      </div>
       <style>{`
        @keyframes fade-in-out {
          0% { opacity: 0; transform: translateY(8px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-8px); }
        }
        .animate-fade-in-out {
          animation: fade-in-out 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Loader;