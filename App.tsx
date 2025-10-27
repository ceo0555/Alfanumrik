import React, { useState, useEffect, useCallback, ErrorInfo, ReactNode, Suspense, Component, useMemo } from 'react';
import Header from './components/Header';
import Loader from './components/Loader';
import BottomNavBar from './components/BottomNavBar';
import ProfileSetup from './components/ProfileSetup';
import UserManagementModal from './components/UserManagementModal';
import { fetchChapterContent } from './services/geminiService';
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
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // FIX: Initialize state using a class property. This is a more modern and concise approach that resolves issues with `this.state` and `this.props` not being recognized on the class instance.
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
const AdaptiveLessonPlayer = React.lazy(() => import('./components/AdaptiveLessonPlayer'));
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


// --- App Component ---

export type View = 'home' | 'learn' | 'lesson' | 'ask' | 'tools' | 'tutor' | 'planner' | 'parentDashboard' | 'schoolDashboard' | 'assignments' | 'quiz';


interface StudentAppProps {
    isLtiLaunch?: boolean;
    ltiContext?: LtiContext | null;
}

const StudentApp: React.FC<StudentAppProps> = ({ isLtiLaunch = false, ltiContext = null }) => {
  const { activeProfile, updateActiveUserProfile, handleSwitchUser, userProfiles } = useAuth();
  const { startChapter } = useStudentData();

  const [view, setView] = useState<View>('home');
  const [lessonPack, setLessonPack] = useState<LessonPack | null>(null);
  const [isLessonLoading, setIsLessonLoading] = useState<boolean>(false);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [flashcardModalChapter, setFlashcardModalChapter] = useState<{ grade: string, subject: string, chapter: string } | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Assignment | null>(null);


  const handleSelectChapter = (chapter: string, subject: string, grade: string) => {
    updateActiveUserProfile({ lastChapter: chapter, lastSubject: subject, grade: grade });
    setView('lesson');
  };

  const handleOpenFlashcardCreator = (grade: string, subject: string, chapter: string) => {
    setFlashcardModalChapter({ grade, subject, chapter });
  };

  const handleStartQuiz = (assignment: Assignment) => {
    setActiveQuiz(assignment);
    setView('quiz');
  };

  const loadContent = useCallback(async () => {
    if (view !== 'lesson' || !activeProfile) return;

    if (lessonPack && lessonPack.topic_name === activeProfile.lastChapter && lessonPack.topic_id.startsWith(`G${activeProfile.grade}-${activeProfile.lastSubject.substring(0,3).toUpperCase()}`)) {
        return;
    }
    
    startChapter();

    setIsLessonLoading(true);
    setLessonError(null);
    setLessonPack(null);
    try {
      const { grade, lastSubject, lastChapter } = activeProfile;
      const content = await fetchChapterContent(grade, lastSubject, lastChapter);
      setLessonPack(content);
    } catch (err) {
      setLessonError('Failed to fetch chapter content. Please try again.');
      console.error(err);
    } finally {
      setIsLessonLoading(false);
    }
  }, [activeProfile, view, lessonPack, startChapter]);


  useEffect(() => {
      if (isLtiLaunch && ltiContext) {
          setView('lesson');
      }
  }, [isLtiLaunch, ltiContext]);

  useEffect(() => {
    if (view === 'lesson' && activeProfile) {
        loadContent();
    }
  }, [view, loadContent, activeProfile]);

  const renderContent = () => {
    if (!activeProfile) return <Loader />;
    
    switch(view) {
      case 'home':
        return <StudentDashboard onContinue={() => setView('lesson')} />;
      case 'learn':
        return <CurriculumBrowser 
          onSelectChapter={handleSelectChapter}
          onOpenFlashcardCreator={handleOpenFlashcardCreator}
        />;
      case 'lesson':
        if (isLessonLoading) return <Loader />;
        if (lessonError) return <div className="text-center text-red-500 p-4 bg-red-50 rounded-lg">{lessonError}</div>;
        return <AdaptiveLessonPlayer lessonPack={lessonPack} ltiContext={ltiContext} />;
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
      default:
        return null;
    }
  };

  const getHeaderTitle = () => {
    if (view === 'lesson' && activeProfile) return `${activeProfile.lastSubject} - ${activeProfile.lastChapter}`;
    if (view === 'quiz' && activeQuiz) return `Quiz: ${activeQuiz.title}`;
    const viewTitles = { home: `Welcome, ${activeProfile?.name}`, learn: 'Curriculum', planner: 'Planner', assignments: 'My Assignments', ask: 'AI Tutor', tutor: 'Live Tutor', tools: 'AI Studio' };
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
          onOpenUserModal={() => setIsUserModalOpen(true)}
          userRole="student"
          onLogout={() => {}} // Logout handled in parent
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-24 md:pb-6">
          <ErrorBoundary>
            <Suspense fallback={<Loader />}>
              <div className="min-h-full">
                {renderContent()}
              </div>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {!isLtiLaunch && <BottomNavBar activeView={view} setView={setView} />}
      
      {!isLtiLaunch && (
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
          <StudentApp isLtiLaunch={!!ltiContext} ltiContext={ltiContext} />
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
