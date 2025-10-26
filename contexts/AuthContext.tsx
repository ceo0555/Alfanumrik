import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserProfile, UserRole, AllProgressData, AllFlashcardsData, AllBktData, Assignment, Announcement, StudentSubmission } from '../types';
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

  // Handlers
  handleSetRole: (role: UserRole | null) => void;
  handleSaveUser: (userData: { name: string; grade: string } | { name: string; grade: string }[], id?: number) => void;
  handleSwitchUser: (id: number) => void;
  updateActiveUserProfile: (updates: Partial<UserProfile>) => void;
  handleSaveAllBktData: (bktData: AllBktData) => void; // For StudentDataContext to persist BKT updates
  handleCreateAssignment: (assignmentData: Omit<Assignment, 'id'>) => void;
  handleCreateAnnouncement: (announcementData: Omit<Announcement, 'id' | 'date'>) => void;
  handleSaveSubmission: (submission: Omit<StudentSubmission, 'id'>) => void;
  handleUpdateSubmission: (submission: StudentSubmission) => void;
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
        if (role !== 'student' || userProfiles.length > 1) {
            handleSwitchUser(0); // 0 signifies no active user, prompting selection
        } else if (role === 'student' && userProfiles.length === 1) {
            handleSwitchUser(userProfiles[0].id);
        }
    } catch (e) {
        console.error("Failed to set user role:", e);
    }
  };
  
  const handleSaveUser = async (userData: { name: string, grade: string } | { name: string, grade: string }[], idToEdit?: number) => {
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

  const handleCreateAssignment = async (assignmentData: Omit<Assignment, 'id'>) => {
    const newAssignment: Assignment = { ...assignmentData, id: Date.now().toString() };
    const updatedAssignments = [...allAssignments, newAssignment];
    setAllAssignments(updatedAssignments); // Optimistic update
    try {
        await apiService.saveAllAssignments(updatedAssignments);
    } catch (e) {
        console.error("Failed to save assignment", e);
        setAllAssignments(allAssignments); // Revert
    }
  };
  
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
    handleSetRole,
    handleSaveUser,
    handleSwitchUser,
    updateActiveUserProfile,
    handleSaveAllBktData,
    handleCreateAssignment: (assignmentData: Omit<Assignment, 'id'>) => handleCreateAssignment(assignmentData),
    handleCreateAnnouncement,
    handleSaveSubmission,
    handleUpdateSubmission,
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