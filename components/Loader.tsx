
import React, { useState, useEffect } from 'react';

const loadingMessages = [
  "Connecting to Alfanumrik AI...",
  "Analyzing the latest CBSE syllabus...",
  "Crafting student-friendly explanations...",
  "Designing relevant practice questions...",
  "Generating helpful visual aids...",
  "Finalizing your personalized lesson...",
  "Just a moment more..."
];

const Loader = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prevIndex => (prevIndex + 1) % loadingMessages.length);
    }, 2500); // Change message every 2.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
      <svg width="80" height="80" viewBox="-5 -5 42 42" aria-hidden="true" className="-mb-2">
        <defs>
          <linearGradient x1="8.042%" y1="0%" x2="65.682%" y2="23.865%" id="a">
            <stop stopColor="var(--brand-primary)" stopOpacity="0" offset="0%"/>
            <stop stopColor="var(--brand-primary)" stopOpacity=".631" offset="63.146%"/>
            <stop stopColor="var(--brand-primary)" offset="100%"/>
          </linearGradient>
        </defs>
        <g fill="none" fillRule="evenodd" transform="translate(1 1)">
          <path d="M36 18c0-9.94-8.06-18-18-18" stroke="url(#a)" strokeWidth="4">
            <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite"/>
          </path>
          <circle fill="var(--brand-primary)" cx="36" cy="18" r="2">
            <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite"/>
          </circle>
          <text fill="var(--brand-primary)" fontFamily="Poppins, sans-serif" x="17" y="24" fontSize="24" fontWeight="bold" textAnchor="middle">A</text>
        </g>
      </svg>

      <div className="h-10">
        <p className="text-slate-600 text-lg font-semibold animate-fade-in-out" key={messageIndex}>
          {loadingMessages[messageIndex]}
        </p>
      </div>
      <style>{`
        @keyframes fade-in-out {
          0% { opacity: 0; transform: translateY(10px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        .animate-fade-in-out {
          animation: fade-in-out 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Loader;