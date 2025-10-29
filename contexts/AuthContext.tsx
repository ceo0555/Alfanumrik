import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserProfile, UserRole, AllProgressData, AllFlashcardsData, AllBktData, Assignment, Announcement, StudentSubmission, StudentFlnProgress, TeacherSchedule, AttendanceRecord, QuickFormativeAssessment, Notification, QuestionPoolItem, BusRoute, PrintQuota, FeeStatus, AfterSchoolProgram, FacilityBooking, BoardPlannerEvent, CrossCurricularProject, CodingModule, CommunicationTemplate, TeacherAssignment, StudentPortfolioProject, AllPortfolios, WidgetConfig, PaperBlueprint } from '../types';
import * as apiService from '../services/apiService';

interface AuthContextType {
  // State
  isLoading: boolean;
  error: string | null;
  userProfiles: UserProfile[];
  activeUserId: number | null;
  activeProfile: UserProfile | null;
  userRole: UserRole | null;
  allProgressData: AllProgressData;
  allFlashcards: AllFlashcardsData;
  allBktData: AllBktData;
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

  // Handlers
  handleSetRole: (role: UserRole | null) => void;
  handleSaveUser: (userData: { name: string; grade: string } | { name: string; grade: string }[], id?: number) => void;
  handleSwitchUser: (id: number) => void;
  updateActiveUserProfile: (updates: Partial<UserProfile>) => void;
  handleUpdateWidgets: (widgets: WidgetConfig[]) => void;
  handleUpdateScholarCoins: (newBalance: number) => void;
  handleSaveAllBktData: (bktData: AllBktData) => void; // For StudentDataContext to persist BKT updates
  handleCreateAssignment: (assignmentData: Omit<Assignment, 'id'>) => void;
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
  _dangerouslySetAllProfiles: (profiles: UserProfile[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [activeUserId, setActiveUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [allProgressData, setAllProgressData] = useState<AllProgressData>({});
  const [allFlashcards, setAllFlashcards] = useState<AllFlashcardsData>({});
  const [allBktData, setAllBktData] = useState<AllBktData>({});
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


  // Initial data load from the "backend"
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await apiService.fetchAllData();
        setUserProfiles(data.profiles);
        setActiveUserId(data.activeId);
        setAllProgressData(data.progress);
        setAllFlashcards(data.flashcards);
        setAllBktData(data.allBktData);
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
      } catch (e) {
        console.error("Failed to load user data:", e);
        setError("Could not load your data. Please try refreshing the page.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const activeProfile = userProfiles.find(p => p.id === activeUserId) || null;

  const handleSetRole = async (role: UserRole | null) => {
    try {
        await apiService.saveUserRole(role);
        setUserRole(role);
        // Reset active user when role changes to force selection
        handleSwitchUser(0);
    } catch (e) {
        console.error("Failed to set user role:", e);
    }
  };
  
  const handleSaveUser = async (userData: { name: string; grade: string } | { name: string; grade: string }[], idToEdit?: number) => {
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
  };

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
  
  const handleCreateAnnouncement = async (announcementData: Omit<Announcement, 'id' | 'date'>) => {
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
  };
  
  const handleSaveSubmission = async (submissionData: Omit<StudentSubmission, 'id'>) => {
    const newSubmission: StudentSubmission = { ...submissionData, id: Date.now().toString() };
    const updatedSubmissions = [...allSubmissions, newSubmission];
    setAllSubmissions(updatedSubmissions); // Optimistic update
    try {
        await apiService.saveAllSubmissions(updatedSubmissions);
    } catch(e) {
        console.error("Failed to save submission", e);
        setAllSubmissions(allSubmissions); // Revert
    }
  };

  const handleUpdateSubmission = async (updatedSubmission: StudentSubmission) => {
    const updatedSubmissions = allSubmissions.map(s => s.id === updatedSubmission.id ? updatedSubmission : s);
    setAllSubmissions(updatedSubmissions); // Optimistic update
    try {
        await apiService.saveAllSubmissions(updatedSubmissions);
    } catch (e) {
        console.error("Failed to update submission", e);
        setAllSubmissions(allSubmissions); // Revert
    }
  };

  const handleSaveAllFlnProgress = async (progress: StudentFlnProgress) => {
    setAllFlnProgress(progress); // Optimistic
    try {
        await apiService.saveAllFlnProgress(progress);
    } catch (e) {
        console.error("Failed to save FLN progress", e);
    }
  };

  const handleSwitchUser = async (id: number) => {
    try {
      const newActiveId = await apiService.saveActiveUserId(id);
      setActiveUserId(newActiveId);
    } catch (e) {
      console.error("Failed to switch user:", e);
    }
  };

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

  const handleSaveAllBktData = useCallback(async (bktData: AllBktData) => {
    setAllBktData(bktData); // Optimistic update
    try {
      await apiService.saveAllBktData(bktData);
    } catch (e) {
      console.error("Failed to save BKT data:", e);
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
  
  const handleSaveQfas = async (qfas: QuickFormativeAssessment[]) => {
      setQuickFormativeAssessments(qfas); // Optimistic
      try {
          await apiService.saveQuickFormativeAssessments(qfas);
      } catch (e) {
          console.error("Failed to save QFAs:", e);
      }
  };

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


  const value = {
    isLoading,
    error,
    userProfiles,
    activeUserId,
    activeProfile,
    userRole,
    allProgressData,
    allFlashcards,
    allBktData,
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
    handleSetRole,
    handleSaveUser,
    handleSwitchUser,
    updateActiveUserProfile,
    handleUpdateWidgets,
    handleUpdateScholarCoins,
    handleSaveAllBktData,
    handleCreateAssignment,
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
    _dangerouslySetAllProfiles: setUserProfiles, // For StudentDataContext to update profile with XP
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};