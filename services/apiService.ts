import { UserProfile, AllProgressData, AllFlashcardsData, UserRole, DailyChallenge, UserFlashcards, UserFlashcardItem, SrsData, AllBktData, Assignment, Announcement, StudentSubmission, StudentFlnProgress, TeacherSchedule, AttendanceRecord, QuickFormativeAssessment, Notification, QuestionPoolItem, BusRoute, PrintQuota, FeeStatus, AfterSchoolProgram, FacilityBooking, BoardPlannerEvent, CrossCurricularProject, CodingModule, CommunicationTemplate, TeacherAssignment, StudentPortfolioProject, AllPortfolios } from '../types';
import { curriculum } from '../constants/curriculum';
import { mockTeacherAssignments as initialTeacherAssignments, mockTeacherSchedule as initialTeacherSchedule } from '../constants/schoolData';
import { mockItemBank as initialItemBank } from '../constants/itemBank';
import { mockBusRoutes as initialBusRoutes, mockPrintQuotas as initialPrintQuotas, mockFeeStatus as initialFeeStatus } from '../constants/financeOpsData';
import { mockAfterSchoolPrograms as initialAfterSchoolPrograms, mockFacilityBookings as initialFacilityBookings } from '../constants/growthData';
import { mockCalendarEvents as initialBoardPlannerEvents, communicationTemplates as initialCommunicationTemplates } from '../constants/boardPlannerData';
import { codingModules as initialCodingModules, crossCurricularProjects as initialCrossCurricularProjects, mockPortfolios } from '../constants/codingModules';


const API_LATENCY = 300; // ms

// --- SIMULATED BACKEND API ---

// This service mimics a backend API. In a real application, these functions
// would make fetch() calls to a remote server. For now, they interact with
// localStorage asynchronously to simulate network latency and a persistent data store.

const simulateNetwork = <T>(data: T): Promise<T> => {
  return new Promise(resolve => {
    setTimeout(() => resolve(data), API_LATENCY);
  });
};

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
}> => {
  console.log("API: Fetching all user data...");
  const profilesStr = localStorage.getItem('userProfiles') || '[]';
  const activeIdStr = localStorage.getItem('activeUserId');
  const progressStr = localStorage.getItem('allProgressData') || '{}';
  const flashcardsStr = localStorage.getItem('allFlashcards') || '{}';
  const userRoleStr = localStorage.getItem('userRole');
  const bktDataStr = localStorage.getItem('allBktData') || '{}';
  const assignmentsStr = localStorage.getItem('allAssignments') || '[]';
  const announcementsStr = localStorage.getItem('allAnnouncements') || '[]';
  const submissionsStr = localStorage.getItem('allSubmissions') || '[]';
  const flnProgressStr = localStorage.getItem('allFlnProgress') || '{}';
  const teacherSchedulesStr = localStorage.getItem('teacherSchedules');
  const teacherAssignmentsStr = localStorage.getItem('teacherAssignments');
  const attendanceStr = localStorage.getItem('attendanceRecords') || '{}';
  const qfasStr = localStorage.getItem('quickFormativeAssessments') || '[]';
  const notificationsStr = localStorage.getItem('allNotifications') || '[]';
  const itemBankStr = localStorage.getItem('itemBank');
  const busRoutesStr = localStorage.getItem('busRoutes');
  const printQuotasStr = localStorage.getItem('printQuotas');
  const feeStatusStr = localStorage.getItem('feeStatus');
  const afterSchoolProgramsStr = localStorage.getItem('afterSchoolPrograms');
  const facilityBookingsStr = localStorage.getItem('facilityBookings');
  const boardPlannerEventsStr = localStorage.getItem('boardPlannerEvents');
  const crossCurricularProjectsStr = localStorage.getItem('crossCurricularProjects');
  const codingModulesStr = localStorage.getItem('codingModules');
  const communicationTemplatesStr = localStorage.getItem('communicationTemplates');
  const portfoliosStr = localStorage.getItem('allPortfolios');


  let profiles: UserProfile[] = JSON.parse(profilesStr);
  const progress: AllProgressData = JSON.parse(progressStr);
  let flashcards: AllFlashcardsData = JSON.parse(flashcardsStr);
  let activeId: number | null = activeIdStr ? JSON.parse(activeIdStr) : null;
  const userRole: UserRole | null = userRoleStr ? JSON.parse(userRoleStr) : null;
  const allBktData: AllBktData = JSON.parse(bktDataStr);
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

  // If no profiles exist, create default demo users for RBAC
  if (profiles.length === 0) {
      console.log("No profiles found. Creating default RBAC demo users.");
      const demoStudent: UserProfile = {
        id: 101, name: 'Rohan Sharma', grade: '10', lastSubject: 'Science', lastChapter: 'Chemical Reactions and Equations',
        currentStreak: 3, lastStreakDate: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
        achievements: ['first_lesson', 'streak_3'], xp: 350, level: 2,
      };
      const demoParent: UserProfile = {
        id: 201, name: 'Mr. Sharma', grade: '', lastSubject: '', lastChapter: '', childIds: [101],
        currentStreak: 0, lastStreakDate: '', achievements: [], xp: 0, level: 1,
      };
      const demoTeacher: UserProfile = {
        id: 301, name: 'Ms. Davis', grade: '', lastSubject: '', lastChapter: '', schoolRole: 'teacher',
        currentStreak: 0, lastStreakDate: '', achievements: [], xp: 0, level: 1,
      };
       const demoPrincipal: UserProfile = {
        id: 401, name: 'Mr. Singh', grade: '', lastSubject: '', lastChapter: '', schoolRole: 'principal',
        currentStreak: 0, lastStreakDate: '', achievements: [], xp: 0, level: 1,
      };
      profiles = [demoStudent, demoParent, demoTeacher, demoPrincipal];
      localStorage.setItem('userProfiles', JSON.stringify(profiles));
      localStorage.setItem('teacherAssignments', JSON.stringify(initialTeacherAssignments));
  }


  const todayStr = new Date().toISOString().split('T')[0];

  // Data integrity/migration check
  profiles = profiles.map(p => {
    // Check and update daily challenge if it's a student profile
    if (!p.schoolRole && !p.childIds && (!p.dailyChallenge || p.dailyChallenge.id !== todayStr)) {
        p.dailyChallenge = generateDailyChallenge(p.grade);
    }
    return {
        ...p,
        xp: p.xp || 0,
        level: p.level || 1,
        achievements: p.achievements || [],
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
    localStorage.setItem('allFlashcards', JSON.stringify(flashcards));
  }


  if (activeId && !profiles.some(p => p.id === activeId)) {
    activeId = profiles.length > 0 ? profiles[0].id : null;
    localStorage.setItem('activeUserId', JSON.stringify(activeId));
  }

  return simulateNetwork({ profiles, activeId, progress, flashcards, userRole, allBktData, allAssignments, allAnnouncements, allSubmissions, allFlnProgress, teacherSchedules, teacherAssignments, attendanceRecords, quickFormativeAssessments, allNotifications, itemBank, busRoutes, printQuotas, feeStatus, afterSchoolPrograms, facilityBookings, boardPlannerEvents, crossCurricularProjects, codingModules, communicationTemplates, allPortfolios });
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
        dailyChallenge: generateDailyChallenge(user.grade),
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
      dailyChallenge: generateDailyChallenge(grade),
    };
    updatedProfiles.push(newUser);
  }

  localStorage.setItem('userProfiles', JSON.stringify(updatedProfiles));
  return simulateNetwork(updatedProfiles);
};


/**
 * Updates the active user ID.
 */
export const saveActiveUserId = async (id: number): Promise<number> => {
  console.log(`API: Setting active user to ${id}...`);
  localStorage.setItem('activeUserId', JSON.stringify(id));
  return simulateNetwork(id);
};

/**
 * Saves the entire progress data object.
 * In a real app, this would likely be more granular (e.g., PUT /api/users/:id/progress).
 */
export const saveAllProgress = async (progress: AllProgressData): Promise<AllProgressData> => {
  console.log("API: Saving all progress data...");
  localStorage.setItem('allProgressData', JSON.stringify(progress));
  return simulateNetwork(progress);
};

/**
 * Saves the entire BKT data object.
 */
export const saveAllBktData = async (bktData: AllBktData): Promise<AllBktData> => {
    console.log("API: Saving all BKT data...");
    localStorage.setItem('allBktData', JSON.stringify(bktData));
    return simulateNetwork(bktData);
};


/**
 * Saves the entire flashcards data object.
 */
export const saveAllFlashcards = async (flashcards: AllFlashcardsData): Promise<AllFlashcardsData> => {
  console.log("API: Saving all flashcards data...");
  localStorage.setItem('allFlashcards', JSON.stringify(flashcards));
  return simulateNetwork(flashcards);
};

/**
 * Saves all FLN progress data.
 */
export const saveAllFlnProgress = async (progress: StudentFlnProgress): Promise<StudentFlnProgress> => {
  console.log("API: Saving all FLN progress data...");
  localStorage.setItem('allFlnProgress', JSON.stringify(progress));
  return simulateNetwork(progress);
};

/**
 * Saves the entire assignments data object.
 */
export const saveAllAssignments = async (assignments: Assignment[]): Promise<Assignment[]> => {
  console.log("API: Saving all assignments data...");
  localStorage.setItem('allAssignments', JSON.stringify(assignments));
  return simulateNetwork(assignments);
};

/**
 * Saves all announcements.
 */
export const saveAllAnnouncements = async (announcements: Announcement[]): Promise<Announcement[]> => {
  console.log("API: Saving all announcements...");
  localStorage.setItem('allAnnouncements', JSON.stringify(announcements));
  return simulateNetwork(announcements);
};

/**
 * Saves all student submissions.
 */
export const saveAllSubmissions = async (submissions: StudentSubmission[]): Promise<StudentSubmission[]> => {
    console.log("API: Saving all student submissions...");
    localStorage.setItem('allSubmissions', JSON.stringify(submissions));
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
    const profilesStr = localStorage.getItem('userProfiles') || '[]';
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
    
    localStorage.setItem('userProfiles', JSON.stringify(updatedProfiles));
    return simulateNetwork(updatedProfile);
};

/**
 * Saves the current user role.
 */
export const saveUserRole = async (role: UserRole | null): Promise<UserRole | null> => {
    console.log(`API: Setting user role to ${role}...`);
    if (role) {
        localStorage.setItem('userRole', JSON.stringify(role));
    } else {
        localStorage.removeItem('userRole');
    }
    return simulateNetwork(role);
};

// --- CLASSROOM CORE ---

export const saveAttendanceRecords = async (records: AttendanceRecord): Promise<AttendanceRecord> => {
    console.log("API: Saving attendance records...");
    localStorage.setItem('attendanceRecords', JSON.stringify(records));
    return simulateNetwork(records);
};

export const saveQuickFormativeAssessments = async (assessments: QuickFormativeAssessment[]): Promise<QuickFormativeAssessment[]> => {
    console.log("API: Saving quick formative assessments...");
    localStorage.setItem('quickFormativeAssessments', JSON.stringify(assessments));
    return simulateNetwork(assessments);
};

export const saveTeacherSchedules = async (schedules: TeacherSchedule[]): Promise<TeacherSchedule[]> => {
    console.log("API: Saving teacher schedules...");
    localStorage.setItem('teacherSchedules', JSON.stringify(schedules));
    return simulateNetwork(schedules);
};

// --- EXAM SUITE ---
export const saveItemBank = async (itemBank: QuestionPoolItem[]): Promise<QuestionPoolItem[]> => {
    console.log("API: Saving item bank...");
    localStorage.setItem('itemBank', JSON.stringify(itemBank));
    return simulateNetwork(itemBank);
};

// --- NOTIFICATIONS ---
export const saveAllNotifications = async (notifications: Notification[]): Promise<Notification[]> => {
    console.log("API: Saving all notifications...");
    localStorage.setItem('allNotifications', JSON.stringify(notifications));
    return simulateNetwork(notifications);
};

// --- FINANCE & OPS ---
export const saveAllBusRoutes = async (routes: BusRoute[]): Promise<BusRoute[]> => {
    console.log("API: Saving bus routes...");
    localStorage.setItem('busRoutes', JSON.stringify(routes));
    return simulateNetwork(routes);
};
export const saveAllPrintQuotas = async (quotas: PrintQuota[]): Promise<PrintQuota[]> => {
    console.log("API: Saving print quotas...");
    localStorage.setItem('printQuotas', JSON.stringify(quotas));
    return simulateNetwork(quotas);
};
export const saveAllFeeStatus = async (statuses: FeeStatus[]): Promise<FeeStatus[]> => {
    console.log("API: Saving fee statuses...");
    localStorage.setItem('feeStatus', JSON.stringify(statuses));
    return simulateNetwork(statuses);
};

// --- GROWTH ---
export const saveAllAfterSchoolPrograms = async (programs: AfterSchoolProgram[]): Promise<AfterSchoolProgram[]> => {
    console.log("API: Saving after school programs...");
    localStorage.setItem('afterSchoolPrograms', JSON.stringify(programs));
    return simulateNetwork(programs);
};
export const saveAllFacilityBookings = async (bookings: FacilityBooking[]): Promise<FacilityBooking[]> => {
    console.log("API: Saving facility bookings...");
    localStorage.setItem('facilityBookings', JSON.stringify(bookings));
    return simulateNetwork(bookings);
};

// --- BOARD PLANNER ---
export const saveAllBoardPlannerEvents = async (events: BoardPlannerEvent[]): Promise<BoardPlannerEvent[]> => {
    console.log("API: Saving board planner events...");
    localStorage.setItem('boardPlannerEvents', JSON.stringify(events));
    return simulateNetwork(events);
};

// --- AI & CODING ---
export const saveAllCrossCurricularProjects = async (projects: CrossCurricularProject[]): Promise<CrossCurricularProject[]> => {
    console.log("API: Saving cross-curricular projects...");
    localStorage.setItem('crossCurricularProjects', JSON.stringify(projects));
    return simulateNetwork(projects);
};

export const saveAllPortfolios = async (portfolios: AllPortfolios): Promise<AllPortfolios> => {
    console.log("API: Saving all portfolios...");
    localStorage.setItem('allPortfolios', JSON.stringify(portfolios));
    return simulateNetwork(portfolios);
};