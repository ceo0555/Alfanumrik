import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { UserProfile, UserRole, AllProgressData, AllFlashcardsData, AllDktData, Assignment, Announcement, StudentSubmission, StudentFlnProgress, TeacherSchedule, AttendanceRecord, QuickFormativeAssessment, Notification, QuestionPoolItem, BusRoute, PrintQuota, FeeStatus, AfterSchoolProgram, FacilityBooking, BoardPlannerEvent, CrossCurricularProject, CodingModule, CommunicationTemplate, TeacherAssignment, StudentPortfolioProject, AllPortfolios, WidgetConfig, PaperBlueprint, ExamSession, ExamSubmission, Course, Grade, StudyTask, SyllabusChapterTopic } from '../types';
import * as apiService from '../services/apiService';
import type { View } from '../App';
import { appEventBus } from '../utils/eventBus';

interface AuthState {
  isLoading: boolean;
  error: string | null;
  userProfiles: UserProfile[];
  activeUserId: number | null;
  activeProfile: UserProfile | null;
  userRole: UserRole | null;
  allProgressData: AllProgressData;
  allFlashcards: AllFlashcardsData;
  allDktData: AllDktData;
  allAssignments: Assignment[];
  allAnnouncements: Announcement[];
  allSubmissions: StudentSubmission[];
  allFlnProgress: StudentFlnProgress;
  teacherSchedules: TeacherSchedule[];
  teacherAssignments: TeacherAssignment[];
  attendanceRecords: AttendanceRecord;
  quickFormativeAssessments: QuickFormativeAssessment[];
  allNotifications: Notification[];
  itemBank: QuestionPoolItem[];
  busRoutes: BusRoute[];
  printQuotas: PrintQuota[];
  feeStatus: FeeStatus[];
  afterSchoolPrograms: AfterSchoolProgram[];
  facilityBookings: FacilityBooking[];
  boardPlannerEvents: BoardPlannerEvent[];
  crossCurricularProjects: CrossCurricularProject[];
  codingModules: CodingModule[];
  communicationTemplates: CommunicationTemplate[];
  allPortfolios: AllPortfolios;
  schoolName: string;
  allBlueprints: PaperBlueprint[];
  allExamSessions: ExamSession[];
  allExamSubmissions: ExamSubmission[];
  allCourses: Course[];
  allGrades: Grade[];
  view: View;
  activeTopic: { chapter: SyllabusChapterTopic; topic: string } | null;
}

interface AuthActions {
  handleSetRole: (role: UserRole | null) => void;
  handleSaveUser: (userData: { name: string; grade: string } | { name: string; grade: string }[], id?: number) => void;
  handleSwitchUser: (id: number) => void;
  updateActiveUserProfile: (updates: Partial<UserProfile>) => void;
  handleUpdateStudyPlan: (plan: StudyTask[]) => void;
  handleUpdateSingleTask: (taskId: string, updates: Partial<StudyTask>) => void;
  handleUpdateWidgets: (widgets: WidgetConfig[]) => void;
  handleUpdateScholarCoins: (newBalance: number) => void;
  handleSaveAllDktData: (dktData: AllDktData) => void;
  handleCreateAssignment: (assignmentData: Omit<Assignment, 'id'>) => void;
  handleAddTaskToStudentPlans: (studentIds: number[], task: Omit<StudyTask, 'id'>) => void;
  handleCreateAnnouncement: (announcementData: Omit<Announcement, 'id' | 'date'>) => void;
  handleSaveSubmission: (submission: Omit<StudentSubmission, 'id'>) => void;
  handleUpdateSubmission: (submission: StudentSubmission) => void;
  handleSaveAllFlnProgress: (progress: StudentFlnProgress) => void;
  handleSaveAttendance: (scheduleId: string, attendance: { [studentId: number]: 'present' | 'absent' }) => void;
  handleSaveQfas: (qfas: QuickFormativeAssessment[]) => void;
  handleUpdateTeacherSchedule: (scheduleId: string, updates: { isTaught?: boolean; notes?: string }) => void;
  handleUpdateItemBank: (updatedItems: QuestionPoolItem[]) => void;
  handleUpdateBusRoutes: (routes: BusRoute[]) => void;
  handleUpdatePrintQuotas: (quotas: PrintQuota[]) => void;
  handleUpdateFeeStatus: (statuses: FeeStatus[]) => void;
  handleUpdateAfterSchoolPrograms: (programs: AfterSchoolProgram[]) => void;
  handleUpdateFacilityBookings: (bookings: FacilityBooking[]) => void;
  handleUpdateBoardPlannerEvents: (events: BoardPlannerEvent[]) => void;
  handleUpdateCrossCurricularProjects: (projects: CrossCurricularProject[]) => void;
  handleUpdatePortfolios: (portfolios: AllPortfolios) => void;
  handleUpdateSchoolName: (name: string) => void;
  handleUpdateBlueprints: (blueprints: PaperBlueprint[]) => void;
  handleSetTutorLock: (isUnlocked: boolean) => void;
  handleSaveExamSessions: (sessions: ExamSession[]) => void;
  handleSaveExamSubmission: (submission: Omit<ExamSubmission, 'id'>) => void;
  handleUpdateCourses: (courses: Course[]) => void;
  handleUpdateGrades: (grades: Grade[]) => void;
  setView: (view: View) => void;
  setActiveTopic: (topic: { chapter: SyllabusChapterTopic; topic: string } | null) => void;
  _dangerouslySetAllProfiles: (profiles: UserProfile[]) => void;
}

type AuthContextType = AuthState & AuthActions;

const AuthStateContext = createContext<AuthState | undefined>(undefined);
const AuthActionsContext = createContext<AuthActions | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [activeUserId, setActiveUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [allProgressData, setAllProgressData] = useState<AllProgressData>({});
  const [allFlashcards, setAllFlashcards] = useState<AllFlashcardsData>({});
  const [allDktData, setAllDktData] = useState<AllDktData>({});
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<StudentSubmission[]>([]);
  const [allFlnProgress, setAllFlnProgress] = useState<StudentFlnProgress>({});
  const [teacherSchedules, setTeacherSchedules] = useState<TeacherSchedule[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord>({});
  const [quickFormativeAssessments, setQuickFormativeAssessments] = useState<QuickFormativeAssessment[]>([]);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [itemBank, setItemBank] = useState<QuestionPoolItem[]>([]);
  const [busRoutes, setBusRoutes] = useState<BusRoute[]>([]);
  const [printQuotas, setPrintQuotas] = useState<PrintQuota[]>([]);
  const [feeStatus, setFeeStatus] = useState<FeeStatus[]>([]);
  const [afterSchoolPrograms, setAfterSchoolPrograms] = useState<AfterSchoolProgram[]>([]);
  const [facilityBookings, setFacilityBookings] = useState<FacilityBooking[]>([]);
  const [boardPlannerEvents, setBoardPlannerEvents] = useState<BoardPlannerEvent[]>([]);
  const [crossCurricularProjects, setCrossCurricularProjects] = useState<CrossCurricularProject[]>([]);
  const [codingModules, setCodingModules] = useState<CodingModule[]>([]);
  const [communicationTemplates, setCommunicationTemplates] = useState<CommunicationTemplate[]>([]);
  const [allPortfolios, setAllPortfolios] = useState<AllPortfolios>([]);
  const [schoolName, setSchoolName] = useState("");
  const [allBlueprints, setAllBlueprints] = useState<PaperBlueprint[]>([]);
  const [allExamSessions, setAllExamSessions] = useState<ExamSession[]>([]);
  const [allExamSubmissions, setAllExamSubmissions] = useState<ExamSubmission[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allGrades, setAllGrades] = useState<Grade[]>([]);

  // Add a state for view management
  const [view, setViewState] = useState<View>('home');
  const [activeTopic, setActiveTopicState] = useState<{ chapter: SyllabusChapterTopic; topic: string } | null>(null);
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = useCallback(async () => {
    try {
      // Don't show main loader on real-time refetches
      // setIsLoading(true); 
      const data = await apiService.fetchAllData();
      setUserProfiles(data.profiles);
      setActiveUserId(data.activeId);
      setAllProgressData(data.progress);
      setAllFlashcards(data.flashcards);
      setAllDktData(data.allDktData);
      setUserRole(data.userRole);
      setAllAssignments(data.allAssignments);
      setAllAnnouncements(data.allAnnouncements);
      setAllSubmissions(data.allSubmissions);
      setAllFlnProgress(data.allFlnProgress);
      setTeacherSchedules(data.teacherSchedules);
      setTeacherAssignments(data.teacherAssignments);
      setAttendanceRecords(data.attendanceRecords);
      setQuickFormativeAssessments(data.quickFormativeAssessments);
      setAllNotifications(data.allNotifications);
      setItemBank(data.itemBank);
      setBusRoutes(data.busRoutes);
      setPrintQuotas(data.printQuotas);
      setFeeStatus(data.feeStatus);
      setAfterSchoolPrograms(data.afterSchoolPrograms);
      setFacilityBookings(data.facilityBookings);
      setBoardPlannerEvents(data.boardPlannerEvents);
      setCrossCurricularProjects(data.crossCurricularProjects);
      setCodingModules(data.codingModules);
      setCommunicationTemplates(data.communicationTemplates);
      setAllPortfolios(data.allPortfolios);
      setSchoolName(data.schoolName);
      setAllBlueprints(data.allBlueprints);
      setAllExamSessions(data.allExamSessions);
      setAllExamSubmissions(data.allExamSubmissions);
      setAllCourses(data.allCourses);
      setAllGrades(data.allGrades);
    } catch (e) {
      console.error("Failed to load user data:", e);
      setError("Could not load your data. Please try refreshing the page.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data load and real-time event listener setup
  useEffect(() => {
    loadData();

    const handleDataChange = (data?: { store: string }) => {
        console.log(`[Real-Time Sync] Data changed in '${data?.store || 'unknown'}'. Refetching all data.`);
        if (reloadTimeoutRef.current) {
          clearTimeout(reloadTimeoutRef.current);
        }
        reloadTimeoutRef.current = setTimeout(() => {
          loadData();
        }, 150);
    };

    appEventBus.on('data-changed', handleDataChange);

    return () => {
        if (reloadTimeoutRef.current) {
          clearTimeout(reloadTimeoutRef.current);
          reloadTimeoutRef.current = null;
        }
        appEventBus.off('data-changed', handleDataChange);
    };
}, [loadData]);

  const activeProfile = useMemo(() => {
    return userProfiles.find(p => p.id === activeUserId) || null;
  }, [userProfiles, activeUserId]);

  const handleSwitchUser = useCallback(async (id: number) => {
    try {
      const newActiveId = await apiService.saveActiveUserId(id);
      setActiveUserId(newActiveId);
    } catch (e) {
      console.error("Failed to switch user:", e);
    }
  }, []);

  const handleSetRole = useCallback(async (role: UserRole | null) => {
    try {
        await apiService.saveUserRole(role);
        setUserRole(role);
        // Reset active user when role changes to force selection
        handleSwitchUser(0);
    } catch (e) {
      console.error("Failed to set user role:", e);
    }
  }, [handleSwitchUser]);
  
  const handleSaveUser = useCallback(async (userData: { name: string; grade: string } | { name: string; grade: string }[], idToEdit?: number) => {
    try {
      const updatedProfiles = await apiService.saveUserProfile(userProfiles, userData, idToEdit);
      setUserProfiles(updatedProfiles);
      // If this is a single new user, make them active.
      if (!Array.isArray(userData) && !idToEdit) {
        const newId = updatedProfiles[updatedProfiles.length - 1].id;
        handleSwitchUser(newId);
      }
    } catch (e) {
      console.error("Failed to save user profile:", e);
    }
  }, [userProfiles, handleSwitchUser]);

  const handleCreateAssignment = useCallback(async (assignmentData: Omit<Assignment, 'id'>) => {
    const newAssignment: Assignment = { ...assignmentData, id: Date.now().toString() };
    const updatedAssignments = [...allAssignments, newAssignment];
    setAllAssignments(updatedAssignments); // Optimistic update
    try {
        await apiService.saveAllAssignments(updatedAssignments);
    } catch (e) {
        console.error("Failed to save assignment", e);
        setAllAssignments(allAssignments); // Revert
    }
  }, [allAssignments]);

  const handleAddTaskToStudentPlans = useCallback(async (studentIds: number[], task: Omit<StudyTask, 'id'>) => {
      const updatedProfiles = userProfiles.map(p => {
          if (studentIds.includes(p.id)) {
              const newTask: StudyTask = {
                  ...task,
                  id: `task-${Date.now()}-${Math.random()}`
              };
              return {
                  ...p,
                  studyPlan: [...(p.studyPlan || []), newTask]
              };
          }
          return p;
      });
      setUserProfiles(updatedProfiles);
      // In a real app, this would be a single API call.
      // Here we simulate saving each updated profile.
      for (const studentId of studentIds) {
          const profile = updatedProfiles.find(p => p.id === studentId);
          if (profile) {
              await apiService.updateUserProfileData(studentId, { studyPlan: profile.studyPlan });
          }
      }
  }, [userProfiles]);

  const handleAddNotification = useCallback(async (notificationData: Omit<Notification, 'id' | 'date' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: `notif-${Date.now()}`,
      date: new Date().toISOString(),
      isRead: false,
    };
    const updatedNotifications = [newNotification, ...allNotifications];
    setAllNotifications(updatedNotifications); // Optimistic update
    try {
        await apiService.saveAllNotifications(updatedNotifications);
    } catch(e) {
        console.error("Failed to save notification", e);
        setAllNotifications(allNotifications); // Revert
    }
  }, [allNotifications]);
  
  const handleCreateAnnouncement = useCallback(async (announcementData: Omit<Announcement, 'id' | 'date'>) => {
    const newAnnouncement: Announcement = { 
        ...announcementData, 
        id: Date.now().toString(),
        date: new Date().toISOString()
    };
    const updatedAnnouncements = [newAnnouncement, ...allAnnouncements];
    setAllAnnouncements(updatedAnnouncements); // Optimistic update
    try {
        await apiService.saveAllAnnouncements(updatedAnnouncements);
    } catch (e) {
        console.error("Failed to save announcement", e);
        setAllAnnouncements(allAnnouncements); // Revert
    }
  }, [allAnnouncements]);
  
  const handleSaveSubmission = useCallback(async (submissionData: Omit<StudentSubmission, 'id'>) => {
    const newSubmission: StudentSubmission = { ...submissionData, id: Date.now().toString() };
    const updatedSubmissions = [...allSubmissions, newSubmission];
    setAllSubmissions(updatedSubmissions); // Optimistic update
    try {
        await apiService.saveAllSubmissions(updatedSubmissions);
    } catch(e) {
        console.error("Failed to save submission", e);
        setAllSubmissions(allSubmissions); // Revert
    }
  }, [allSubmissions]);

  const handleUpdateSubmission = useCallback(async (updatedSubmission: StudentSubmission) => {
    const updatedSubmissions = allSubmissions.map(s => s.id === updatedSubmission.id ? updatedSubmission : s);
    setAllSubmissions(updatedSubmissions); // Optimistic update
    
    // LMS GRADEBOOK INTEGRATION
    if (updatedSubmission.status === 'graded') {
      const assignment = allAssignments.find(a => a.id === updatedSubmission.assignmentId);
      if (assignment) {
        const course = allCourses.find(c => c.content.some(item => item.contentId === assignment.id));
        if (course) {
          const newGrade: Grade = {
            id: `grade-${updatedSubmission.id}`,
            studentId: updatedSubmission.studentId,
            courseId: course.id,
            assignmentId: assignment.id,
            score: updatedSubmission.score || 0,
            totalMarks: assignment.quizQuestions?.length || 0,
          };
          
          const existingGradeIndex = allGrades.findIndex(g => g.assignmentId === newGrade.assignmentId && g.studentId === newGrade.studentId);
          let updatedGrades = [...allGrades];
          if (existingGradeIndex > -1) {
            updatedGrades[existingGradeIndex] = newGrade;
          } else {
            updatedGrades.push(newGrade);
          }
          setAllGrades(updatedGrades);
          await apiService.saveAllGrades(updatedGrades);
        }
      }
    }

    try {
        await apiService.saveAllSubmissions(updatedSubmissions);
    } catch (e) {
        console.error("Failed to update submission", e);
        setAllSubmissions(allSubmissions); // Revert
    }
  }, [allSubmissions, allAssignments, allCourses, allGrades]);

  const handleSaveAllFlnProgress = useCallback(async (progress: StudentFlnProgress) => {
    setAllFlnProgress(progress); // Optimistic
    try {
        await apiService.saveAllFlnProgress(progress);
    } catch (e) {
        console.error("Failed to save FLN progress", e);
    }
  }, []);

  const updateActiveUserProfile = useCallback(async (updates: Partial<UserProfile>) => {
      if (!activeUserId) return;
      const oldProfiles = [...userProfiles];
      
      let updatedProfile: UserProfile | null = null;
      const updatedProfiles = oldProfiles.map(p => {
        if (p.id === activeUserId) {
            updatedProfile = { ...p, ...updates };
            return updatedProfile;
        }
        return p;
      });

      setUserProfiles(updatedProfiles); // Optimistic update
      try {
        if (updatedProfile) {
            await apiService.updateUserProfileData(activeUserId, updates);
        } else {
            throw new Error("Profile not found for update");
        }
      } catch (e) {
        console.error("Failed to update user profile:", e);
        setUserProfiles(oldProfiles); // Revert
      }
  }, [activeUserId, userProfiles]);
  
  const handleUpdateStudyPlan = useCallback((plan: StudyTask[]) => {
    if (!activeProfile) return;
    updateActiveUserProfile({ studyPlan: plan });
  }, [activeProfile, updateActiveUserProfile]);

  const handleUpdateSingleTask = useCallback((taskId: string, updates: Partial<StudyTask>) => {
      if (!activeProfile || !activeProfile.studyPlan) return;
      
      const updatedPlan = activeProfile.studyPlan.map(task => 
          task.id === taskId ? { ...task, ...updates } : task
      );
      
      updateActiveUserProfile({ studyPlan: updatedPlan });

  }, [activeProfile, updateActiveUserProfile]);

  const handleUpdateWidgets = useCallback((widgets: WidgetConfig[]) => {
    if (!activeProfile) return;
    updateActiveUserProfile({ widgets });
  }, [activeProfile, updateActiveUserProfile]);

  const handleUpdateScholarCoins = useCallback((newBalance: number) => {
    if (!activeProfile) return;
    updateActiveUserProfile({ scholarCoins: newBalance });
  }, [activeProfile, updateActiveUserProfile]);

  const handleSetTutorLock = useCallback((isUnlocked: boolean) => {
    if (!activeProfile) return;
    updateActiveUserProfile({ tutorSessionUnlocked: isUnlocked });
  }, [activeProfile, updateActiveUserProfile]);

  const handleSaveAllDktData = useCallback(async (dktData: AllDktData) => {
    setAllDktData(dktData); // Optimistic update
    try {
      await apiService.saveAllDktData(dktData);
    } catch (e) {
      console.error("Failed to save DKT data:", e);
      // Note: Reverting could be complex if multiple updates happened.
      // For this simulation, we'll log the error and hope for the best.
    }
  }, []);

  const handleSaveAttendance = useCallback(async (scheduleId: string, attendance: { [studentId: number]: 'present' | 'absent' }) => {
    const updatedRecords = { ...attendanceRecords, [scheduleId]: attendance };
    setAttendanceRecords(updatedRecords); // Optimistic update

    // --- Attendance Recovery Logic ---
    const scheduleItem = teacherSchedules.find(s => s.id === scheduleId);
    if (!scheduleItem) return;

    const absentStudentIds = Object.entries(attendance)
        .filter(([, status]) => status === 'absent')
        .map(([id]) => Number(id));

    for (const studentId of absentStudentIds) {
        const student = userProfiles.find(p => p.id === studentId);
        if(!student) continue;

        const catchUpAssignment: Omit<Assignment, 'id'> = {
            title: `Catch-up: ${scheduleItem.topic}`,
            instructions: `Please complete this lesson as you were absent on ${new Date().toLocaleDateString()}.`,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
            assignedChapterIds: [scheduleItem.chapterId],
            classGrade: scheduleItem.grade,
            assignedStudentIds: [studentId],
            assignmentType: 'chapters',
            isCatchUp: true,
        };
        handleCreateAssignment(catchUpAssignment);

        // Create notification for parent dashboard
        handleAddNotification({
            userId: studentId,
            title: "Attendance Alert & Catch-up Plan",
            message: `${student.name} was marked absent today. A catch-up assignment for "${scheduleItem.topic}" has been automatically created.`,
        });
    }

    try {
        await apiService.saveAttendanceRecords(updatedRecords);
    } catch (e) {
        console.error("Failed to save attendance:", e);
        setAttendanceRecords(attendanceRecords); // Revert
    }
  }, [attendanceRecords, teacherSchedules, userProfiles, handleCreateAssignment, handleAddNotification]);
  
  const handleSaveQfas = useCallback(async (qfas: QuickFormativeAssessment[]) => {
      setQuickFormativeAssessments(qfas); // Optimistic
      try {
          await apiService.saveQuickFormativeAssessments(qfas);
      } catch (e) {
          console.error("Failed to save QFAs:", e);
      }
  }, []);

  const handleUpdateTeacherSchedule = useCallback(async (scheduleId: string, updates: { isTaught?: boolean; notes?: string }) => {
      const updatedSchedules = teacherSchedules.map(s => s.id === scheduleId ? { ...s, ...updates } : s);
      setTeacherSchedules(updatedSchedules); // Optimistic update
      try {
          await apiService.saveTeacherSchedules(updatedSchedules);
      } catch (e) {
          console.error("Failed to update teacher schedule", e);
          setTeacherSchedules(teacherSchedules); // Revert
      }
  }, [teacherSchedules]);
  
  const handleUpdateItemBank = useCallback(async (updatedItems: QuestionPoolItem[]) => {
      setItemBank(updatedItems); // Optimistic update
      try {
          await apiService.saveItemBank(updatedItems);
      } catch (e) {
          console.error("Failed to update item bank", e);
          setItemBank(itemBank); // Revert
      }
  }, [itemBank]);

  // --- NEW HANDLERS FOR DEEP IMPLEMENTATION ---
  const handleUpdateBusRoutes = useCallback(async (routes: BusRoute[]) => {
    setBusRoutes(routes);
    await apiService.saveAllBusRoutes(routes);
  }, []);
  const handleUpdatePrintQuotas = useCallback(async (quotas: PrintQuota[]) => {
    setPrintQuotas(quotas);
    await apiService.saveAllPrintQuotas(quotas);
  }, []);
  const handleUpdateFeeStatus = useCallback(async (statuses: FeeStatus[]) => {
    setFeeStatus(statuses);
    await apiService.saveAllFeeStatus(statuses);
  }, []);
  const handleUpdateAfterSchoolPrograms = useCallback(async (programs: AfterSchoolProgram[]) => {
    setAfterSchoolPrograms(programs);
    await apiService.saveAllAfterSchoolPrograms(programs);
  }, []);
  const handleUpdateFacilityBookings = useCallback(async (bookings: FacilityBooking[]) => {
    setFacilityBookings(bookings);
    await apiService.saveAllFacilityBookings(bookings);
  }, []);
  const handleUpdateBoardPlannerEvents = useCallback(async (events: BoardPlannerEvent[]) => {
    setBoardPlannerEvents(events);
    await apiService.saveAllBoardPlannerEvents(events);
  }, []);
  const handleUpdateCrossCurricularProjects = useCallback(async (projects: CrossCurricularProject[]) => {
    setCrossCurricularProjects(projects);
    await apiService.saveAllCrossCurricularProjects(projects);
  }, []);
  const handleUpdatePortfolios = useCallback(async (portfolios: AllPortfolios) => {
    setAllPortfolios(portfolios);
    await apiService.saveAllPortfolios(portfolios);
  }, []);
  const handleUpdateSchoolName = useCallback(async (name: string) => {
    setSchoolName(name);
    await apiService.saveSchoolName(name);
  }, []);
  const handleUpdateBlueprints = useCallback(async (blueprints: PaperBlueprint[]) => {
    setAllBlueprints(blueprints);
    await apiService.saveAllBlueprints(blueprints);
  }, []);
  const handleSaveExamSessions = useCallback(async (sessions: ExamSession[]) => {
    setAllExamSessions(sessions);
    await apiService.saveAllExamSessions(sessions);
  }, []);
  const handleSaveExamSubmission = useCallback(async (submission: Omit<ExamSubmission, 'id'>) => {
      const newSubmission = { ...submission, id: `sub-${Date.now()}` };
      const updatedSubmissions = [...allExamSubmissions, newSubmission];
      setAllExamSubmissions(updatedSubmissions);
      await apiService.saveAllExamSubmissions(updatedSubmissions);
  }, [allExamSubmissions]);

  // LMS Handlers
  const handleUpdateCourses = useCallback(async (courses: Course[]) => {
    setAllCourses(courses);
    await apiService.saveAllCourses(courses);
  }, []);
  const handleUpdateGrades = useCallback(async (grades: Grade[]) => {
    setAllGrades(grades);
    await apiService.saveAllGrades(grades);
  }, []);

  const setView = useCallback((nextView: View) => {
    setViewState(nextView);
  }, []);

  const setActiveTopic = useCallback((topic: { chapter: SyllabusChapterTopic; topic: string } | null) => {
    setActiveTopicState(topic);
  }, []);

  const stateValue = useMemo<AuthState>(() => ({
    isLoading,
    error,
    userProfiles,
    activeUserId,
    activeProfile,
    userRole,
    allProgressData,
    allFlashcards,
    allDktData,
    allAssignments,
    allAnnouncements,
    allSubmissions,
    allFlnProgress,
    teacherSchedules,
    teacherAssignments,
    attendanceRecords,
    quickFormativeAssessments,
    allNotifications,
    itemBank,
    busRoutes,
    printQuotas,
    feeStatus,
    afterSchoolPrograms,
    facilityBookings,
    boardPlannerEvents,
    crossCurricularProjects,
    codingModules,
    communicationTemplates,
    allPortfolios,
    schoolName,
    allBlueprints,
    allExamSessions,
    allExamSubmissions,
    allCourses,
    allGrades,
    view,
    activeTopic,
  }), [
    isLoading,
    error,
    userProfiles,
    activeUserId,
    activeProfile,
    userRole,
    allProgressData,
    allFlashcards,
    allDktData,
    allAssignments,
    allAnnouncements,
    allSubmissions,
    allFlnProgress,
    teacherSchedules,
    teacherAssignments,
    attendanceRecords,
    quickFormativeAssessments,
    allNotifications,
    itemBank,
    busRoutes,
    printQuotas,
    feeStatus,
    afterSchoolPrograms,
    facilityBookings,
    boardPlannerEvents,
    crossCurricularProjects,
    codingModules,
    communicationTemplates,
    allPortfolios,
    schoolName,
    allBlueprints,
    allExamSessions,
    allExamSubmissions,
    allCourses,
    allGrades,
    view,
    activeTopic,
  ]);

  const actionsValue = useMemo<AuthActions>(() => ({
    handleSetRole,
    handleSaveUser,
    handleSwitchUser,
    updateActiveUserProfile,
    handleUpdateStudyPlan,
    handleUpdateSingleTask,
    handleUpdateWidgets,
    handleUpdateScholarCoins,
    handleSaveAllDktData,
    handleCreateAssignment,
    handleAddTaskToStudentPlans,
    handleCreateAnnouncement,
    handleSaveSubmission,
    handleUpdateSubmission,
    handleSaveAllFlnProgress,
    handleSaveAttendance,
    handleSaveQfas,
    handleUpdateTeacherSchedule,
    handleUpdateItemBank,
    handleUpdateBusRoutes,
    handleUpdatePrintQuotas,
    handleUpdateFeeStatus,
    handleUpdateAfterSchoolPrograms,
    handleUpdateFacilityBookings,
    handleUpdateBoardPlannerEvents,
    handleUpdateCrossCurricularProjects,
    handleUpdatePortfolios,
    handleUpdateSchoolName,
    handleUpdateBlueprints,
    handleSetTutorLock,
    handleSaveExamSessions,
    handleSaveExamSubmission,
    handleUpdateCourses,
    handleUpdateGrades,
    setView,
    setActiveTopic,
    _dangerouslySetAllProfiles: setUserProfiles,
  }), [
    handleSetRole,
    handleSaveUser,
    handleSwitchUser,
    updateActiveUserProfile,
    handleUpdateStudyPlan,
    handleUpdateSingleTask,
    handleUpdateWidgets,
    handleUpdateScholarCoins,
    handleSaveAllDktData,
    handleCreateAssignment,
    handleAddTaskToStudentPlans,
    handleCreateAnnouncement,
    handleSaveSubmission,
    handleUpdateSubmission,
    handleSaveAllFlnProgress,
    handleSaveAttendance,
    handleSaveQfas,
    handleUpdateTeacherSchedule,
    handleUpdateItemBank,
    handleUpdateBusRoutes,
    handleUpdatePrintQuotas,
    handleUpdateFeeStatus,
    handleUpdateAfterSchoolPrograms,
    handleUpdateFacilityBookings,
    handleUpdateBoardPlannerEvents,
    handleUpdateCrossCurricularProjects,
    handleUpdatePortfolios,
    handleUpdateSchoolName,
    handleUpdateBlueprints,
    handleSetTutorLock,
    handleSaveExamSessions,
    handleSaveExamSubmission,
    handleUpdateCourses,
    handleUpdateGrades,
    setView,
    setActiveTopic,
    setUserProfiles,
  ]);

  return (
    <AuthStateContext.Provider value={stateValue}>
      <AuthActionsContext.Provider value={actionsValue}>
        {children}
      </AuthActionsContext.Provider>
    </AuthStateContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const state = useContext(AuthStateContext);
  const actions = useContext(AuthActionsContext);
  if (state === undefined || actions === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
};
