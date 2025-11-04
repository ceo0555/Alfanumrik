import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { GamificationEvent, UserProgressData, UserFlashcards, UserDktData, Badge, StudyTask, Flashcard, ChapterProgress, UserFlashcardItem, UserProfile } from '../types';
import { allAchievements } from '../constants/achievements';
import { curriculum } from '../constants/curriculum';
import * as apiService from '../services/apiService';
import { useAuth } from './AuthContext';
import { gradeFsrsCard, initFsrsCard } from '../services/fsrs';
import { initDktSkill, updateDktMastery, generateTodayFocusTasks } from '../services/adaptiveEngine';

interface StudentDataContextType {
  progressData: UserProgressData;
  userFlashcards: UserFlashcards;
  userDktData: UserDktData;
  newAchievement: Badge | null;
  todayTasks: StudyTask[];

  startChapter: () => void;
  markChapterAsCompleted: () => void;
  handleSrsSessionCompleted: (completedTaskIds: string[]) => void;
  handleSetDueDate: (chapterId: string, dueDate: string | null) => void;
  handleSaveManualTask: (taskData: Omit<StudyTask, 'id' | 'type' | 'isCompleted'>) => void;
  handleSaveFlashcards: (chapterId: string, flashcards: Flashcard[]) => void;
  clearNewAchievement: () => void;
  awardXP: (event: GamificationEvent, amount?: number) => void;
  gradeFlashcard: (chapterId: string, cardIndex: number, rating: 1 | 2 | 3 | 4) => void;
  recordAnswer: (skillId: string, isCorrect: boolean, errorType?: string) => void;
  updateChapterStep: (step: number) => void;
}

const StudentDataContext = createContext<StudentDataContextType | undefined>(undefined);

const XP_CONFIG: { [key in GamificationEvent]: number } = {
    step_completed: 10,
    lesson_completed: 100,
    quiz_correct: 25,
    streak_update: 50,
    focus_session_completed: 30,
    mastery_unlock: 200,
    streak_milestone: 150,
};

const calculateLevel = (xp: number) => Math.floor(Math.sqrt(xp / 100)) + 1;

export const StudentDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { activeProfile, allProgressData, allFlashcards, allDktData, updateActiveUserProfile, handleSaveAllDktData, allAssignments, handleUpdateSingleTask, allSubmissions } = useAuth();
  
  const [progressData, setProgressData] = useState<UserProgressData>({});
  const [userFlashcards, setUserFlashcards] = useState<UserFlashcards>({});
  const [userDktData, setUserDktData] = useState<UserDktData>({});
  const [newAchievement, setNewAchievement] = useState<Badge | null>(null);
  const [todayTasks, setTodayTasks] = useState<StudyTask[]>([]);


  useEffect(() => {
    if (activeProfile) {
        setProgressData(allProgressData[activeProfile.id] || {});
        setUserFlashcards(allFlashcards[activeProfile.id] || {});
        setUserDktData(allDktData[activeProfile.id] || {});
    } else {
        setProgressData({});
        setUserFlashcards({});
        setUserDktData({});
    }
  }, [activeProfile, allProgressData, allFlashcards, allDktData]);
  
  useEffect(() => {
    if (activeProfile) {
        const tasks = generateTodayFocusTasks(userDktData, userFlashcards, allAssignments, activeProfile, allSubmissions, progressData);
        setTodayTasks(tasks);
    }
  }, [userDktData, userFlashcards, allAssignments, activeProfile, allSubmissions, progressData]);


  const awardXP = useCallback((event: GamificationEvent, amount?: number) => {
    if (!activeProfile) return;
    const points = amount || XP_CONFIG[event];
    const newXp = (activeProfile.xp || 0) + points;
    const newLevel = calculateLevel(newXp);
    
    const updates: Partial<UserProfile> = { xp: newXp };
    if (newLevel > (activeProfile.level || 1)) {
        updates.level = newLevel;
    }

    // Daily Challenge Progress
    if (activeProfile.dailyChallenge && !activeProfile.dailyChallenge.isCompleted) {
        const challenge = { ...activeProfile.dailyChallenge };
        let challengeCompleted = false;

        if (challenge.type === 'earn_xp') {
            challenge.progress = (challenge.progress || 0) + points;
            if (challenge.progress >= (challenge.target as number)) {
                challenge.isCompleted = true;
                challengeCompleted = true;
            }
        }
        updates.dailyChallenge = challenge;
        if (challengeCompleted) {
            updates.xp = newXp + challenge.reward;
            updates.level = calculateLevel(updates.xp);
        }
    }
    
    updateActiveUserProfile(updates);

  }, [activeProfile, updateActiveUserProfile]);

  const recordAnswer = useCallback((skillId: string, isCorrect: boolean, errorType?: string) => {
    if (!activeProfile) return;

    if (errorType) {
      console.log(`[Adaptive Engine] Recorded error type for skill ${skillId}: ${errorType}`);
    }

    // 1. Update DKT Mastery
    const prevState = userDktData[skillId] || initDktSkill();
    // UPGRADED: Pass the qualitative errorType to the DKT model.
    const newState = updateDktMastery(prevState, isCorrect, errorType);
    
    const updatedDktData = {
        ...userDktData,
        [skillId]: newState
    };
    setUserDktData(updatedDktData); // Optimistic update
    
    // Persist DKT data
    handleSaveAllDktData({ ...allDktData, [activeProfile.id]: updatedDktData });

    // 2. Award XP if correct
    if (isCorrect) {
        awardXP('quiz_correct');
    }
    
  }, [activeProfile, userDktData, awardXP, allDktData, handleSaveAllDktData]);
  
  const startChapter = useCallback(async () => {
    if (!activeProfile) return;
    const { grade, lastSubject, lastChapter, id } = activeProfile;
    const chapterId = `G${grade}-${lastSubject}-${lastChapter}`;
    
    const currentUserProgress = progressData || {};
    if (currentUserProgress[chapterId]?.status) { // already started or completed
      return;
    }

    const updatedProgress: UserProgressData = {
        ...currentUserProgress,
        [chapterId]: { status: 'started' }
    };
    
    setProgressData(updatedProgress); // Optimistic update
    try {
      const allData = await apiService.fetchAllData();
      const updatedAllProgress = { ...allData.progress, [id]: updatedProgress };
      await apiService.saveAllProgress(updatedAllProgress);
    } catch (e) {
      console.error("Failed to save chapter start progress:", e);
      setProgressData(currentUserProgress); // Revert on failure
    }
  }, [activeProfile, progressData]);
  
  const clearNewAchievement = () => setNewAchievement(null);

  const awardAchievement = useCallback((badgeId: string, profile: UserProfile) => {
      if (profile.achievements?.includes(badgeId)) {
          return false; // Already has it
      }
      const achievement = allAchievements.find(a => a.id === badgeId);
      if (achievement) {
          console.log(`Awarding achievement: ${achievement.name}`);
          setNewAchievement(achievement);
          return true; // Awarded
      }
      return false; // Not found
  }, []);

  const markChapterAsCompleted = useCallback(async () => {
    if (!activeProfile) return;
    const { id, grade, lastSubject, lastChapter } = activeProfile;

    awardXP('lesson_completed');

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    let updatedProfile = { ...activeProfile };
    
    // Streak Logic
    const lastDate = updatedProfile.lastStreakDate ? new Date(updatedProfile.lastStreakDate) : null;
    let newStreak = updatedProfile.currentStreak || 0;
    if (lastDate) {
        const diffTime = today.getTime() - lastDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
            newStreak++;
            awardXP('streak_update');
        } else if (diffDays > 1) newStreak = 1;
    } else {
        newStreak = 1;
    }
    
    let profileUpdates: Partial<UserProfile> = {
        currentStreak: newStreak,
        lastStreakDate: todayStr,
    };
    
    // Daily Challenge Progress
    if (activeProfile.dailyChallenge && !activeProfile.dailyChallenge.isCompleted && activeProfile.dailyChallenge.type === 'complete_lesson' && activeProfile.dailyChallenge.target === activeProfile.lastSubject) {
        const challenge = { ...activeProfile.dailyChallenge, progress: 1, isCompleted: true };
        profileUpdates.dailyChallenge = challenge;
        const newXp = (activeProfile.xp || 0) + (profileUpdates.xp || 0) + challenge.reward;
        profileUpdates.xp = newXp;
        profileUpdates.level = calculateLevel(newXp);
    }

    // Automatically complete related study task
    const chapterId = `G${grade}-${lastSubject}-${lastChapter}`;
    const relatedTask = activeProfile.studyPlan?.find(task => task.data?.chapterId === chapterId && (task.type === 'review_weakness' || task.type === 'next_lesson'));
    if (relatedTask && !relatedTask.isCompleted) {
        handleUpdateSingleTask(relatedTask.id, { isCompleted: true });
    }

    // Achievement Logic
    const completedChaptersBefore = Object.values(progressData).filter((p: ChapterProgress) => p.status === 'completed').length;
    let newAchievements = [...(updatedProfile.achievements || [])];

    if (completedChaptersBefore === 0) {
        if (awardAchievement('first_lesson', updatedProfile)) newAchievements.push('first_lesson');
    }
    const streakBadges = [{ id: 'streak_3', days: 3 }, { id: 'streak_7', days: 7 }, { id: 'streak_14', days: 14 }];
    for (const badge of streakBadges) {
        if (newStreak >= badge.days) {
            if (awardAchievement(badge.id, updatedProfile)) newAchievements.push(badge.id);
        }
    }
    
    // Update Progress Data
    const updatedProgressData: UserProgressData = {
        ...progressData,
        [chapterId]: { ...(progressData[chapterId] || {}), status: 'completed', currentStep: 0 }
    };

    // Check for Subject Mastery
    const subjectChapters = curriculum[grade as keyof typeof curriculum]?.[lastSubject] ?? [];
    const completedInSubject = subjectChapters.filter(ch => {
        const chId = `G${grade}-${lastSubject}-${ch}`;
        return (updatedProgressData[chId]?.status === 'completed');
    }).length;

    if (subjectChapters.length > 0 && completedInSubject === subjectChapters.length) {
        const masteryBadgeId = `mastery_${lastSubject.toLowerCase().replace(' ', '_')}`;
        if (awardAchievement(masteryBadgeId, updatedProfile)) newAchievements.push(masteryBadgeId);
    }
    
    profileUpdates.achievements = newAchievements;


    // --- State & API Updates ---
    setProgressData(updatedProgressData);
    updateActiveUserProfile(profileUpdates);
    
    try {
      const allData = await apiService.fetchAllData();
      const updatedAllProgress = { ...allData.progress, [id]: updatedProgressData };
      await apiService.saveAllProgress(updatedAllProgress);
    } catch (e) {
      console.error("Failed to save completion progress:", e);
      // Revert progress data on failure
      setProgressData(progressData);
    }

  }, [activeProfile, progressData, awardXP, updateActiveUserProfile, awardAchievement, handleUpdateSingleTask]);
  
  const handleSrsSessionCompleted = useCallback((completedTaskIds: string[]) => {
      completedTaskIds.forEach(taskId => {
          handleUpdateSingleTask(taskId, { isCompleted: true });
      });
  }, [handleUpdateSingleTask]);

  const handleSetDueDate = async (chapterId: string, dueDate: string | null) => {
    if (!activeProfile) return;
    const oldProgress = { ...progressData };
    const currentChapterProgress = oldProgress[chapterId] || { status: 'started' };
    
    const updatedProgress: UserProgressData = {
      ...oldProgress,
      [chapterId]: { ...currentChapterProgress, dueDate: dueDate || undefined }
    };
    setProgressData(updatedProgress); // Optimistic update
    try {
      const allData = await apiService.fetchAllData();
      const updatedAllProgress = { ...allData.progress, [activeProfile.id]: updatedProgress };
      await apiService.saveAllProgress(updatedAllProgress);
    } catch (e) {
      console.error("Failed to save due date:", e);
      setProgressData(oldProgress); // Revert
    }
  };

  const handleSaveManualTask = useCallback((taskData: Omit<StudyTask, 'id' | 'type' | 'isCompleted'>) => {
    if (!activeProfile) return;
    const newTask: StudyTask = {
        ...taskData,
        id: `manual-${Date.now()}`,
        type: 'manual',
        isCompleted: false,
    };
    const updatedTasks = [...(activeProfile.manualTasks || []), newTask];
    updateActiveUserProfile({ manualTasks: updatedTasks });
  }, [activeProfile, updateActiveUserProfile]);

  const handleSaveFlashcards = async (chapterId: string, flashcards: Flashcard[]) => {
    if (!activeProfile) return;
    const oldFlashcards = { ...userFlashcards };
    
    const now = new Date();
    const newItems: UserFlashcardItem[] = flashcards.map(card => ({
        card,
        srsData: initFsrsCard(now) // Initialize with FSRS defaults
    }));
    
    const updatedFlashcards: UserFlashcards = {
        ...oldFlashcards,
        [chapterId]: newItems
    };
    setUserFlashcards(updatedFlashcards); // Optimistic update
    try {
      const allData = await apiService.fetchAllData();
      const updatedAllFlashcards = { ...allData.flashcards, [activeProfile.id]: updatedFlashcards };
      await apiService.saveAllFlashcards(updatedAllFlashcards);
    } catch (e) {
      console.error("Failed to save flashcards:", e);
      setUserFlashcards(oldFlashcards); // Revert
    }
  };

  const gradeFlashcard = useCallback(async (chapterId: string, cardIndex: number, rating: 1 | 2 | 3 | 4) => {
      if (!activeProfile) return;
      const oldFlashcards = { ...userFlashcards };

      const deck = oldFlashcards[chapterId];
      if (!deck || !deck[cardIndex]) return;

      if (rating > 1) { // Award XP for 'Hard', 'Good', or 'Easy', but not 'Again'
        awardXP('step_completed');
      }

      const itemToGrade = deck[cardIndex];
      const now = new Date();
      
      const updatedSrsCore = gradeFsrsCard(itemToGrade.srsData, rating, now);

      const nextDueDate = new Date(now);
      const intervalDays = Math.round(updatedSrsCore.s);
      nextDueDate.setDate(nextDueDate.getDate() + intervalDays);
      
      const updatedDeck = [...deck];
      updatedDeck[cardIndex] = {
          ...itemToGrade,
          srsData: { ...updatedSrsCore, due: nextDueDate.toISOString().split('T')[0] }
      };

      const updatedFlashcards: UserFlashcards = {
        ...oldFlashcards,
        [chapterId]: updatedDeck
      };
      
      setUserFlashcards(updatedFlashcards); // Optimistic

      try {
          const allData = await apiService.fetchAllData();
          const updatedAllFlashcards = { ...allData.flashcards, [activeProfile.id]: updatedFlashcards };
          await apiService.saveAllFlashcards(updatedAllFlashcards);
      } catch(e) {
          console.error("Failed to update FSRS data:", e);
          setUserFlashcards(oldFlashcards); // Revert
      }
  }, [activeProfile, userFlashcards, awardXP]);

  const updateChapterStep = useCallback(async (step: number) => {
    if (!activeProfile) return;

    const { grade, lastSubject, lastChapter, id } = activeProfile;
    const chapterId = `G${grade}-${lastSubject}-${lastChapter}`;
    const oldProgress = { ...progressData };
    const currentChapterProgress = oldProgress[chapterId] || { status: 'started' };

    // Avoid saving if nothing changed
    if (currentChapterProgress.currentStep === step) return;

    const updatedProgress: UserProgressData = {
      ...oldProgress,
      [chapterId]: { ...currentChapterProgress, currentStep: step }
    };

    setProgressData(updatedProgress); // Optimistic update
    try {
      // Fetch latest to avoid race conditions with other progress updates
      const allData = await apiService.fetchAllData(); 
      const updatedAllProgress = { ...allData.progress, [id]: updatedProgress };
      await apiService.saveAllProgress(updatedAllProgress);
    } catch (e) {
      console.error("Failed to save chapter step progress:", e);
      setProgressData(oldProgress); // Revert on failure
    }
  }, [activeProfile, progressData]);


  const value = {
    progressData,
    userFlashcards,
    userDktData,
    newAchievement,
    todayTasks,
    startChapter,
    markChapterAsCompleted,
    handleSrsSessionCompleted,
    handleSetDueDate,
    handleSaveManualTask,
    handleSaveFlashcards,
    clearNewAchievement,
    awardXP,
    gradeFlashcard,
    recordAnswer,
    updateChapterStep,
  };

  return <StudentDataContext.Provider value={value}>{children}</StudentDataContext.Provider>;
};

export const useStudentData = () => {
  const context = useContext(StudentDataContext);
  if (context === undefined) {
    throw new Error('useStudentData must be used within a StudentDataProvider');
  }
  return context;
};