import React, { useState, useEffect, useCallback, ErrorInfo, ReactNode, Suspense, useMemo, useTransition } from 'react';
import Header from './components/Header';
import Loader from './components/Loader';
import BottomNavBar from './components/BottomNavBar';
import ProfileSetup from './components/ProfileSetup';
import UserManagementModal from './components/UserManagementModal';
import { LessonPack, UserRole, Assignment, UserProfile, LtiContext, PracticeBlueprint, SyllabusChapterTopic, UserDktData, TutorInterventionContext } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StudentDataProvider, useStudentData } from './contexts/StudentDataContext';
import Sidebar from './components/Sidebar';
import * as ltiService from './services/ltiService';
import { SparklesIcon } from './constants/icons';
import LessonPlayerSkeleton from './components/LessonPlayerSkeleton';

// Define and export the View type used for navigation across the app.
export type View = 'home' | 'academics' | 'assess' | 'studio' | 'lesson' | 'quiz' | 'ask';

// --- Production-Ready Enhancements ---

// 1. Error Boundary to prevent crashes
interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
}

// FIX: Refactored ErrorBoundary to use a class property for state, which resolves TS errors about 'state' and 'props' not existing.
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

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
const AIAssistant = React.lazy(() => import('./components/AIAssistant'));
const StudentDashboard = React.lazy(() => import('./StudentDashboard'));
const FlashcardCreationModal = React.lazy(() => import('./components/FlashcardCreationModal'));
const AchievementToast = React.lazy(() => import('./components/AchievementToast'));
const RoleSelectionScreen = React.lazy(() => import('./components/RoleSelectionScreen'));
const ParentDashboard = React.lazy(() => import('./components/ParentDashboard'));
const SchoolDashboard = React.lazy(() => import('./components/school/SchoolDashboard'));
const QuizTaker = React.lazy(() => import('./components/QuizTaker'));
const AcademicsView = React.lazy(() => import('./components/AcademicsView'));
const AssessView = React.lazy(() => import('./components/AssessView'));
const StudioView = React.lazy(() => import('./components/AITools'));
const ScholarWallet = React.lazy(() => import('./components/ScholarWallet'));
const DeepDiveModal = React.lazy(() => import('./components/DeepDiveModal'));
const ExitLessonConfirmationModal = React.lazy(() => import('./components/ExitLessonConfirmationModal'));


// --- App Component ---

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
    ltiContext: LtiContext | null;
    onOpenUserModal: () => void;
    onLogout: () => void;
    handleSetTutorLock: (isUnlocked: boolean) => void;
    onToggleSidebar: () => void;
}

const StudentApp: React.FC<StudentAppProps> = ({ ltiContext, onOpenUserModal, onLogout, handleSetTutorLock, onToggleSidebar }) => {
  const { activeProfile, updateActiveUserProfile, view, setView, activeTopic, setActiveTopic } = useAuth();
  const { resetTopicProgress, userDktData } = useStudentData();

  const [flashcardModalChapter, setFlashcardModalChapter] = useState<{ grade: string, subject: string, chapter: string } | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Assignment | null>(null);
  const [practiceToStart, setPracticeToStart] = useState<{ subject: string; blueprint: PracticeBlueprint } | null>(null);
    const [practiceMode, setPracticeMode] = useState<'on-demand' | 'yolo' | null>(null);

  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [aiContext, setAiContext] = useState<string | null>(null);
  const [tutorInterventionContext, setTutorInterventionContext] = useState<TutorInterventionContext | null>(null);


  const [isPending, startTransition] = useTransition();

  // State for lesson exit confirmation
  const [isLessonInProgress, setIsLessonInProgress] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [nextViewOnExit, setNextViewOnExit] = useState<View | null>(null);

  const handleNavigation = (targetView: View) => {
    if (view === 'lesson' && isLessonInProgress) {
        setNextViewOnExit(targetView);
        setIsExitModalOpen(true);
    } else {
        setView(targetView);
    }
  };

  const handleSaveAndExit = () => {
    if (nextViewOnExit) setView(nextViewOnExit);
    setIsExitModalOpen(false);
    setNextViewOnExit(null);
    setIsLessonInProgress(false);
  };

  const handleDiscardAndExit = () => {
    if (nextViewOnExit && activeTopic) {
        const topicId = `${activeTopic.chapter.topic_id}|${activeTopic.topic}`;
        resetTopicProgress(topicId);
        setView(nextViewOnExit);
    }
    setIsExitModalOpen(false);
    setNextViewOnExit(null);
    setIsLessonInProgress(false);
  };

  const handleCancelExit = () => {
    setIsExitModalOpen(false);
    setNextViewOnExit(null);
  };
  
  const handleTriggerTutorIntervention = (context: TutorInterventionContext) => {
    setTutorInterventionContext(context);
    setIsTutorOpen(true);
  };

  const openTutorWithContext = (context: string | null = null) => {
    setAiContext(context);
    setTutorInterventionContext(null); // Ensure intervention context is cleared
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

  const handleSelectTopic = (chapter: SyllabusChapterTopic, topic: string) => {
    startTransition(() => {
      // While activeTopic is the main driver, we still update lastChapter for persistence
      updateActiveUserProfile({ lastChapter: chapter.topic_name, lastSubject: chapter.topic_id.split('-')[1], grade: chapter.topic_id.split('-')[0].substring(1) });
      setActiveTopic({ chapter, topic });
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
    setView('assess');
  };

  useEffect(() => {
      if (ltiContext) {
          setView('lesson');
      }
  }, [ltiContext, setView]);

  const renderContent = () => {
    if (!activeProfile) return <Loader />;
    
    switch(view) {
      case 'home':
        return <StudentDashboard onStartPractice={handleStartPracticeFromWidget} setView={handleNavigation} />;
      case 'academics':
        return <AcademicsView
            onSelectTopic={handleSelectTopic}
            onOpenFlashcardCreator={handleOpenFlashcardCreator}
            setView={handleNavigation}
            onStartQuiz={handleStartQuiz}
        />;
       case 'assess':
        return <AssessView 
            examToStart={practiceToStart}
            onExamFinish={() => {
                setPracticeToStart(null);
                setPracticeMode(null);
            }}
            mode={practiceMode}
            setView={handleNavigation}
        />;
       case 'studio':
        return <StudioView 
            setView={handleNavigation}
            onStartPractice={handleStartPracticeFromWidget}
            setPracticeMode={setPracticeMode}
        />;
      case 'lesson':
        return (
          <ErrorBoundary>
            <LessonView
              isTransitioning={isPending}
              ltiContext={ltiContext}
              onFinish={() => handleNavigation('academics')}
              setAiContext={setAiContext}
              onProgressUpdate={setIsLessonInProgress}
              onTriggerTutorIntervention={handleTriggerTutorIntervention}
            />
          </ErrorBoundary>
        );
      case 'quiz':
        if (!activeQuiz) {
          handleNavigation('academics');
          return null;
        }
        return <QuizTaker assignment={activeQuiz} onFinishQuiz={() => { setActiveQuiz(null); handleNavigation('academics'); }} />;
      default:
        return <StudentDashboard onStartPractice={handleStartPracticeFromWidget} setView={handleNavigation} />;
    }
  };

  const getHeaderTitle = () => {
    if (view === 'lesson' && activeTopic) return `${activeTopic.chapter.topic_name} - ${activeTopic.topic}`;
    if (view === 'quiz' && activeQuiz) return `Quiz: ${activeQuiz.title}`;
    const viewTitles = { 
        home: `Welcome, ${activeProfile?.name}`, 
        academics: 'Academics', 
        assess: 'Assess', 
        studio: 'Studio',
    };
    return viewTitles[view as keyof typeof viewTitles] || 'Alfanumrik';
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <Header 
        showBackButton={['lesson', 'quiz'].includes(view)}
        onBack={() => handleNavigation(view === 'lesson' ? 'academics' : 'academics')}
        title={getHeaderTitle()}
        onOpenUserModal={onOpenUserModal}
        userRole="student"
        onLogout={onLogout}
        onToggleSidebar={onToggleSidebar}
      />
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-20 lg:pb-6 bg-[var(--bg-app)]">
        <Suspense fallback={<LessonPlayerSkeleton />}>
          <div className="min-h-full max-w-7xl mx-auto w-full">
            {renderContent()}
          </div>
        </Suspense>
      </main>
      
      {!ltiContext && (
          <>
            <AskMigaFab onClick={() => openTutorWithContext()} />
            <BottomNavBar activeView={view} setView={handleNavigation} />
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
                onClose={() => { setIsTutorOpen(false); setTutorInterventionContext(null); }}
                context={aiContext}
                interventionContext={tutorInterventionContext}
                dktData={userDktData}
            />
        )}
        <ExitLessonConfirmationModal
          isOpen={isExitModalOpen}
          onSaveAndExit={handleSaveAndExit}
          onDiscardAndExit={handleDiscardAndExit}
          onCancel={handleCancelExit}
        />
        <DeepDiveModal
            isOpen={false}
            onClose={()=>{}}
            isLoading={false}
            content=""
            title=""
        />
      </Suspense>
    </div>
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
    view,
    setView,
  } = useAuth();

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [ltiContext, setLtiContext] = useState<LtiContext | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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
            ltiContext={ltiContext} 
            onOpenUserModal={() => setIsUserModalOpen(true)}
            onLogout={handleLogout}
            handleSetTutorLock={handleSetTutorLock}
            onToggleSidebar={() => setIsSidebarOpen(p => !p)}
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
          onToggleSidebar={() => {}}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 bg-[var(--bg-app)]">
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
    <div className="flex h-full w-full bg-[var(--bg-app)]">
       {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden animate-fade-in"
          aria-hidden="true"
        ></div>
      )}
      {!ltiContext && userRole === 'student' && (
        <Sidebar 
            activeView={view} 
            setView={setView} 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
        />
      )}
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