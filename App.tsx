import React, { useState, useEffect, useCallback, ErrorInfo, ReactNode, Suspense, useMemo, useTransition, PropsWithChildren } from 'react';
import Header from './components/Header';
import Loader from './components/Loader';
import BottomNavBar from './components/BottomNavBar';
import ProfileSetup from './components/ProfileSetup';
import UserManagementModal from './components/UserManagementModal';
import { LessonPack, UserRole, Assignment, UserProfile, LtiContext, PracticeBlueprint } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StudentDataProvider, useStudentData } from './contexts/StudentDataContext';
import Sidebar from './components/Sidebar';
import * as ltiService from './services/ltiService';
import { SparklesIcon } from './constants/icons';

// --- Production-Ready Enhancements ---

// 1. Error Boundary to prevent crashes
interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<PropsWithChildren, ErrorBoundaryState> {
  // FIX: Added a constructor to properly initialize state and props for the class component.
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center p-8 bg-red-50 rounded-xl">
          <h1 className="text-2xl font-bold text-red-600">Something went wrong.</h1>
          <p className="text-slate-600 mt-2">We're sorry for the inconvenience. Please try refreshing the page or selecting a different lesson.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// 2. Code Splitting / Lazy Loading for main views
const LandingPage = React.lazy(() => import('./components/LandingPage'));
const LessonView = React.lazy(() => import('./components/LessonView'));
const LessonPlayerSkeleton = React.lazy(() => import('./components/LessonPlayerSkeleton'));
const AIAssistant = React.lazy(() => import('./components/AIAssistant'));
const StudyStudio = React.lazy(() => import('./components/StudyStudio'));
const StudentDashboard = React.lazy(() => import('./components/StudentDashboard'));
const CurriculumBrowser = React.lazy(() => import('./components/CurriculumBrowser'));
const Planner = React.lazy(() => import('./components/Planner'));
const FlashcardCreationModal = React.lazy(() => import('./components/FlashcardCreationModal'));
const AchievementToast = React.lazy(() => import('./components/AchievementToast'));
const RoleSelectionScreen = React.lazy(() => import('./components/RoleSelectionScreen'));
const ParentDashboard = React.lazy(() => import('./components/ParentDashboard'));
const SchoolDashboard = React.lazy(() => import('./components/school/SchoolDashboard'));
const StudentAssignments = React.lazy(() => import('./components/StudentAssignments'));
const QuizTaker = React.lazy(() => import('./components/QuizTaker'));
const PracticeCentre = React.lazy(() => import('./components/PracticeCentre'));
const ScholarWallet = React.lazy(() => import('./components/ScholarWallet'));
const ExamsView = React.lazy(() => import('./components/ExamsView'));
const LmsDashboard = React.lazy(() => import('./components/lms/LmsDashboard'));
const ProgressDashboard = React.lazy(() => import('./components/ProgressDashboard'));


// --- App Component ---

export type View = 'home' | 'learn' | 'lesson' | 'ask' | 'studio' | 'planner' | 'parentDashboard' | 'schoolDashboard' | 'assignments' | 'quiz' | 'practice' | 'progress' | 'wallet' | 'exams' | 'courses';

const AskMigaFab = ({ onClick }: { onClick: () => void }) => (
    <div className="fixed bottom-20 right-4 z-30 md:bottom-6 md:right-6">
        <button 
            onClick={onClick}
            className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full shadow-lg transform transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-indigo-300"
            aria-label="Ask MIGA AI Tutor"
        >
            <SparklesIcon className="w-8 h-8"/>
        </button>
    </div>
);


interface StudentAppProps {
    isLtiLaunch?: boolean;
    ltiContext?: LtiContext | null;
    onOpenUserModal: () => void;
    onLogout: () => void;
    handleSetTutorLock: (isUnlocked: boolean) => void;
}

const StudentApp: React.FC<StudentAppProps> = ({ isLtiLaunch = false, ltiContext = null, onOpenUserModal, onLogout, handleSetTutorLock }) => {
  const { activeProfile, updateActiveUserProfile, view, setView } = useAuth();

  const [flashcardModalChapter, setFlashcardModalChapter] = useState<{ grade: string, subject: string, chapter: string } | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Assignment | null>(null);
  const [practiceToStart, setPracticeToStart] = useState<{ subject: string; blueprint: PracticeBlueprint } | null>(null);
  const [practiceMode, setPracticeMode] = useState<'on-demand' | null>(null);

  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [aiContext, setAiContext] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const openTutorWithContext = (context: string | null = null) => {
    setAiContext(context);
    setIsTutorOpen(true);
  };
  
  useEffect(() => {
    if (view === 'ask') {
        openTutorWithContext();
        // Reset view to not stay on the 'ask' URL
        setView('home'); 
    }
  }, [view, setView]);

  // Reset tutor session lock when navigating away from the tutor
  useEffect(() => {
    if (!isTutorOpen && activeProfile?.tutorSessionUnlocked) {
      handleSetTutorLock(false);
    }
  }, [isTutorOpen, activeProfile, handleSetTutorLock]);

  const handleSelectChapter = (chapter: string, subject: string, grade: string) => {
    startTransition(() => {
      updateActiveUserProfile({ lastChapter: chapter, lastSubject: subject, grade: grade });
      setView('lesson');
    });
  };

  const handleOpenFlashcardCreator = (grade: string, subject: string, chapter: string) => {
    setFlashcardModalChapter({ grade, subject, chapter });
  };

  const handleStartQuiz = (assignment: Assignment) => {
    setActiveQuiz(assignment);
    setView('quiz');
  };

  const handleStartPracticeFromWidget = (subject: string, blueprint: PracticeBlueprint) => {
    setPracticeToStart({ subject, blueprint });
    setView('practice');
  };

  useEffect(() => {
      if (isLtiLaunch && ltiContext) {
          setView('lesson');
      }
  }, [isLtiLaunch, ltiContext, setView]);

  const renderContent = () => {
    if (!activeProfile) return <Loader />;
    
    switch(view) {
      case 'home':
        return <StudentDashboard />;
      case 'learn':
        return <CurriculumBrowser 
          onSelectChapter={handleSelectChapter}
          onOpenFlashcardCreator={handleOpenFlashcardCreator}
        />;
      case 'lesson':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LessonPlayerSkeleton />}>
              <LessonView
                isTransitioning={isPending}
                ltiContext={ltiContext}
                onFinish={() => setView('learn')}
                setAiContext={setAiContext}
              />
            </Suspense>
          </ErrorBoundary>
        );
      case 'practice':
        return <PracticeCentre 
                  examToStart={practiceToStart} 
                  onExamFinish={() => {
                    setPracticeToStart(null);
                    setPracticeMode(null);
                  }} 
                  mode={practiceMode} 
                  onBack={() => {
                    setPracticeMode(null); setView('wallet');
                  }}
                />;
      case 'planner':
        return <Planner setView={setView} onStartPractice={handleStartPracticeFromWidget} />;
      case 'assignments':
        return <StudentAssignments setView={setView} onStartQuiz={handleStartQuiz} />;
      case 'quiz':
        if (!activeQuiz) {
          setView('assignments');
          return null;
        }
        return <QuizTaker assignment={activeQuiz} onFinishQuiz={() => { setActiveQuiz(null); setView('assignments'); }} />;
      case 'studio':
        return <StudyStudio />;
      case 'wallet':
        return <ScholarWallet setView={setView} setPracticeMode={setPracticeMode} />;
      case 'progress':
        return <ProgressDashboard setView={setView} />;
      case 'exams':
        return <ExamsView />;
      case 'courses':
        return <LmsDashboard setView={setView} setActiveQuiz={setActiveQuiz} />;
      default:
        return null;
    }
  };

  const getHeaderTitle = () => {
    if (view === 'lesson' && activeProfile) return `${activeProfile.lastSubject} - ${activeProfile.lastChapter}`;
    if (view === 'quiz' && activeQuiz) return `Quiz: ${activeQuiz.title}`;
    const viewTitles = { home: `Today's Plan`, learn: 'Curriculum', practice: 'Practice Centre', planner: 'Weekly Planner', assignments: 'Homework', studio: 'Study Studio', wallet: `Scholar's Wallet`, progress: 'My Progress', exams: 'Secure Exam', courses: 'My Courses' };
    return viewTitles[view as keyof typeof viewTitles] || 'Alfanumrik';
  };

  return (
    <>
      {!isLtiLaunch && <Sidebar activeView={view} setView={setView} />}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header 
          showBackButton={['lesson', 'quiz'].includes(view)}
          onBack={() => setView(view === 'lesson' ? 'learn' : 'assignments')}
          title={getHeaderTitle()}
          onOpenUserModal={onOpenUserModal}
          userRole="student"
          onLogout={onLogout}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-20 md:pb-6 app-bg">
          <Suspense fallback={<Loader />}>
            <div className="min-h-full max-w-7xl mx-auto w-full transition-opacity duration-300">
              {renderContent()}
            </div>
          </Suspense>
        </main>
      </div>
      
      {!isLtiLaunch && (
          <>
            <AskMigaFab onClick={() => openTutorWithContext()} />
            <BottomNavBar activeView={view} setView={setView} />
          </>
      )}
      
      <Suspense fallback={null}>
        {flashcardModalChapter && (
          <FlashcardCreationModal
            chapterInfo={flashcardModalChapter}
            onClose={() => setFlashcardModalChapter(null)}
          />
        )}
        <AchievementToast />
        {isTutorOpen && (
            <AIAssistant 
                isOpen={isTutorOpen}
                onClose={() => setIsTutorOpen(false)}
                context={aiContext}
            />
        )}
      </Suspense>
    </>
  );
};


const AppContent: React.FC = () => {
    const {
    isLoading: isAppLoading,
    error: appError,
    userProfiles,
    activeProfile,
    userRole,
    handleSetRole,
    handleSaveUser,
    handleSwitchUser,
    _dangerouslySetAllProfiles: setAllProfiles,
    handleSetTutorLock,
    setView,
  } = useAuth();

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [ltiContext, setLtiContext] = useState<LtiContext | null>(null);
  
    // This logic is for auto-opening the student selector for parent/school roles
  useEffect(() => {
    if (ltiContext) return; // Don't open modals on LTI launch
    if (userRole === 'school' && !activeProfile) setIsUserModalOpen(true);
    if (userRole === 'parent' && !activeProfile) setIsUserModalOpen(true);
  }, [userRole, activeProfile, ltiContext]);

  const onSwitchUser = (id: number) => {
    handleSwitchUser(id);
    setIsUserModalOpen(false);
  };
  
  const handleLogout = () => {
    handleSetRole(null);
  };

  // RBAC: Filter profiles for parent view
  const parentUser = useMemo(() => {
    if (userRole === 'parent') {
        return userProfiles.find(p => p.childIds && p.childIds.length > 0);
    }
    return null;
  }, [userRole, userProfiles]);

  const profilesForModal = useMemo((): UserProfile[] => {
    if (userRole === 'parent' && parentUser?.childIds) {
        return userProfiles.filter(p => parentUser.childIds!.includes(p.id));
    }
    if (userRole === 'school') {
        return userProfiles.filter(p => !!p.schoolRole);
    }
    return userProfiles;
  }, [userRole, parentUser, userProfiles]);
  
  // --- RENDER LOGIC ---
  if (isAppLoading) {
    return <div className="flex items-center justify-center h-full"><Loader /></div>;
  }
  
  if (appError) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-center text-red-600 bg-red-50">
        <p>{appError}</p>
      </div>
    );
  }
  
  if (!userRole && !ltiContext) {
    return (
      <Suspense fallback={<Loader />}>
        <RoleSelectionScreen onSelectRole={handleSetRole} />
      </Suspense>
    );
  }

  // Handle profile creation if no profiles exist for the selected role
  if (userRole === 'student' && !ltiContext && userProfiles.filter(p => !p.schoolRole && !p.childIds).length === 0) {
    return (
      <div className="flex flex-col h-full bg-slate-50 font-sans text-slate-900">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <ProfileSetup onProfileSave={(data, id) => handleSaveUser(data, id)} />
        </main>
      </div>
    );
  }

  // If role is student but no specific student is active, prompt selection.
  if (userRole === 'student' && !ltiContext && !activeProfile) {
    const studentProfiles = userProfiles.filter(p => !p.schoolRole && !p.childIds);
    if (studentProfiles.length > 0) {
        return (
            <Suspense fallback={<Loader />}>
                <div className="flex items-center justify-center h-full w-full">
                    <div className="text-center p-8 animate-slide-in-up">
                        <h2 className="text-2xl font-bold text-slate-700">Select Your Profile</h2>
                        <p className="mt-2 text-slate-500 max-w-md mx-auto">
                            Please select your student profile to continue your learning journey.
                        </p>
                        <button onClick={() => setIsUserModalOpen(true)} className="btn btn-primary mt-6">
                            Select Profile
                        </button>
                        <UserManagementModal 
                            isOpen={isUserModalOpen} 
                            onClose={() => setIsUserModalOpen(false)} 
                            onSwitchUser={onSwitchUser}
                            profilesToList={studentProfiles}
                        />
                    </div>
                </div>
            </Suspense>
        )
    }
  }

  // If a role is selected but no specific user is active, prompt selection
  if (userRole !== 'student' && !ltiContext && !activeProfile) {
     return (
        <Suspense fallback={<Loader />}>
            <div className="flex items-center justify-center h-full w-full">
                 <div className="text-center p-8 animate-slide-in-up">
                    <h2 className="text-2xl font-bold text-slate-700">Select Your Profile</h2>
                    <p className="mt-2 text-slate-500 max-w-md mx-auto">
                        Please select your {userRole} profile to continue.
                    </p>
                    <button onClick={() => setIsUserModalOpen(true)} className="btn btn-primary mt-6">
                        Select Profile
                    </button>
                    <UserManagementModal 
                        isOpen={isUserModalOpen} 
                        onClose={() => setIsUserModalOpen(false)} 
                        onSwitchUser={onSwitchUser}
                        profilesToList={profilesForModal}
                    />
                </div>
            </div>
        </Suspense>
     )
  }
  
  const getHeaderTitle = () => {
    if (userRole === 'parent') return `Parent View: ${activeProfile?.name}`;
    if (userRole === 'school') return `School Dashboard: ${activeProfile?.name}`;
    return 'Alfanumrik'; // Student header title is handled inside StudentApp
  };
  
  const renderRoleSpecificApp = () => {
    if (userRole === 'student' && activeProfile) {
      return (
        <StudentDataProvider>
          <StudentApp 
            isLtiLaunch={!!ltiContext} 
            ltiContext={ltiContext} 
            onOpenUserModal={() => setIsUserModalOpen(true)}
            onLogout={handleLogout}
            handleSetTutorLock={handleSetTutorLock}
          />
          {!ltiContext && (
            <UserManagementModal
              isOpen={isUserModalOpen}
              onClose={() => setIsUserModalOpen(false)}
              onSwitchUser={(id) => { 
                handleSwitchUser(id); 
                setIsUserModalOpen(false);
              }}
              profilesToList={userProfiles.filter(p => !p.schoolRole && !p.childIds)}
            />
          )}
        </StudentDataProvider>
      );
    }

    let content;
    if (userRole === 'parent') {
      content = <ParentDashboard />;
    } else if (userRole === 'school' && activeProfile?.schoolRole) {
      content = <SchoolDashboard />;
    } else {
        content = <div>Please select a teacher or principal profile.</div>
    }

    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header 
          showBackButton={false}
          onBack={() => {}}
          title={getHeaderTitle()}
          onOpenUserModal={() => setIsUserModalOpen(true)}
          userRole={userRole}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 app-bg">
          <ErrorBoundary>
            <Suspense fallback={<Loader />}>
              <div className="min-h-full">
                {content}
              </div>
            </Suspense>
          </ErrorBoundary>
        </main>
        <UserManagementModal 
            isOpen={isUserModalOpen} 
            onClose={() => setIsUserModalOpen(false)} 
            onSwitchUser={onSwitchUser}
            profilesToList={profilesForModal}
        />
      </div>
    );
  }

  return (
    <div className="app-container flex h-full w-full font-sans text-slate-900 bg-[var(--bg-app)]">
      {renderRoleSpecificApp()}
    </div>
  );
}


const App: React.FC = () => {
  const [showLandingPage, setShowLandingPage] = useState(true);

  // LTI Launch Detection is handled here before AuthProvider is even mounted
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('lti_launch') === 'true') {
        setShowLandingPage(false); // Bypass landing page for LTI launches
    }
  }, []);

  if (showLandingPage) {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader /></div>}>
            <LandingPage onLaunch={() => setShowLandingPage(false)} />
        </Suspense>
    );
  }

  return (
    <AuthProvider>
        <AppContent />
    </AuthProvider>
  );
};

export default App;
