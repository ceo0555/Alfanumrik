import { UserProfile, AllProgressData, AllFlashcardsData, UserRole, DailyChallenge, UserFlashcards, UserFlashcardItem, SrsData, AllBktData, Assignment, Announcement, StudentSubmission } from '../types';
import { curriculum } from '../constants/curriculum';

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


  let profiles: UserProfile[] = JSON.parse(profilesStr);
  const progress: AllProgressData = JSON.parse(progressStr);
  let flashcards: AllFlashcardsData = JSON.parse(flashcardsStr);
  let activeId: number | null = activeIdStr ? JSON.parse(activeIdStr) : null;
  const userRole: UserRole | null = userRoleStr ? JSON.parse(userRoleStr) : null;
  const allBktData: AllBktData = JSON.parse(bktDataStr);
  const allAssignments: Assignment[] = JSON.parse(assignmentsStr);
  const allAnnouncements: Announcement[] = JSON.parse(announcementsStr);
  const allSubmissions: StudentSubmission[] = JSON.parse(submissionsStr);
  const todayStr = new Date().toISOString().split('T')[0];

  // Data integrity/migration check
  profiles = profiles.map(p => {
    // Check and update daily challenge
    if (!p.dailyChallenge || p.dailyChallenge.id !== todayStr) {
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

  return simulateNetwork({ profiles, activeId, progress, flashcards, userRole, allBktData, allAssignments, allAnnouncements, allSubmissions });
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