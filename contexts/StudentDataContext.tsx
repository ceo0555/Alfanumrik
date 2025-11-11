import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
// FIX: Added ChapterProgress to imports to resolve typing issue.
import { GamificationEvent, UserProgressData, UserFlashcards, UserDktData, Badge, StudyTask, Flashcard, UserFlashcardItem, UserProfile, ChapterProgress } from '../types';
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

  startTopic: (topicId: string) => void;
  markTopicAsCompleted: (topicId: string) => void;
  resetTopicProgress: (topicId: string) => void;
  handleSrsSessionCompleted: (completedTaskIds: string[]) => void;
  handleSetDueDate: (chapterId: string, dueDate: string | null) => void;
  handleSaveManualTask: (taskData: Omit<StudyTask, 'id' | 'type' | 'isCompleted'>) => void;
  handleSaveFlashcards: (chapterId: string, flashcards: Flashcard[]) => void;
  clearNewAchievement: () => void;
  awardXP: (event: GamificationEvent, amount?: number) => void;
  gradeFlashcard: (chapterId: string, cardIndex: number, rating: 1 | 2 | 3 | 4) => void;
  recordAnswer: (skillId: string, isCorrect: boolean, errorType?: string) => void;
  updateTopicStep: (topicId: string, step: number) => void;
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
  
  const startTopic = useCallback(async (topicId: string) => {
    if (!activeProfile) return;
    const { id } = activeProfile;
    
    const currentUserProgress = progressData || {};
    if (currentUserProgress[topicId]?.status) { // already started or completed
      return;
    }

    const updatedProgress: UserProgressData = {
        ...currentUserProgress,
        [topicId]: { status: 'started', currentStep: 0 }
    };
    
    setProgressData(updatedProgress); // Optimistic update
    
    // This now directly updates the global state in AuthContext which then persists
    const newAllProgressData = { ...allProgressData, [id]: updatedProgress };
    await apiService.saveAllProgress(newAllProgressData);

  }, [activeProfile, progressData, allProgressData]);
  
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

  const markTopicAsCompleted = useCallback(async (topicId: string) => {
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
    const relatedTask = activeProfile.studyPlan?.find(task => task.data?.chapterId === topicId.split('|')[0] && (task.type === 'review_weakness' || task.type === 'next_lesson'));
    if (relatedTask && !relatedTask.isCompleted) {
        handleUpdateSingleTask(relatedTask.id, { isCompleted: true });
    }

    // Achievement Logic
    // FIX: Explicitly type 'p' as ChapterProgress to allow access to '.status'.
    const completedTopicsBefore = Object.values(progressData).filter((p: ChapterProgress) => p.status === 'completed').length;
    let newAchievements = [...(updatedProfile.achievements || [])];

    if (completedTopicsBefore === 0) {
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
        [topicId]: { ...(progressData[topicId] || {}), status: 'completed', currentStep: undefined }
    };

    // Check for Subject Mastery (now based on Chapters)
    const chapterId = topicId.split('|')[0];
    const subjectChapters = curriculum[grade as keyof typeof curriculum]?.[lastSubject] ?? [];
    const completedInSubject = subjectChapters.filter(ch => {
        const chId = `G${grade}-${lastSubject}-${ch}`;
        return (updatedProgressData[chId]?.status === 'completed'); // This logic is now flawed as progress is per-topic.
    }).length;

    // This mastery logic needs to be re-thought based on topics, but for now we'll leave it as is.
    
    profileUpdates.achievements = newAchievements;


    // --- State & API Updates ---
    setProgressData(updatedProgressData);
    updateActiveUserProfile(profileUpdates);
    
    const newAllProgressData = { ...allProgressData, [id]: updatedProgressData };
    await apiService.saveAllProgress(newAllProgressData);

  }, [activeProfile, progressData, awardXP, updateActiveUserProfile, awardAchievement, handleUpdateSingleTask, allProgressData]);
  
  const resetTopicProgress = useCallback(async (topicId: string) => {
    if (!activeProfile) return;
    const { id } = activeProfile;
    
    const currentUserProgress = { ...(allProgressData[id] || {}) };
    if (!currentUserProgress[topicId]) {
      return; // Nothing to reset
    }

    delete currentUserProgress[topicId];
    
    const updatedAllProgress = { ...allProgressData, [id]: currentUserProgress };
    
    // No need for separate optimistic update here, as it's part of the global state now
    try {
      await apiService.saveAllProgress(updatedAllProgress);
    } catch (e) {
      console.error("Failed to reset topic progress:", e);
      // Revert would happen via the global state refetch from eventBus
    }
  }, [activeProfile, allProgressData]);

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
    
    const newAllProgressData = { ...allProgressData, [activeProfile.id]: updatedProgress };
    await apiService.saveAllProgress(newAllProgressData);
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
    
    const now = new Date();
    const newItems: UserFlashcardItem[] = flashcards.map(card => ({
        card,
        srsData: initFsrsCard(now) // Initialize with FSRS defaults
    }));
    
    const updatedFlashcards: UserFlashcards = {
        ...userFlashcards,
        [chapterId]: newItems
    };
    setUserFlashcards(updatedFlashcards); // Optimistic update
    
    const newAllFlashcards = { ...allFlashcards, [activeProfile.id]: updatedFlashcards };
    await apiService.saveAllFlashcards(newAllFlashcards);
  };

  const gradeFlashcard = useCallback(async (chapterId: string, cardIndex: number, rating: 1 | 2 | 3 | 4) => {
      if (!activeProfile) return;
      
      const deck = userFlashcards[chapterId];
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
        ...userFlashcards,
        [chapterId]: updatedDeck
      };
      
      setUserFlashcards(updatedFlashcards); // Optimistic

      const newAllFlashcards = { ...allFlashcards, [activeProfile.id]: updatedFlashcards };
      await apiService.saveAllFlashcards(newAllFlashcards);

  }, [activeProfile, userFlashcards, awardXP, allFlashcards]);

  const updateTopicStep = useCallback(async (topicId: string, step: number) => {
    if (!activeProfile) return;

    const { id } = activeProfile;
    const oldProgress = { ...progressData };
    const currentTopicProgress = oldProgress[topicId] || { status: 'started' };

    // Avoid saving if nothing changed
    if (currentTopicProgress.currentStep === step) return;

    const updatedProgress: UserProgressData = {
      ...oldProgress,
      [topicId]: { ...currentTopicProgress, currentStep: step }
    };

    setProgressData(updatedProgress); // Optimistic update
    
    const newAllProgressData = { ...allProgressData, [id]: updatedProgress };
    await apiService.saveAllProgress(newAllProgressData);

  }, [activeProfile, progressData, allProgressData]);


  const value = {
    progressData,
    userFlashcards,
    userDktData,
    newAchievement,
    todayTasks,
    startTopic,
    markTopicAsCompleted,
    resetTopicProgress,
    handleSrsSessionCompleted,
    handleSetDueDate,
    handleSaveManualTask,
    handleSaveFlashcards,
    clearNewAchievement,
    awardXP,
    gradeFlashcard,
    recordAnswer,
    updateTopicStep,
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
