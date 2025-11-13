import { UserProfile, AllProgressData, AllFlashcardsData, UserRole, DailyChallenge, UserFlashcards, UserFlashcardItem, SrsData, AllDktData, Assignment, Announcement, StudentSubmission, StudentFlnProgress, TeacherSchedule, AttendanceRecord, QuickFormativeAssessment, Notification, QuestionPoolItem, BusRoute, PrintQuota, FeeStatus, AfterSchoolProgram, FacilityBooking, BoardPlannerEvent, CrossCurricularProject, CodingModule, CommunicationTemplate, TeacherAssignment, StudentPortfolioProject, AllPortfolios, PaperBlueprint, ExamSession, ExamSubmission, Course, Grade, InteractionEventInput } from '../types';
import { curriculum } from '../constants/curriculum';
import { mockTeacherAssignments as initialTeacherAssignments, mockTeacherSchedule as initialTeacherSchedule } from '../constants/schoolData';
import { mockItemBank as initialItemBank } from '../constants/itemBank';
import { mockBusRoutes as initialBusRoutes, mockPrintQuotas as initialPrintQuotas, mockFeeStatus as initialFeeStatus } from '../constants/financeOpsData';
import { mockAfterSchoolPrograms as initialAfterSchoolPrograms, mockFacilityBookings as initialFacilityBookings } from '../constants/growthData';
import { mockCalendarEvents as initialBoardPlannerEvents, communicationTemplates as initialCommunicationTemplates } from '../constants/boardPlannerData';
import { codingModules as initialCodingModules, crossCurricularProjects as initialCrossCurricularProjects, mockPortfolios } from '../constants/codingModules';
import { appEventBus } from '../utils/eventBus';

const API_BASE = '/api';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

const simulateNetwork = async <T>(data: T): Promise<T> => data;

type ResourceSnapshot = Record<string, unknown>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

async function apiRequest<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);
  if (!response.ok) {
    const error = new Error(`API request failed (${response.status}) for ${path}`);
    console.error(error);
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = (await response.json()) as { data?: T } | T;
  if (isRecord(data) && 'data' in data) {
    return (data.data ?? undefined) as T;
  }
  return data as T;
}

const apiGet = async <T>(path: string, fallback: T): Promise<T> => {
  try {
    const result = await apiRequest<T>(path, { method: 'GET' });
    return (result ?? fallback) as T;
  } catch (error) {
    console.warn(`GET ${path} failed, using fallback`, error);
    return fallback;
  }
};

const apiPost = async <T>(path: string, body: unknown): Promise<T> =>
  apiRequest<T>(path, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });

const apiPut = async <T>(path: string, body: unknown): Promise<T> =>
  apiRequest<T>(path, {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });

const apiDelete = async (path: string): Promise<void> => {
  await apiRequest(path, { method: 'DELETE' });
};

const readResource = async <T>(resource: string, fallback: T): Promise<T> =>
  apiGet<T>(`/resources/${encodeURIComponent(resource)}`, fallback);

const writeResource = async <T>(resource: string, data: T): Promise<void> => {
  await apiPut(`/resources/${encodeURIComponent(resource)}`, { data });
};

const deleteResource = async (resource: string): Promise<void> => {
  await apiDelete(`/resources/${encodeURIComponent(resource)}`);
};

const parseOrDefault = <T>(value: unknown, fallback: T): T => {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
};

const getSubjectsForGrade = (grade: string): string[] => {
  const gradeData = curriculum[grade as keyof typeof curriculum];
  if (!gradeData) {
    return [];
  }
  return Object.keys(gradeData);
};

const getFirstChapterForGradeSubject = (grade: string, subject: string): string => {
  const gradeData = curriculum[grade as keyof typeof curriculum];
  if (!gradeData) {
    return '';
  }
  const subjectData = gradeData[subject as keyof typeof gradeData];
  if (Array.isArray(subjectData) && subjectData.length > 0) {
    return subjectData[0] as string;
  }
  return '';
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
            coinReward: 20,
        };
      } else {
          const subjects = getSubjectsForGrade(grade);
          const targetSubject = subjects[Math.floor(Math.random() * subjects.length)] ?? 'Science';
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
  console.log('API: Fetching all user data...');

  const snapshot = await apiGet<ResourceSnapshot>('/bootstrap', {});
  const get = <T>(key: string, fallback: T): T => parseOrDefault<T>(snapshot[key], fallback);

  let profiles: UserProfile[] = get<UserProfile[]>('userProfiles', []);
  const progress: AllProgressData = get<AllProgressData>('allProgressData', {});
  let flashcards: AllFlashcardsData = get<AllFlashcardsData>('allFlashcards', {});
  let activeId: number | null = get<number | null>('activeUserId', null);
  const userRole: UserRole | null = get<UserRole | null>('userRole', null);
  const allDktData: AllDktData = get<AllDktData>('allDktData', {});
  const allAssignments: Assignment[] = get<Assignment[]>('allAssignments', []);
  const allAnnouncements: Announcement[] = get<Announcement[]>('allAnnouncements', []);
  const allSubmissions: StudentSubmission[] = get<StudentSubmission[]>('allSubmissions', []);
  const allFlnProgress: StudentFlnProgress = get<StudentFlnProgress>('allFlnProgress', {});
  const attendanceRecords: AttendanceRecord = get<AttendanceRecord>('attendanceRecords', {});
  const quickFormativeAssessments: QuickFormativeAssessment[] = get<QuickFormativeAssessment[]>('quickFormativeAssessments', []);
  const allNotifications: Notification[] = get<Notification[]>('allNotifications', []);

  const teacherSchedules: TeacherSchedule[] = get<TeacherSchedule[]>('teacherSchedules', initialTeacherSchedule);
  const teacherAssignments: TeacherAssignment[] = get<TeacherAssignment[]>('teacherAssignments', initialTeacherAssignments);
  const itemBank: QuestionPoolItem[] = get<QuestionPoolItem[]>('itemBank', initialItemBank.map(item => ({ ...item, status: 'approved' })));
  const busRoutes: BusRoute[] = get<BusRoute[]>('busRoutes', initialBusRoutes);
  const printQuotas: PrintQuota[] = get<PrintQuota[]>('printQuotas', initialPrintQuotas);
  const feeStatus: FeeStatus[] = get<FeeStatus[]>('feeStatus', initialFeeStatus);
  const afterSchoolPrograms: AfterSchoolProgram[] = get<AfterSchoolProgram[]>('afterSchoolPrograms', initialAfterSchoolPrograms);
  const facilityBookings: FacilityBooking[] = get<FacilityBooking[]>('facilityBookings', initialFacilityBookings);
  const boardPlannerEvents: BoardPlannerEvent[] = get<BoardPlannerEvent[]>('boardPlannerEvents', initialBoardPlannerEvents);
  const crossCurricularProjects: CrossCurricularProject[] = get<CrossCurricularProject[]>('crossCurricularProjects', initialCrossCurricularProjects);
  const codingModules: CodingModule[] = get<CodingModule[]>('codingModules', initialCodingModules);
  const communicationTemplates: CommunicationTemplate[] = get<CommunicationTemplate[]>('communicationTemplates', initialCommunicationTemplates);
  const allPortfolios: AllPortfolios = get<AllPortfolios>('allPortfolios', mockPortfolios);
  const schoolName: string = get<string>('schoolName', 'Alfanumrik Model School');
  const allBlueprints: PaperBlueprint[] = get<PaperBlueprint[]>('allBlueprints', []);
  const allExamSessions: ExamSession[] = get<ExamSession[]>('allExamSessions', []);
  const allExamSubmissions: ExamSubmission[] = get<ExamSubmission[]>('allExamSubmissions', []);
  const allCourses: Course[] = get<Course[]>('allCourses', []);
  const allGrades: Grade[] = get<Grade[]>('allGrades', []);

  const operations: Promise<void>[] = [];
  const storesToEmit = new Set<string>();

  if (profiles.length === 0) {
    console.log('No profiles found. Creating default RBAC demo users.');
    const demoStudent: UserProfile = {
      id: 101,
      name: 'Rohan Sharma',
      grade: '10',
      lastSubject: 'Science',
      lastChapter: 'Chemical Reactions and Equations',
      currentStreak: 3,
      lastStreakDate: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
      achievements: ['first_lesson', 'streak_3'],
      xp: 350,
      level: 2,
      scholarCoins: 1250,
      tutorSessionUnlocked: false,
    };
    const demoParent: UserProfile = {
      id: 201,
      name: 'Mr. Sharma',
      grade: '',
      lastSubject: '',
      lastChapter: '',
      childIds: [101],
      currentStreak: 0,
      lastStreakDate: '',
      achievements: [],
      xp: 0,
      level: 1,
      scholarCoins: 0,
      tutorSessionUnlocked: false,
    };
    const demoTeacher: UserProfile = {
      id: 301,
      name: 'Ms. Davis',
      grade: '',
      lastSubject: '',
      lastChapter: '',
      schoolRole: 'teacher',
      currentStreak: 0,
      lastStreakDate: '',
      achievements: [],
      xp: 0,
      level: 1,
      scholarCoins: 0,
      tutorSessionUnlocked: false,
    };
    const demoPrincipal: UserProfile = {
      id: 401,
      name: 'Mr. Singh',
      grade: '',
      lastSubject: '',
      lastChapter: '',
      schoolRole: 'principal',
      currentStreak: 0,
      lastStreakDate: '',
      achievements: [],
      xp: 0,
      level: 1,
      scholarCoins: 0,
      tutorSessionUnlocked: false,
    };
    profiles = [demoStudent, demoParent, demoTeacher, demoPrincipal];
    operations.push(writeResource('userProfiles', profiles));
    storesToEmit.add('userProfiles');
    operations.push(writeResource('teacherAssignments', initialTeacherAssignments));
    storesToEmit.add('teacherAssignments');
  }

  const todayStr = new Date().toISOString().split('T')[0];

  profiles = profiles.map((p) => {
    const nextProfile: UserProfile = {
      ...p,
      xp: p.xp || 0,
      level: p.level || 1,
      scholarCoins: p.scholarCoins || 0,
      achievements: p.achievements || [],
      tutorSessionUnlocked: p.tutorSessionUnlocked || false,
      unlockedPetAccessories: p.unlockedPetAccessories || [],
    };

    if (!nextProfile.schoolRole && !nextProfile.childIds) {
      if (!nextProfile.dailyChallenge || nextProfile.dailyChallenge.id !== todayStr) {
        nextProfile.dailyChallenge = generateDailyChallenge(nextProfile.grade);
      }
      if (!nextProfile.widgets) {
        nextProfile.widgets = [{ id: `default-focus-${nextProfile.id}`, type: 'today_focus' }];
      }
    }

    return nextProfile;
  });

  let hasMigrated = false;
  const migratedSample: { from: any; to: SrsData }[] = [];

  for (const userId of Object.keys(flashcards)) {
    const numericUserId = Number(userId);
    const userFlashcards: UserFlashcards | undefined = flashcards[numericUserId];
    if (!userFlashcards) {
      continue;
    }
    for (const chapterId of Object.keys(userFlashcards)) {
      const deck = userFlashcards[chapterId];
      if (deck.length > 0 && 'state' in (deck[0].srsData as any)) {
        hasMigrated = true;
        userFlashcards[chapterId] = deck.map((item) => {
          const oldSrs = item.srsData as any;
          const newSrs: SrsData = {
            s: oldSrs.interval || 1,
            d: 10 - ((oldSrs.easeFactor - 1.3) / (2.5 - 1.3)) * 9,
            due: oldSrs.nextReviewDate || todayStr,
            reps: oldSrs.state === 'new' ? 0 : 1,
            lapses: oldSrs.lapses || 0,
            last_review:
              oldSrs.state === 'new'
                ? null
                : new Date(new Date().setDate(new Date().getDate() - oldSrs.interval)).toISOString(),
          };
          newSrs.d = Math.max(1, Math.min(10, newSrs.d));
          if (migratedSample.length < 5) {
            migratedSample.push({ from: oldSrs, to: newSrs });
          }
          return { ...item, srsData: newSrs };
        });
      }
    }
    if (hasMigrated) {
      flashcards[numericUserId] = userFlashcards;
    }
  }

  if (hasMigrated) {
    console.log('Migration to FSRS format complete.');
    console.log('Migration validation sample (up to 5 cards):', migratedSample);
    operations.push(writeResource('allFlashcards', flashcards));
    storesToEmit.add('allFlashcards');
  }

  if (activeId && !profiles.some((p) => p.id === activeId)) {
    activeId = profiles.length > 0 ? profiles[0].id : null;
    if (activeId === null) {
      operations.push(deleteResource('activeUserId'));
    } else {
      operations.push(writeResource('activeUserId', activeId));
    }
    storesToEmit.add('activeUserId');
  }

  if (operations.length > 0) {
    await Promise.all(operations);
    storesToEmit.forEach((store) => appEventBus.emit('data-changed', { store }));
  }

  return simulateNetwork({
    profiles,
    activeId,
    progress,
    flashcards,
    userRole,
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
  });
};

/**
 * Saves or updates user profiles. Handles single add, single edit, and bulk add.
 */
export const saveUserProfile = async (
  allProfiles: UserProfile[],
  data: { name: string; grade: string } | { name: string; grade: string }[],
  idToEdit?: number
): Promise<UserProfile[]> => {
  const payloads: Array<Promise<unknown>> = [];

  if (Array.isArray(data)) {
    console.log(`API: Bulk onboarding ${data.length} users...`);
    data.forEach((user) => {
      const newId = Date.now() + Math.floor(Math.random() * 1000);
      const subjects = getSubjectsForGrade(user.grade);
      const firstSubject = subjects[0] ?? 'General';
      const firstChapter = getFirstChapterForGradeSubject(user.grade, firstSubject);
      const profile: UserProfile = {
        id: newId,
        name: user.name,
        grade: user.grade,
        lastSubject: firstSubject,
        lastChapter: firstChapter,
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
      payloads.push(apiPost<UserProfile>('/profiles', { profile }));
    });
  } else if (idToEdit !== undefined) {
    console.log(`API: Editing profile for ${data.name}...`);
    const { name, grade } = data;
    const existing = allProfiles.find((profile) => profile.id === idToEdit);
    const subjects = getSubjectsForGrade(grade);
    const nextSubject = existing && existing.grade === grade ? existing.lastSubject : subjects[0] ?? 'General';
    const nextChapter =
      existing && existing.grade === grade
        ? existing.lastChapter
        : getFirstChapterForGradeSubject(grade, nextSubject);

    payloads.push(
      apiPut<UserProfile>(`/profiles/${idToEdit}`, {
        profile: {
          name,
          grade,
          lastSubject: nextSubject,
          lastChapter: nextChapter,
        },
      })
    );
  } else {
    console.log(`API: Saving profile for ${data.name}...`);
    const { name, grade } = data;
    const newId = Date.now();
    const subjects = getSubjectsForGrade(grade);
    const firstSubject = subjects[0] ?? 'General';
    const firstChapter = getFirstChapterForGradeSubject(grade, firstSubject);
    const profile: UserProfile = {
      id: newId,
      name,
      grade,
      lastSubject: firstSubject,
      lastChapter: firstChapter,
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
    payloads.push(apiPost<UserProfile>('/profiles', { profile }));
  }

  if (payloads.length > 0) {
    await Promise.all(payloads);
  }

  const latestProfiles = await apiGet<UserProfile[]>('/profiles', []);
  appEventBus.emit('data-changed', { store: 'userProfiles' });
  return simulateNetwork(latestProfiles);
};


/**
 * Updates the active user ID.
 */
export const saveActiveUserId = async (id: number): Promise<number> => {
  console.log(`API: Setting active user to ${id}...`);
  await writeResource('activeUserId', id);
  appEventBus.emit('data-changed', { store: 'activeUserId' });
  return simulateNetwork(id);
};

/**
 * Saves the entire progress data object.
 * In a real app, this would likely be more granular (e.g., PUT /api/users/:id/progress).
 */
export const saveAllProgress = async (progress: AllProgressData): Promise<AllProgressData> => {
  console.log("API: Saving all progress data...");
  await writeResource('allProgressData', progress);
  appEventBus.emit('data-changed', { store: 'allProgressData' });
  return simulateNetwork(progress);
};

/**
 * Saves the entire DKT data object.
 */
export const saveAllDktData = async (dktData: AllDktData): Promise<AllDktData> => {
    console.log("API: Saving all DKT data...");
    await writeResource('allDktData', dktData);
    appEventBus.emit('data-changed', { store: 'allDktData' });
    return simulateNetwork(dktData);
};


/**
 * Saves the entire flashcards data object.
 */
export const saveAllFlashcards = async (flashcards: AllFlashcardsData): Promise<AllFlashcardsData> => {
  console.log("API: Saving all flashcards data...");
  await writeResource('allFlashcards', flashcards);
  appEventBus.emit('data-changed', { store: 'allFlashcards' });
  return simulateNetwork(flashcards);
};

/**
 * Saves all FLN progress data.
 */
export const saveAllFlnProgress = async (progress: StudentFlnProgress): Promise<StudentFlnProgress> => {
  console.log("API: Saving all FLN progress data...");
  await writeResource('allFlnProgress', progress);
  appEventBus.emit('data-changed', { store: 'allFlnProgress' });
  return simulateNetwork(progress);
};

/**
 * Saves the entire assignments data object.
 */
export const saveAllAssignments = async (assignments: Assignment[]): Promise<Assignment[]> => {
  console.log("API: Saving all assignments data...");
  await writeResource('allAssignments', assignments);
  appEventBus.emit('data-changed', { store: 'allAssignments' });
  return simulateNetwork(assignments);
};

/**
 * Saves all announcements.
 */
export const saveAllAnnouncements = async (announcements: Announcement[]): Promise<Announcement[]> => {
  console.log("API: Saving all announcements...");
  await writeResource('allAnnouncements', announcements);
  appEventBus.emit('data-changed', { store: 'allAnnouncements' });
  return simulateNetwork(announcements);
};

/**
 * Saves all student submissions.
 */
export const saveAllSubmissions = async (submissions: StudentSubmission[]): Promise<StudentSubmission[]> => {
    console.log("API: Saving all student submissions...");
    await writeResource('allSubmissions', submissions);
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
    const updatedProfile = await apiPut<UserProfile>(`/profiles/${userId}`, { profile: updates });
    appEventBus.emit('data-changed', { store: 'userProfiles' });
    return simulateNetwork(updatedProfile);
};

/**
 * Saves the current user role.
 */
export const saveUserRole = async (role: UserRole | null): Promise<UserRole | null> => {
    console.log(`API: Setting user role to ${role}...`);
    if (role) {
        await writeResource('userRole', role);
    } else {
        await deleteResource('userRole');
    }
    appEventBus.emit('data-changed', { store: 'userRole' });
    return simulateNetwork(role);
};

// --- CLASSROOM CORE ---

export const saveAttendanceRecords = async (records: AttendanceRecord): Promise<AttendanceRecord> => {
    console.log("API: Saving attendance records...");
    await writeResource('attendanceRecords', records);
    appEventBus.emit('data-changed', { store: 'attendanceRecords' });
    return simulateNetwork(records);
};

export const saveQuickFormativeAssessments = async (assessments: QuickFormativeAssessment[]): Promise<QuickFormativeAssessment[]> => {
    console.log("API: Saving quick formative assessments...");
    await writeResource('quickFormativeAssessments', assessments);
    appEventBus.emit('data-changed', { store: 'quickFormativeAssessments' });
    return simulateNetwork(assessments);
};

export const saveTeacherSchedules = async (schedules: TeacherSchedule[]): Promise<TeacherSchedule[]> => {
    console.log("API: Saving teacher schedules...");
    await writeResource('teacherSchedules', schedules);
    appEventBus.emit('data-changed', { store: 'teacherSchedules' });
    return simulateNetwork(schedules);
};

// --- EXAM SUITE ---
export const saveItemBank = async (itemBank: QuestionPoolItem[]): Promise<QuestionPoolItem[]> => {
    console.log("API: Saving item bank...");
    await writeResource('itemBank', itemBank);
    appEventBus.emit('data-changed', { store: 'itemBank' });
    return simulateNetwork(itemBank);
};

export const saveAllExamSessions = async (sessions: ExamSession[]): Promise<ExamSession[]> => {
    console.log("API: Saving all exam sessions...");
    await writeResource('allExamSessions', sessions);
    appEventBus.emit('data-changed', { store: 'allExamSessions' });
    return simulateNetwork(sessions);
};

export const saveAllExamSubmissions = async (submissions: ExamSubmission[]): Promise<ExamSubmission[]> => {
    console.log("API: Saving all exam submissions...");
    await writeResource('allExamSubmissions', submissions);
    appEventBus.emit('data-changed', { store: 'allExamSubmissions' });
    return simulateNetwork(submissions);
};

// --- NOTIFICATIONS ---
export const saveAllNotifications = async (notifications: Notification[]): Promise<Notification[]> => {
    console.log("API: Saving all notifications...");
    await writeResource('allNotifications', notifications);
    appEventBus.emit('data-changed', { store: 'allNotifications' });
    return simulateNetwork(notifications);
};

// --- FINANCE & OPS ---
export const saveAllBusRoutes = async (routes: BusRoute[]): Promise<BusRoute[]> => {
    console.log("API: Saving bus routes...");
    await writeResource('busRoutes', routes);
    appEventBus.emit('data-changed', { store: 'busRoutes' });
    return simulateNetwork(routes);
};
export const saveAllPrintQuotas = async (quotas: PrintQuota[]): Promise<PrintQuota[]> => {
    console.log("API: Saving print quotas...");
    await writeResource('printQuotas', quotas);
    appEventBus.emit('data-changed', { store: 'printQuotas' });
    return simulateNetwork(quotas);
};
export const saveAllFeeStatus = async (statuses: FeeStatus[]): Promise<FeeStatus[]> => {
    console.log("API: Saving fee statuses...");
    await writeResource('feeStatus', statuses);
    appEventBus.emit('data-changed', { store: 'feeStatus' });
    return simulateNetwork(statuses);
};

// --- GROWTH ---
export const saveAllAfterSchoolPrograms = async (programs: AfterSchoolProgram[]): Promise<AfterSchoolProgram[]> => {
    console.log("API: Saving after school programs...");
    await writeResource('afterSchoolPrograms', programs);
    appEventBus.emit('data-changed', { store: 'afterSchoolPrograms' });
    return simulateNetwork(programs);
};
export const saveAllFacilityBookings = async (bookings: FacilityBooking[]): Promise<FacilityBooking[]> => {
    console.log("API: Saving facility bookings...");
    await writeResource('facilityBookings', bookings);
    appEventBus.emit('data-changed', { store: 'facilityBookings' });
    return simulateNetwork(bookings);
};

// --- BOARD PLANNER ---
export const saveAllBoardPlannerEvents = async (events: BoardPlannerEvent[]): Promise<BoardPlannerEvent[]> => {
    console.log("API: Saving board planner events...");
    await writeResource('boardPlannerEvents', events);
    appEventBus.emit('data-changed', { store: 'boardPlannerEvents' });
    return simulateNetwork(events);
};

// --- AI & CODING ---
export const saveAllCrossCurricularProjects = async (projects: CrossCurricularProject[]): Promise<CrossCurricularProject[]> => {
    console.log("API: Saving cross-curricular projects...");
    await writeResource('crossCurricularProjects', projects);
    appEventBus.emit('data-changed', { store: 'crossCurricularProjects' });
    return simulateNetwork(projects);
};

export const saveAllPortfolios = async (portfolios: AllPortfolios): Promise<AllPortfolios> => {
    console.log("API: Saving all portfolios...");
    await writeResource('allPortfolios', portfolios);
    appEventBus.emit('data-changed', { store: 'allPortfolios' });
    return simulateNetwork(portfolios);
};

// --- NEW PERSISTENCE FOR SCHOOL OS ---
export const saveSchoolName = async (name: string): Promise<string> => {
    console.log("API: Saving school name...");
    await writeResource('schoolName', name);
    appEventBus.emit('data-changed', { store: 'schoolName' });
    return simulateNetwork(name);
}

export const saveAllBlueprints = async (blueprints: PaperBlueprint[]): Promise<PaperBlueprint[]> => {
    console.log("API: Saving all paper blueprints...");
    await writeResource('allBlueprints', blueprints);
    appEventBus.emit('data-changed', { store: 'allBlueprints' });
    return simulateNetwork(blueprints);
}

// --- NEW LMS PERSISTENCE ---
export const saveAllCourses = async (courses: Course[]): Promise<Course[]> => {
    console.log("API: Saving all courses...");
    await writeResource('allCourses', courses);
    appEventBus.emit('data-changed', { store: 'allCourses' });
    return simulateNetwork(courses);
};

export const saveAllGrades = async (grades: Grade[]): Promise<Grade[]> => {
    console.log("API: Saving all grades...");
    await writeResource('allGrades', grades);
    appEventBus.emit('data-changed', { store: 'allGrades' });
    return simulateNetwork(grades);
};

export const logInteractionEvent = async (event: InteractionEventInput): Promise<void> => {
  await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event }),
  });
};
