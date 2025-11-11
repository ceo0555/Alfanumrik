import React, { useState, useEffect } from 'react';

// Messages from the design brief
const loadingMessages = [
  "Synthesizing smart content for you...",
  "Aligning knowledge paths...",
  "Optimizing for your learning curve...",
  "Building concepts in real-time...",
  "Almost ready… sharpening your IQ module."
];

// This new loader is purely aesthetic and does not require props like progress or step.
const ProgressLoader: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    // Cycle through messages every 3 seconds
    const interval = setInterval(() => {
      setMessageIndex(prevIndex => (prevIndex + 1) % loadingMessages.length);
    }, 3000); 

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 bg-[#001F3F] rounded-xl animate-fade-in text-white overflow-hidden">
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 30px 10px rgba(0, 224, 255, 0.15);
            transform: scale(0.95);
          }
          50% {
            box-shadow: 0 0 50px 20px rgba(0, 224, 255, 0.25);
            transform: scale(1);
          }
        }
        .pulse-glow-animation {
          animation: pulse-glow 4s ease-in-out infinite;
        }

        @keyframes morph {
          0% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: rotate(0deg); }
          50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; transform: rotate(180deg); }
          100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: rotate(360deg); }
        }
        .morph-animation {
          animation: morph 12s ease-in-out infinite both;
        }

        @keyframes slide-in {
          from { width: 0%; left: 0%; }
          to { width: 100%; left: 100%; }
        }
        .indeterminate-bar {
          animation: slide-in 2.5s ease-in-out infinite;
        }
        
        @keyframes fade-in-out-text {
          0% { opacity: 0; transform: translateY(10px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        .animate-fade-in-out-text {
          animation: fade-in-out-text 3s ease-in-out infinite;
        }
      `}</style>
      
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
        {/* Morphing Blob - Layer 1 */}
        <div className="absolute w-full h-full bg-gradient-to-br from-[var(--brand-secondary)] to-[var(--bg-sidebar)] opacity-40 morph-animation"></div>
        
        {/* Pulsing Ring - Layer 2 */}
        <div className="absolute w-44 h-44 sm:w-52 sm:h-52 border-2 border-[var(--brand-secondary)] rounded-full pulse-glow-animation"></div>
        
        {/* Glassmorphism Disc - Layer 3 */}
        <div className="absolute w-36 h-36 sm:w-44 sm:h-44 bg-white/5 backdrop-blur-sm rounded-full"></div>

        {/* Central Logo - Layer 4 */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 bg-gradient-to-br from-[var(--bg-sidebar)] to-[#001a36] rounded-full flex items-center justify-center text-white font-poppins font-bold text-5xl shadow-2xl shadow-black/50">
          A
        </div>
      </div>

      <div className="mt-8 text-center w-full max-w-sm">
        <div className="h-8">
            <p className="text-base font-semibold text-slate-200 animate-fade-in-out-text" key={messageIndex}>
              {loadingMessages[messageIndex]}
            </p>
        </div>
        <div className="w-48 h-1 bg-white/10 rounded-full mx-auto mt-4 overflow-hidden relative">
          <div className="absolute top-0 h-1 bg-[var(--brand-secondary)] rounded-full indeterminate-bar"></div>
        </div>
      </div>
    </div>
  );
};

export default ProgressLoader;
