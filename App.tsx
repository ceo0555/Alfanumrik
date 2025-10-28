import React, { useState, useEffect, useCallback, ErrorInfo, ReactNode, Suspense, useMemo, useTransition } from 'react';
import Header from './components/Header';
import Loader from './components/Loader';
import BottomNavBar from './components/BottomNavBar';
import ProfileSetup from './components/ProfileSetup';
import UserManagementModal from './components/UserManagementModal';
import { LessonPack, UserRole, Assignment, UserProfile, LtiContext } from './types';
import { useAuth } from './contexts/AuthContext';
import { StudentDataProvider, useStudentData } from './contexts/StudentDataContext';
import Sidebar from './components/Sidebar';
import * as ltiService from './services/ltiService';

// --- Production-Ready Enhancements ---

// 1. Error Boundary to prevent crashes
interface ErrorBoundaryProps {
  children?: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
}
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // FIX: Using a constructor to initialize state and call super(props) ensures that `this.state` and `this.props` are correctly set up, resolving errors about these properties not existing.
  constructor(props: ErrorBoundaryProps) {
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
const LessonView = React.lazy(() => import('./components/LessonView'));
const LessonPlayerSkeleton = React.lazy(() => import('./components/LessonPlayerSkeleton'));
const TutorCore = React.lazy(() => import('./components/TutorCore'));
const AIAssistant = React.lazy(() => import('./components/AIAssistant'));
const AITools = React.lazy(() => import('./components/AITools'));
const StudentDashboard = React.lazy(() => import('./components/StudentDashboard'));
const CurriculumBrowser = React.lazy(() => import('./components/CurriculumBrowser'));
const Planner = React.lazy(() => import('./components/Planner'));
const FlashcardCreationModal = React.lazy(() => import('./components/FlashcardCreationModal'));
const AchievementToast = React.lazy(() => import('./components/AchievementToast'));
const RoleSelectionScreen = React.lazy(() => import('./components/RoleSelectionScreen'));
const ParentDashboard = React.lazy(() => import('./components/ParentDashboard'));
const SchoolDashboard = React.lazy(() => import('./components/SchoolDashboard'));
const StudentAssignments = React.lazy(() => import('./components/StudentAssignments'));
const QuizTaker = React.lazy(() => import('./components/QuizTaker'));
const PracticeCentre = React.lazy(() => import('./components/PracticeCentre'));
const MoreScreen = React.lazy(() => import('./components/MoreScreen'));


// --- App Component ---

export type View = 'home' | 'learn' | 'lesson' | 'ask' | 'tools' | 'tutor' | 'planner' | 'parentDashboard' | 'schoolDashboard' | 'assignments' | 'quiz' | 'practice' | 'more';


interface StudentAppProps {
    isLtiLaunch?: boolean;
    ltiContext?: LtiContext | null;
    onOpenUserModal: () => void;
    onLogout: () => void;
}

const StudentApp: React.FC<StudentAppProps> = ({ isLtiLaunch = false, ltiContext = null, onOpenUserModal, onLogout }) => {
  const { activeProfile, updateActiveUserProfile } = useAuth();

  const [view, setView] = useState<View>('home');
  const [flashcardModalChapter, setFlashcardModalChapter] = useState<{ grade: string, subject: string, chapter: string } | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Assignment | null>(null);

  const [isPending, startTransition] = useTransition();

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

  useEffect(() => {
      if (isLtiLaunch && ltiContext) {
          setView('lesson');
      }
  }, [isLtiLaunch, ltiContext]);

  const renderContent = () => {
    if (!activeProfile) return <Loader />;
    
    switch(view) {
      case 'home':
        return <StudentDashboard onContinue={() => {
          startTransition(() => {
            setView('lesson')
          });
        }} />;
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
              />
            </Suspense>
          </ErrorBoundary>
        );
      case 'practice':
        return <PracticeCentre />;
      case 'planner':
        return <Planner setView={setView} />;
      case 'assignments':
        return <StudentAssignments setView={setView} onStartQuiz={handleStartQuiz} />;
      case 'quiz':
        if (!activeQuiz) {
          setView('assignments');
          return null;
        }
        return <QuizTaker assignment={activeQuiz} onFinishQuiz={() => { setActiveQuiz(null); setView('assignments'); }} />;
      case 'ask':
        return <TutorCore />;
      case 'tutor':
        return <AIAssistant />;
      case 'tools':
        return <AITools />;
      case 'more':
        return <MoreScreen setView={setView} onOpenUserModal={onOpenUserModal} onLogout={onLogout} />;
      default:
        return null;
    }
  };

  const getHeaderTitle = () => {
    if (view === 'lesson' && activeProfile) return `${activeProfile.lastSubject} - ${activeProfile.lastChapter}`;
    if (view === 'quiz' && activeQuiz) return `Quiz: ${activeQuiz.title}`;
    const viewTitles = { home: `Welcome, ${activeProfile?.name}`, learn: 'Curriculum', practice: 'Practice Centre', planner: 'Planner', assignments: 'Homework', ask: 'AI Tutor', tutor: 'Live Tutor', tools: 'AI Studio', more: 'More Options' };
    return viewTitles[view as keyof typeof viewTitles] || 'Alfanumrik';
  };

  return (
    <>
      {!isLtiLaunch && <Sidebar activeView={view} setView={setView} />}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header 
          showBackButton={view === 'lesson' || view === 'quiz'}
          onBack={() => setView(view === 'lesson' ? 'learn' : 'assignments')}
          title={getHeaderTitle()}
          onOpenUserModal={onOpenUserModal}
          userRole="student"
          onLogout={onLogout}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-24 md:pb-6">
          <Suspense fallback={<Loader />}>
            <div className="min-h-full">
              {renderContent()}
            </div>
          </Suspense>
        </main>
      </div>

      {!isLtiLaunch && <BottomNavBar activeView={view} setView={setView} />}
      
      <Suspense>
        {flashcardModalChapter && (
          <FlashcardCreationModal
            chapterInfo={flashcardModalChapter}
            onClose={() => setFlashcardModalChapter(null)}
          />
        )}
        <AchievementToast />
      </Suspense>
    </>
  );
};


const App: React.FC = () => {
  const {
    isLoading: isAppLoading,
    error: appError,
    userProfiles,
    activeProfile,
    userRole,
    handleSetRole,
    handleSaveUser,
    handleSwitchUser,
    _dangerouslySetAllProfiles: setAllProfiles
  } = useAuth();

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [ltiContext, setLtiContext] = useState<LtiContext | null>(null);

  // LTI Launch Detection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('lti_launch') === 'true') {
        const chapterId = params.get('chapterId');
        if (chapterId) {
            const context = ltiService.handleLaunch(chapterId);
            setLtiContext(context);
            // Synthesize a user profile for the LTI session
            const ltiUser: UserProfile = {
                id: Date.now(), // Temporary ID
                name: context.user.name,
                grade: context.course.title.includes('10') ? '10' : '9', // Infer grade
                lastSubject: context.linkedResource.chapterId.split('-')[1],
                lastChapter: context.linkedResource.chapterId.split('-')[2].replace(/%20/g, ' '),
                currentStreak: 0, lastStreakDate: '', achievements: [], xp: 0, level: 1,
            };
            setAllProfiles([ltiUser]);
            handleSwitchUser(ltiUser.id);
            handleSetRole('student');
        }
    }
  }, [handleSetRole, handleSwitchUser, setAllProfiles]);


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
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
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
    <div className="flex h-full w-full font-sans text-slate-900 bg-[var(--bg-app)]">
      {renderRoleSpecificApp()}
    </div>
  );
};

export default App;