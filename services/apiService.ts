import { UserProfile, AllProgressData, AllFlashcardsData, UserRole, DailyChallenge, UserFlashcards, UserFlashcardItem, SrsData, AllDktData, Assignment, Announcement, StudentSubmission, StudentFlnProgress, TeacherSchedule, AttendanceRecord, QuickFormativeAssessment, Notification, QuestionPoolItem, BusRoute, PrintQuota, FeeStatus, AfterSchoolProgram, FacilityBooking, BoardPlannerEvent, CrossCurricularProject, CodingModule, CommunicationTemplate, TeacherAssignment, StudentPortfolioProject, AllPortfolios, PaperBlueprint, ExamSession, ExamSubmission, Course, Grade } from '../types';
import { curriculum } from '../constants/curriculum';
import { mockTeacherAssignments as initialTeacherAssignments, mockTeacherSchedule as initialTeacherSchedule } from '../constants/schoolData';
import { mockItemBank as initialItemBank } from '../constants/itemBank';
import { mockBusRoutes as initialBusRoutes, mockPrintQuotas as initialPrintQuotas, mockFeeStatus as initialFeeStatus } from '../constants/financeOpsData';
import { mockAfterSchoolPrograms as initialAfterSchoolPrograms, mockFacilityBookings as initialFacilityBookings } from '../constants/growthData';
import { mockCalendarEvents as initialBoardPlannerEvents, communicationTemplates as initialCommunicationTemplates } from '../constants/boardPlannerData';
import { codingModules as initialCodingModules, crossCurricularProjects as initialCrossCurricularProjects, mockPortfolios } from '../constants/codingModules';
import { appEventBus } from '../utils/eventBus';
import remoteStorage from './remoteStorage';

const storage = remoteStorage;

const simulateNetwork = async <T>(data: T): Promise<T> => data;

const generateDailyChallenge = (grade: string): DailyChallenge => {
    const todayStr = new Date().toISOString().split('T')[0];
    const challengeType = Math.random() > 0.5 ? 'earn_xp' : 'complete_lesson';
    
    if (challengeType === 'earn_xp') {
        const targetXP = [100, 150, 200][Math.floor(Math.random() * 3)];
        return {
            id: todayStr,
            type: 'earn_xp',
            target: targetXP,
            progress: 0,
            isCompleted: false,
            description: `Earn ${targetXP} XP today`,
            reward: 50,
            coinReward: 20,
        };
    } else {
        const subjects = Object.keys(curriculum[grade as keyof typeof curriculum]);
        const targetSubject = subjects[Math.floor(Math.random() * subjects.length)];
        return {
            id: todayStr,
            type: 'complete_lesson',
            target: targetSubject,
            progress: 0,
            isCompleted: false,
            description: `Complete 1 ${targetSubject} lesson`,
            reward: 75,
            coinReward: 30,
        };
    }
};


/**
 * Fetches all user data from the persistent store.
 * In a real app, this would be a GET request to /api/users/data or similar.
 */
export const fetchAllData = async (): Promise<{
  profiles: UserProfile[];
  activeId: number | null;
  progress: AllProgressData;
  flashcards: AllFlashcardsData;
  userRole: UserRole | null;
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
}> => {
  console.log("API: Fetching all user data...");
  await storage.ensureHydrated();
  const profilesStr = storage.getItem('userProfiles') || '[]';
  const activeIdStr = storage.getItem('activeUserId');
  const progressStr = storage.getItem('allProgressData') || '{}';
  const flashcardsStr = storage.getItem('allFlashcards') || '{}';
  const userRoleStr = storage.getItem('userRole');
  const dktDataStr = storage.getItem('allDktData') || '{}';
  const assignmentsStr = storage.getItem('allAssignments') || '[]';
  const announcementsStr = storage.getItem('allAnnouncements') || '[]';
  const submissionsStr = storage.getItem('allSubmissions') || '[]';
  const flnProgressStr = storage.getItem('allFlnProgress') || '{}';
  const teacherSchedulesStr = storage.getItem('teacherSchedules');
  const teacherAssignmentsStr = storage.getItem('teacherAssignments');
  const attendanceStr = storage.getItem('attendanceRecords') || '{}';
  const qfasStr = storage.getItem('quickFormativeAssessments') || '[]';
  const notificationsStr = storage.getItem('allNotifications') || '[]';
  const itemBankStr = storage.getItem('itemBank');
  const busRoutesStr = storage.getItem('busRoutes');
  const printQuotasStr = storage.getItem('printQuotas');
  const feeStatusStr = storage.getItem('feeStatus');
  const afterSchoolProgramsStr = storage.getItem('afterSchoolPrograms');
  const facilityBookingsStr = storage.getItem('facilityBookings');
  const boardPlannerEventsStr = storage.getItem('boardPlannerEvents');
  const crossCurricularProjectsStr = storage.getItem('crossCurricularProjects');
  const codingModulesStr = storage.getItem('codingModules');
  const communicationTemplatesStr = storage.getItem('communicationTemplates');
  const portfoliosStr = storage.getItem('allPortfolios');
  const schoolNameStr = storage.getItem('schoolName');
  const allBlueprintsStr = storage.getItem('allBlueprints') || '[]';
  const allExamSessionsStr = storage.getItem('allExamSessions') || '[]';
  const allExamSubmissionsStr = storage.getItem('allExamSubmissions') || '[]';
  const allCoursesStr = storage.getItem('allCourses') || '[]';
  const allGradesStr = storage.getItem('allGrades') || '[]';


  let profiles: UserProfile[] = JSON.parse(profilesStr);
  const progress: AllProgressData = JSON.parse(progressStr);
  let flashcards: AllFlashcardsData = JSON.parse(flashcardsStr);
  let activeId: number | null = activeIdStr ? JSON.parse(activeIdStr) : null;
  const userRole: UserRole | null = userRoleStr ? JSON.parse(userRoleStr) : null;
  const allDktData: AllDktData = JSON.parse(dktDataStr);
  const allAssignments: Assignment[] = JSON.parse(assignmentsStr);
  const allAnnouncements: Announcement[] = JSON.parse(announcementsStr);
  const allSubmissions: StudentSubmission[] = JSON.parse(submissionsStr);
  const allFlnProgress: StudentFlnProgress = JSON.parse(flnProgressStr);
  const attendanceRecords: AttendanceRecord = JSON.parse(attendanceStr);
  const quickFormativeAssessments: QuickFormativeAssessment[] = JSON.parse(qfasStr);
  const allNotifications: Notification[] = JSON.parse(notificationsStr);

  const teacherSchedules: TeacherSchedule[] = teacherSchedulesStr ? JSON.parse(teacherSchedulesStr) : initialTeacherSchedule;
  const teacherAssignments: TeacherAssignment[] = teacherAssignmentsStr ? JSON.parse(teacherAssignmentsStr) : initialTeacherAssignments;
  const itemBank: QuestionPoolItem[] = itemBankStr ? JSON.parse(itemBankStr) : initialItemBank.map(item => ({ ...item, status: 'approved' }));
  const busRoutes: BusRoute[] = busRoutesStr ? JSON.parse(busRoutesStr) : initialBusRoutes;
  const printQuotas: PrintQuota[] = printQuotasStr ? JSON.parse(printQuotasStr) : initialPrintQuotas;
  const feeStatus: FeeStatus[] = feeStatusStr ? JSON.parse(feeStatusStr) : initialFeeStatus;
  const afterSchoolPrograms: AfterSchoolProgram[] = afterSchoolProgramsStr ? JSON.parse(afterSchoolProgramsStr) : initialAfterSchoolPrograms;
  const facilityBookings: FacilityBooking[] = facilityBookingsStr ? JSON.parse(facilityBookingsStr) : initialFacilityBookings;
  const boardPlannerEvents: BoardPlannerEvent[] = boardPlannerEventsStr ? JSON.parse(boardPlannerEventsStr) : initialBoardPlannerEvents;
  const crossCurricularProjects: CrossCurricularProject[] = crossCurricularProjectsStr ? JSON.parse(crossCurricularProjectsStr) : initialCrossCurricularProjects;
  const codingModules: CodingModule[] = codingModulesStr ? JSON.parse(codingModulesStr) : initialCodingModules;
  const communicationTemplates: CommunicationTemplate[] = communicationTemplatesStr ? JSON.parse(communicationTemplatesStr) : initialCommunicationTemplates;
  const allPortfolios: AllPortfolios = portfoliosStr ? JSON.parse(portfoliosStr) : mockPortfolios;
  const schoolName: string = schoolNameStr ? JSON.parse(schoolNameStr) : "Alfanumrik Model School";
  const allBlueprints: PaperBlueprint[] = JSON.parse(allBlueprintsStr);
  const allExamSessions: ExamSession[] = JSON.parse(allExamSessionsStr);
  const allExamSubmissions: ExamSubmission[] = JSON.parse(allExamSubmissionsStr);
  const allCourses: Course[] = JSON.parse(allCoursesStr);
  const allGrades: Grade[] = JSON.parse(allGradesStr);

  // If no profiles exist, create default demo users for RBAC
  if (profiles.length === 0) {
      console.log("No profiles found. Creating default RBAC demo users.");
      const demoStudent: UserProfile = {
        id: 101, name: 'Rohan Sharma', grade: '10', lastSubject: 'Science', lastChapter: 'Chemical Reactions and Equations',
        currentStreak: 3, lastStreakDate: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
        achievements: ['first_lesson', 'streak_3'], xp: 350, level: 2, scholarCoins: 1250, tutorSessionUnlocked: false,
      };
      const demoParent: UserProfile = {
        id: 201, name: 'Mr. Sharma', grade: '', lastSubject: '', lastChapter: '', childIds: [101],
        currentStreak: 0, lastStreakDate: '', achievements: [], xp: 0, level: 1, scholarCoins: 0, tutorSessionUnlocked: false,
      };
      const demoTeacher: UserProfile = {
        id: 301, name: 'Ms. Davis', grade: '', lastSubject: '', lastChapter: '', schoolRole: 'teacher',
        currentStreak: 0, lastStreakDate: '', achievements: [], xp: 0, level: 1, scholarCoins: 0, tutorSessionUnlocked: false,
      };
       const demoPrincipal: UserProfile = {
        id: 401, name: 'Mr. Singh', grade: '', lastSubject: '', lastChapter: '', schoolRole: 'principal',
        currentStreak: 0, lastStreakDate: '', achievements: [], xp: 0, level: 1, scholarCoins: 0, tutorSessionUnlocked: false,
      };
      profiles = [demoStudent, demoParent, demoTeacher, demoPrincipal];
      storage.setItem('userProfiles', JSON.stringify(profiles));
      storage.setItem('teacherAssignments', JSON.stringify(initialTeacherAssignments));
  }


  const todayStr = new Date().toISOString().split('T')[0];

  // Data integrity/migration check
  profiles = profiles.map(p => {
    // Check and update daily challenge if it's a student profile
    if (!p.schoolRole && !p.childIds && (!p.dailyChallenge || p.dailyChallenge.id !== todayStr)) {
        p.dailyChallenge = generateDailyChallenge(p.grade);
    }
    // Add default widgets if they don't exist
    if (!p.schoolRole && !p.childIds && !p.widgets) {
        p.widgets = [{ id: `default-focus-${p.id}`, type: 'today_focus' }];
    }
    return {
        ...p,
        xp: p.xp || 0,
        level: p.level || 1,
        scholarCoins: p.scholarCoins || 0,
        achievements: p.achievements || [],
        tutorSessionUnlocked: p.tutorSessionUnlocked || false,
        unlockedPetAccessories: p.unlockedPetAccessories || [],
    };
  });
  
  // FSRS Flashcard Data Migration from Anki-SM2
  let hasMigrated = false;
  const migratedSample: { from: any, to: SrsData }[] = [];

  for (const userId in flashcards) {
    const userFlashcards: UserFlashcards = flashcards[userId];
    for (const chapterId in userFlashcards) {
      const deck = userFlashcards[chapterId];
      if (deck.length > 0 && 'state' in (deck[0].srsData as any)) {
        hasMigrated = true;
        
        userFlashcards[chapterId] = deck.map((item, index) => {
          const oldSrs = item.srsData as any;
          // Reasonable conversion from Anki-SM2 to FSRS defaults
          const newSrs: SrsData = {
            s: oldSrs.interval || 1, // Stability
            d: 10 - (oldSrs.easeFactor - 1.3) / (2.5 - 1.3) * 9, // Difficulty (map ease 2.5->D=5, 1.3->D=10)
            due: oldSrs.nextReviewDate || todayStr,
            reps: oldSrs.state === 'new' ? 0 : 1,
            lapses: oldSrs.lapses || 0,
            last_review: oldSrs.state === 'new' ? null : new Date(new Date().setDate(new Date().getDate() - oldSrs.interval)).toISOString(),
          };
          newSrs.d = Math.max(1, Math.min(10, newSrs.d)); // Constrain D
          
          if (migratedSample.length < 5) {
            migratedSample.push({ from: oldSrs, to: newSrs });
          }

          return { ...item, srsData: newSrs };
        });
      }
    }
    if(hasMigrated) {
        flashcards[userId] = userFlashcards;
    }
  }
  
  if (hasMigrated) {
    console.log("Migration to FSRS format complete.");
    console.log("Migration validation sample (up to 5 cards):", migratedSample);
    storage.setItem('allFlashcards', JSON.stringify(flashcards));
  }


  if (activeId && !profiles.some(p => p.id === activeId)) {
    activeId = profiles.length > 0 ? profiles[0].id : null;
    storage.setItem('activeUserId', JSON.stringify(activeId));
  }

  await storage.flushImmediate();

  return simulateNetwork({ profiles, activeId, progress, flashcards, userRole, allDktData, allAssignments, allAnnouncements, allSubmissions, allFlnProgress, teacherSchedules, teacherAssignments, attendanceRecords, quickFormativeAssessments, allNotifications, itemBank, busRoutes, printQuotas, feeStatus, afterSchoolPrograms, facilityBookings, boardPlannerEvents, crossCurricularProjects, codingModules, communicationTemplates, allPortfolios, schoolName, allBlueprints, allExamSessions, allExamSubmissions, allCourses, allGrades });
};

/**
 * Saves or updates user profiles. Handles single add, single edit, and bulk add.
 */
export const saveUserProfile = async (
  allProfiles: UserProfile[],
  data: { name: string; grade: string } | { name: string; grade: string }[],
  idToEdit?: number
): Promise<UserProfile[]> => {
  let updatedProfiles = [...allProfiles];

  if (Array.isArray(data)) { // Bulk add
    console.log(`API: Bulk onboarding ${data.length} users...`);
    let latestId = Date.now();
    const newUsers: UserProfile[] = data.map((user, index) => {
      const newId = latestId + index;
      const newSubjects = Object.keys(curriculum[user.grade as keyof typeof curriculum]);
      const newSubject = newSubjects[0];
      const newChapter = curriculum[user.grade as keyof typeof curriculum][newSubject][0];
      return {
        id: newId,
        name: user.name,
        grade: user.grade,
        lastSubject: newSubject,
        lastChapter: newChapter,
        currentStreak: 0,
        lastStreakDate: '',
        achievements: [],
        xp: 0,
        level: 1,
        scholarCoins: 0,
        dailyChallenge: generateDailyChallenge(user.grade),
        widgets: [{ id: `widget-${newId}`, type: 'today_focus' }],
        tutorSessionUnlocked: false,
        unlockedPetAccessories: [],
      };
    });
    updatedProfiles.push(...newUsers);
  } else if (idToEdit !== undefined) { // Edit single
    console.log(`API: Editing profile for ${data.name}...`);
    updatedProfiles = updatedProfiles.map(p => {
      if (p.id === idToEdit) {
        const { name, grade } = data;
        const newSubjects = Object.keys(curriculum[grade as keyof typeof curriculum]);
        const newSubject = p.grade === grade ? p.lastSubject : newSubjects[0];
        const newChapter = p.grade === grade ? p.lastChapter : curriculum[grade as keyof typeof curriculum][newSubject][0];
        return { ...p, name, grade, lastSubject: newSubject, lastChapter: newChapter };
      }
      return p;
    });
  } else { // Add single
    console.log(`API: Saving profile for ${data.name}...`);
    const { name, grade } = data;
    const newId = Date.now();
    const newSubjects = Object.keys(curriculum[grade as keyof typeof curriculum]);
    const newSubject = newSubjects[0];
    const newChapter = curriculum[grade as keyof typeof curriculum][newSubject][0];
    const newUser: UserProfile = {
      id: newId,
      name,
      grade,
      lastSubject: newSubject,
      lastChapter: newChapter,
      currentStreak: 0,
      lastStreakDate: '',
      achievements: [],
      xp: 0,
      level: 1,
      scholarCoins: 0,
      dailyChallenge: generateDailyChallenge(grade),
      widgets: [{ id: `widget-${newId}`, type: 'today_focus' }],
      tutorSessionUnlocked: false,
      unlockedPetAccessories: [],
    };
    updatedProfiles.push(newUser);
  }

  storage.setItem('userProfiles', JSON.stringify(updatedProfiles));
  appEventBus.emit('data-changed', { store: 'userProfiles' });
  return simulateNetwork(updatedProfiles);
};


/**
 * Updates the active user ID.
 */
export const saveActiveUserId = async (id: number): Promise<number> => {
  console.log(`API: Setting active user to ${id}...`);
  storage.setItem('activeUserId', JSON.stringify(id));
  appEventBus.emit('data-changed', { store: 'activeUserId' });
  return simulateNetwork(id);
};

/**
 * Saves the entire progress data object.
 * In a real app, this would likely be more granular (e.g., PUT /api/users/:id/progress).
 */
export const saveAllProgress = async (progress: AllProgressData): Promise<AllProgressData> => {
  console.log("API: Saving all progress data...");
  storage.setItem('allProgressData', JSON.stringify(progress));
  appEventBus.emit('data-changed', { store: 'allProgressData' });
  return simulateNetwork(progress);
};

/**
 * Saves the entire DKT data object.
 */
export const saveAllDktData = async (dktData: AllDktData): Promise<AllDktData> => {
    console.log("API: Saving all DKT data...");
    storage.setItem('allDktData', JSON.stringify(dktData));
    appEventBus.emit('data-changed', { store: 'allDktData' });
    return simulateNetwork(dktData);
};


/**
 * Saves the entire flashcards data object.
 */
export const saveAllFlashcards = async (flashcards: AllFlashcardsData): Promise<AllFlashcardsData> => {
  console.log("API: Saving all flashcards data...");
  storage.setItem('allFlashcards', JSON.stringify(flashcards));
  appEventBus.emit('data-changed', { store: 'allFlashcards' });
  return simulateNetwork(flashcards);
};

/**
 * Saves all FLN progress data.
 */
export const saveAllFlnProgress = async (progress: StudentFlnProgress): Promise<StudentFlnProgress> => {
  console.log("API: Saving all FLN progress data...");
  storage.setItem('allFlnProgress', JSON.stringify(progress));
  appEventBus.emit('data-changed', { store: 'allFlnProgress' });
  return simulateNetwork(progress);
};

/**
 * Saves the entire assignments data object.
 */
export const saveAllAssignments = async (assignments: Assignment[]): Promise<Assignment[]> => {
  console.log("API: Saving all assignments data...");
  storage.setItem('allAssignments', JSON.stringify(assignments));
  appEventBus.emit('data-changed', { store: 'allAssignments' });
  return simulateNetwork(assignments);
};

/**
 * Saves all announcements.
 */
export const saveAllAnnouncements = async (announcements: Announcement[]): Promise<Announcement[]> => {
  console.log("API: Saving all announcements...");
  storage.setItem('allAnnouncements', JSON.stringify(announcements));
  appEventBus.emit('data-changed', { store: 'allAnnouncements' });
  return simulateNetwork(announcements);
};

/**
 * Saves all student submissions.
 */
export const saveAllSubmissions = async (submissions: StudentSubmission[]): Promise<StudentSubmission[]> => {
    console.log("API: Saving all student submissions...");
    storage.setItem('allSubmissions', JSON.stringify(submissions));
    appEventBus.emit('data-changed', { store: 'allSubmissions' });
    return simulateNetwork(submissions);
};

/**
 * Updates a single user's profile data (e.g., last chapter viewed).
 */
export const updateUserProfileData = async (
  userId: number,
  updates: Partial<UserProfile>
): Promise<UserProfile> => {
    console.log(`API: Updating profile for user ${userId}...`);
    const profilesStr = storage.getItem('userProfiles') || '[]';
    let profiles: UserProfile[] = JSON.parse(profilesStr);
    let updatedProfile: UserProfile | null = null;
    const updatedProfiles = profiles.map(p => {
      if (p.id === userId) {
        updatedProfile = { ...p, ...updates };
        return updatedProfile;
      }
      return p;
    });

    if (!updatedProfile) throw new Error("User not found for update");
    
    storage.setItem('userProfiles', JSON.stringify(updatedProfiles));
    appEventBus.emit('data-changed', { store: 'userProfiles' });
    return simulateNetwork(updatedProfile);
};

/**
 * Saves the current user role.
 */
export const saveUserRole = async (role: UserRole | null): Promise<UserRole | null> => {
    console.log(`API: Setting user role to ${role}...`);
    if (role) {
        storage.setItem('userRole', JSON.stringify(role));
    } else {
        storage.removeItem('userRole');
    }
    appEventBus.emit('data-changed', { store: 'userRole' });
    return simulateNetwork(role);
};

// --- CLASSROOM CORE ---

export const saveAttendanceRecords = async (records: AttendanceRecord): Promise<AttendanceRecord> => {
    console.log("API: Saving attendance records...");
    storage.setItem('attendanceRecords', JSON.stringify(records));
    appEventBus.emit('data-changed', { store: 'attendanceRecords' });
    return simulateNetwork(records);
};

export const saveQuickFormativeAssessments = async (assessments: QuickFormativeAssessment[]): Promise<QuickFormativeAssessment[]> => {
    console.log("API: Saving quick formative assessments...");
    storage.setItem('quickFormativeAssessments', JSON.stringify(assessments));
    appEventBus.emit('data-changed', { store: 'quickFormativeAssessments' });
    return simulateNetwork(assessments);
};

export const saveTeacherSchedules = async (schedules: TeacherSchedule[]): Promise<TeacherSchedule[]> => {
    console.log("API: Saving teacher schedules...");
    storage.setItem('teacherSchedules', JSON.stringify(schedules));
    appEventBus.emit('data-changed', { store: 'teacherSchedules' });
    return simulateNetwork(schedules);
};

// --- EXAM SUITE ---
export const saveItemBank = async (itemBank: QuestionPoolItem[]): Promise<QuestionPoolItem[]> => {
    console.log("API: Saving item bank...");
    storage.setItem('itemBank', JSON.stringify(itemBank));
    appEventBus.emit('data-changed', { store: 'itemBank' });
    return simulateNetwork(itemBank);
};

export const saveAllExamSessions = async (sessions: ExamSession[]): Promise<ExamSession[]> => {
    console.log("API: Saving all exam sessions...");
    storage.setItem('allExamSessions', JSON.stringify(sessions));
    appEventBus.emit('data-changed', { store: 'allExamSessions' });
    return simulateNetwork(sessions);
};

export const saveAllExamSubmissions = async (submissions: ExamSubmission[]): Promise<ExamSubmission[]> => {
    console.log("API: Saving all exam submissions...");
    storage.setItem('allExamSubmissions', JSON.stringify(submissions));
    appEventBus.emit('data-changed', { store: 'allExamSubmissions' });
    return simulateNetwork(submissions);
};

// --- NOTIFICATIONS ---
export const saveAllNotifications = async (notifications: Notification[]): Promise<Notification[]> => {
    console.log("API: Saving all notifications...");
    storage.setItem('allNotifications', JSON.stringify(notifications));
    appEventBus.emit('data-changed', { store: 'allNotifications' });
    return simulateNetwork(notifications);
};

// --- FINANCE & OPS ---
export const saveAllBusRoutes = async (routes: BusRoute[]): Promise<BusRoute[]> => {
    console.log("API: Saving bus routes...");
    storage.setItem('busRoutes', JSON.stringify(routes));
    appEventBus.emit('data-changed', { store: 'busRoutes' });
    return simulateNetwork(routes);
};
export const saveAllPrintQuotas = async (quotas: PrintQuota[]): Promise<PrintQuota[]> => {
    console.log("API: Saving print quotas...");
    storage.setItem('printQuotas', JSON.stringify(quotas));
    appEventBus.emit('data-changed', { store: 'printQuotas' });
    return simulateNetwork(quotas);
};
export const saveAllFeeStatus = async (statuses: FeeStatus[]): Promise<FeeStatus[]> => {
    console.log("API: Saving fee statuses...");
    storage.setItem('feeStatus', JSON.stringify(statuses));
    appEventBus.emit('data-changed', { store: 'feeStatus' });
    return simulateNetwork(statuses);
};

// --- GROWTH ---
export const saveAllAfterSchoolPrograms = async (programs: AfterSchoolProgram[]): Promise<AfterSchoolProgram[]> => {
    console.log("API: Saving after school programs...");
    storage.setItem('afterSchoolPrograms', JSON.stringify(programs));
    appEventBus.emit('data-changed', { store: 'afterSchoolPrograms' });
    return simulateNetwork(programs);
};
export const saveAllFacilityBookings = async (bookings: FacilityBooking[]): Promise<FacilityBooking[]> => {
    console.log("API: Saving facility bookings...");
    storage.setItem('facilityBookings', JSON.stringify(bookings));
    appEventBus.emit('data-changed', { store: 'facilityBookings' });
    return simulateNetwork(bookings);
};

// --- BOARD PLANNER ---
export const saveAllBoardPlannerEvents = async (events: BoardPlannerEvent[]): Promise<BoardPlannerEvent[]> => {
    console.log("API: Saving board planner events...");
    storage.setItem('boardPlannerEvents', JSON.stringify(events));
    appEventBus.emit('data-changed', { store: 'boardPlannerEvents' });
    return simulateNetwork(events);
};

// --- AI & CODING ---
export const saveAllCrossCurricularProjects = async (projects: CrossCurricularProject[]): Promise<CrossCurricularProject[]> => {
    console.log("API: Saving cross-curricular projects...");
    storage.setItem('crossCurricularProjects', JSON.stringify(projects));
    appEventBus.emit('data-changed', { store: 'crossCurricularProjects' });
    return simulateNetwork(projects);
};

export const saveAllPortfolios = async (portfolios: AllPortfolios): Promise<AllPortfolios> => {
    console.log("API: Saving all portfolios...");
    storage.setItem('allPortfolios', JSON.stringify(portfolios));
    appEventBus.emit('data-changed', { store: 'allPortfolios' });
    return simulateNetwork(portfolios);
};

// --- NEW PERSISTENCE FOR SCHOOL OS ---
export const saveSchoolName = async (name: string): Promise<string> => {
    console.log("API: Saving school name...");
    storage.setItem('schoolName', JSON.stringify(name));
    appEventBus.emit('data-changed', { store: 'schoolName' });
    return simulateNetwork(name);
}

export const saveAllBlueprints = async (blueprints: PaperBlueprint[]): Promise<PaperBlueprint[]> => {
    console.log("API: Saving all paper blueprints...");
    storage.setItem('allBlueprints', JSON.stringify(blueprints));
    appEventBus.emit('data-changed', { store: 'allBlueprints' });
    return simulateNetwork(blueprints);
}

// --- NEW LMS PERSISTENCE ---
export const saveAllCourses = async (courses: Course[]): Promise<Course[]> => {
    console.log("API: Saving all courses...");
    storage.setItem('allCourses', JSON.stringify(courses));
    appEventBus.emit('data-changed', { store: 'allCourses' });
    return simulateNetwork(courses);
};

export const saveAllGrades = async (grades: Grade[]): Promise<Grade[]> => {
    console.log("API: Saving all grades...");
    storage.setItem('allGrades', JSON.stringify(grades));
    appEventBus.emit('data-changed', { store: 'allGrades' });
    return simulateNetwork(grades);
};
