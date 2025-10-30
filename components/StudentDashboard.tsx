import React, { useState, useEffect, useRef } from 'react';
import { CalendarCheckIcon, BarChartIcon, BookIcon, CalendarDaysIcon, FlameIcon, AwardIcon, ScienceIcon, MathIcon, SocialStudiesIcon, PhysicsIcon, ChemistryIcon, BiologyIcon, ArrowRightIcon, TargetIcon, CheckCircleIcon, SpeakerIcon, UsersIcon, SparklesIcon, ScholarCoinIcon } from '../constants/icons';
import { ChapterProgress, Badge, DailyChallenge, UserDktData } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useStudentData } from '../contexts/StudentDataContext';
import { curriculum } from '../constants/curriculum';
import { allAchievements } from '../constants/achievements';
import { INITIAL_MASTERY } from '../services/adaptiveEngine';
import StudyPet from './StudyPet';

const AnimatedCounter: React.FC<{ value: number; className: string }> = ({ value, className }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    };

    const duration = 1500;
    const startTime = Date.now();

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const step = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            setCount(Math.floor(progress * (end - start) + start));
            if (progress < 1) {
              requestAnimationFrame(step);
            }
          };
          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value]);

  return <p ref={ref} className={className}>{count}</p>;
};

const IconComponent: React.FC<{ iconName: Badge['icon'], className?: string }> = ({ iconName, className }) => {
    switch (iconName) {
        case 'FlameIcon': return <FlameIcon className={className} />;
        case 'AwardIcon': return <AwardIcon className={className} />;
        case 'ScienceIcon': return <ScienceIcon className={className} />;
        case 'MathIcon': return <MathIcon className={className} />;
        case 'SocialStudiesIcon': return <SocialStudiesIcon className={className} />;
        case 'PhysicsIcon': return <PhysicsIcon className={className} />;
        case 'ChemistryIcon': return <ChemistryIcon className={className} />;
        case 'BiologyIcon': return <BiologyIcon className={className} />;
        default: return <AwardIcon className={className} />;
    }
};

const RecommendationCard: React.FC<{ onContinue: () => void }> = ({ onContinue }) => {
    const { activeProfile, updateActiveUserProfile } = useAuth();
    const { userDktData } = useStudentData();

    if (!activeProfile) return null;

    const { grade, lastSubject } = activeProfile;
    const MASTERY_THRESHOLD = 0.95;

    // --- DKT-Powered Recommendation Logic ---
    let recommendation = {
        title: "You've mastered all skills!",
        subtitle: "Explore any chapter you'd like to review.",
        action: () => {},
        isCompleted: true,
    };
    
    const subjectsInOrder = Object.keys(curriculum[grade as keyof typeof curriculum] || {});
    let foundRecommendation = false;
    
    // Start with the last subject, then loop through others
    const subjectSearchOrder = [lastSubject, ...subjectsInOrder.filter(s => s !== lastSubject)];

    for (const subject of subjectSearchOrder) {
        const chapters = curriculum[grade as keyof typeof curriculum]?.[subject] || [];
        for (const chapter of chapters) {
            const skillId = `G${grade}-${subject}-${chapter}`;
            const mastery = userDktData[skillId]?.mastery ?? INITIAL_MASTERY;

            if (mastery < MASTERY_THRESHOLD) {
                recommendation = {
                    title: `Next Up: ${chapter}`,
                    subtitle: `Class ${grade} - ${subject}`,
                    action: () => {
                        updateActiveUserProfile({ lastChapter: chapter, lastSubject: subject });
                        onContinue();
                    },
                    isCompleted: false,
                };
                foundRecommendation = true;
                break;
            }
        }
        if (foundRecommendation) break;
    }
    
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-[var(--border-color)]">
            <h3 className="text-md font-bold text-slate-800 mb-3">Recommended for You</h3>
            <div className="bg-slate-50 p-3 rounded-lg">
                <p className="font-semibold text-md text-slate-800">{recommendation.title}</p>
                <p className="text-xs text-slate-500">{recommendation.subtitle}</p>
            </div>
            {!recommendation.isCompleted && (
              <button 
                  onClick={recommendation.action}
                  className="mt-4 w-full bg-[var(--brand-primary)] text-white font-bold py-2.5 px-6 rounded-lg shadow-md hover:bg-[var(--brand-primary-hover)] transition-all flex items-center justify-center gap-2"
              >
                  Let's Go <ArrowRightIcon className="w-4 h-4" />
              </button>
            )}
        </div>
    );
};

const DailyChallengeCard: React.FC<{ challenge: DailyChallenge }> = ({ challenge }) => {
    const progressPercentage = Math.min((challenge.progress / (challenge.type === 'earn_xp' ? challenge.target as number : 1)) * 100, 100);

    return (
        <div className={`p-5 rounded-xl shadow-sm border ${challenge.isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-[var(--border-color)]'}`}>
            <h3 className="text-md font-bold text-slate-800 mb-3 flex items-center gap-2">
                <TargetIcon className="w-5 h-5 text-purple-500" /> Daily Challenge
            </h3>
            {challenge.isCompleted ? (
                <div className="text-center py-4">
                    <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto" />
                    <p className="font-bold text-green-700 mt-2">Challenge Complete!</p>
                    <p className="text-sm text-green-600">You earned {challenge.reward} bonus XP & {challenge.coinReward} Coins!</p>
                </div>
            ) : (
                <>
                    <p className="font-semibold text-slate-700">{challenge.description}</p>
                    <div className="mt-3">
                        <div className="flex justify-between mb-1">
                            <span className="text-xs font-medium text-slate-500">
                                {challenge.progress} / {challenge.type === 'earn_xp' ? challenge.target : 1}
                            </span>
                             <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-amber-600 flex items-center gap-1"><ScholarCoinIcon className="w-4 h-4"/>+{challenge.coinReward}</span>
                                <span className="text-xs font-bold text-purple-600">+{challenge.reward} XP</span>
                             </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};


const StudentDashboard: React.FC<{ onContinue: () => void; }> = ({ onContinue }) => {
    const { activeProfile, allAnnouncements, handleSetRole } = useAuth();
    const { progressData, userDktData } = useStudentData();
    
    if (!activeProfile || !progressData) return null;

    const { name, grade, currentStreak, achievements, level, xp, dailyChallenge, unlockedPetAccessories } = activeProfile;
    
    const latestAnnouncement = allAnnouncements
        .filter(a => a.grade === grade)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    const lessonsCompleted = Object.values(progressData).filter((p: ChapterProgress) => p.status === 'completed').length;
    
    const xpForNextLevel = (level + 1) * (level + 1) * 100;
    const xpForCurrentLevel = level * level * 100;
    const currentLevelProgress = ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

    const calculateSubjectMastery = (grade: string, subject: string, dktData: UserDktData) => {
        const subjectChapters = curriculum[grade as keyof typeof curriculum]?.[subject] ?? [];
        if (subjectChapters.length === 0) return 0;

        const totalMastery = subjectChapters.reduce((sum, chapter) => {
            const skillId = `G${grade}-${subject}-${chapter}`;
            const mastery = dktData[skillId]?.mastery ?? INITIAL_MASTERY;
            return sum + mastery;
        }, 0);

        return Math.round((totalMastery / subjectChapters.length) * 100);
    };
    
    const SubjectMasteryBar: React.FC<{ subject: string; percentage: number; color: string }> = ({ subject, percentage, color }) => (
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-slate-600">{subject}</span>
                <span className="text-sm font-medium text-slate-500">{percentage}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );

    const subjectColors: { [key: string]: string } = {
        'Science': 'bg-blue-500',
        'Maths': 'bg-green-500',
        'Social Studies': 'bg-orange-500',
        'Physics': 'bg-red-500',
        'Chemistry': 'bg-yellow-500',
        'Biology': 'bg-teal-500',
    };

    const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
      <div className="bg-white p-4 rounded-xl shadow-sm border border-[var(--border-color)] flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full ${color} text-white flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div>
          <AnimatedCounter value={value} className="text-2xl font-bold text-slate-800" />
          <p className="text-xs text-slate-500 font-semibold">{title}</p>
        </div>
      </div>
    );

    return (
        <div className="animate-slide-in-up">
            <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold">Welcome back, {name}!</h1>
                        <p className="text-indigo-200">Let's continue your learning journey.</p>
                    </div>
                    <button 
                      onClick={() => handleSetRole(null)} 
                      className="btn bg-white/20 text-white hover:bg-white/30 text-sm"
                    >
                      <UsersIcon className="w-4 h-4 mr-2" />
                      Switch User
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="Learning Streak" value={currentStreak} icon={<FlameIcon className="w-6 h-6"/>} color="bg-orange-500" />
                <StatCard title="Lessons Completed" value={lessonsCompleted} icon={<CheckCircleIcon className="w-6 h-6"/>} color="bg-emerald-500" />
                <StatCard title="XP Points" value={xp} icon={<SparklesIcon className="w-6 h-6"/>} color="bg-purple-500" />
                <StatCard title="Achievements" value={achievements.length} icon={<AwardIcon className="w-6 h-6"/>} color="bg-yellow-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <RecommendationCard onContinue={onContinue} />
                    
                    {latestAnnouncement && (
                         <div className="p-5 rounded-xl shadow-sm border bg-sky-50 border-sky-200">
                             <h3 className="text-md font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <SpeakerIcon className="w-5 h-5 text-sky-500" /> Latest Announcement
                            </h3>
                            <div className="bg-white p-3 rounded-lg">
                                <p className="font-semibold text-md text-slate-800">{latestAnnouncement.title}</p>
                                <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{latestAnnouncement.content}</p>
                                <p className="text-xs text-slate-400 mt-2 text-right">
                                    {new Date(latestAnnouncement.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    )}

                    {dailyChallenge && <DailyChallengeCard challenge={dailyChallenge} />}
                    
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-[var(--border-color)]">
                        <h3 className="text-md font-bold text-slate-800 mb-4">
                            Subject Mastery
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           {Object.keys(curriculum[grade as keyof typeof curriculum] ?? {}).map((subject) => (
                               <SubjectMasteryBar 
                                   key={subject}
                                   subject={subject} 
                                   percentage={calculateSubjectMastery(grade, subject, userDktData)} 
                                   color={subjectColors[subject] || 'bg-gray-500'}
                                />
                           ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <StudyPet accessories={unlockedPetAccessories || []} />
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-[var(--border-color)]">
                        <h3 className="text-md font-bold text-slate-800 mb-3">Level Progress</h3>
                        <div className="text-center my-4">
                            <span className="text-4xl font-bold text-[var(--brand-primary)]">Level {level}</span>
                        </div>
                        <SubjectMasteryBar subject={`${xp} / ${xpForNextLevel} XP`} percentage={currentLevelProgress} color="bg-amber-400" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;