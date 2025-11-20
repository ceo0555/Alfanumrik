import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { School, PerformanceMetrics } from '../types';

interface SchoolContextType {
  // State
  schools: School[];
  activeSchool: School | null;
  performanceMetrics: PerformanceMetrics | null;
  
  // Handlers
  setActiveSchool: (schoolId: string) => void;
  updateSchool: (schoolId: string, updates: Partial<School>) => void;
  addSchool: (school: Omit<School, 'id' | 'createdAt' | 'updatedAt'>) => void;
  loadPerformanceMetrics: () => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

// Mock schools for pilot
const MOCK_SCHOOLS: School[] = [
  {
    id: 'school-001',
    name: 'Greenwood International School',
    code: 'GIS',
    primaryColor: '#1e40af',
    secondaryColor: '#3b82f6',
    address: '123 Education Lane, Mumbai, Maharashtra 400001',
    contactEmail: 'admin@greenwood.edu',
    contactPhone: '+91-22-1234-5678',
    principalName: 'Dr. Priya Sharma',
    totalStudents: 5000,
    totalTeachers: 250,
    established: '1995',
    subscriptionTier: 'enterprise',
    subscriptionExpiry: '2025-12-31',
    isActive: true,
    settings: {
      allowParentAccess: true,
      enableAIFeatures: true,
      enableLMS: true,
      enableAssessments: true,
      maxStudentsPerClass: 40,
      academicYearStart: '2024-04-01',
      academicYearEnd: '2025-03-31',
      gradeSystem: 'percentage',
      attendanceRequired: true,
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-11-19T00:00:00Z',
  },
  {
    id: 'school-002',
    name: 'Delhi Public Academy',
    code: 'DPA',
    primaryColor: '#7c3aed',
    secondaryColor: '#a78bfa',
    address: '456 Knowledge Street, Delhi 110001',
    contactEmail: 'info@dpa.edu.in',
    contactPhone: '+91-11-9876-5432',
    principalName: 'Mr. Rajesh Kumar',
    totalStudents: 6000,
    totalTeachers: 300,
    established: '1988',
    subscriptionTier: 'enterprise',
    subscriptionExpiry: '2025-12-31',
    isActive: true,
    settings: {
      allowParentAccess: true,
      enableAIFeatures: true,
      enableLMS: true,
      enableAssessments: true,
      maxStudentsPerClass: 45,
      academicYearStart: '2024-04-01',
      academicYearEnd: '2025-03-31',
      gradeSystem: 'gpa',
      attendanceRequired: true,
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-11-19T00:00:00Z',
  },
  {
    id: 'school-003',
    name: 'Bangalore International Academy',
    code: 'BIA',
    primaryColor: '#059669',
    secondaryColor: '#10b981',
    address: '789 Tech Park Road, Bangalore, Karnataka 560001',
    contactEmail: 'contact@bia.edu',
    contactPhone: '+91-80-5555-7777',
    principalName: 'Ms. Ananya Reddy',
    totalStudents: 4500,
    totalTeachers: 200,
    established: '2005',
    subscriptionTier: 'premium',
    subscriptionExpiry: '2025-12-31',
    isActive: true,
    settings: {
      allowParentAccess: true,
      enableAIFeatures: true,
      enableLMS: true,
      enableAssessments: true,
      maxStudentsPerClass: 35,
      academicYearStart: '2024-06-01',
      academicYearEnd: '2025-05-31',
      gradeSystem: 'percentage',
      attendanceRequired: true,
    },
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-11-19T00:00:00Z',
  },
  {
    id: 'school-004',
    name: 'Chennai Central School',
    code: 'CCS',
    primaryColor: '#dc2626',
    secondaryColor: '#ef4444',
    address: '321 Marina Beach Road, Chennai, Tamil Nadu 600001',
    contactEmail: 'admin@ccs.edu',
    contactPhone: '+91-44-8888-9999',
    principalName: 'Dr. Suresh Narayanan',
    totalStudents: 5500,
    totalTeachers: 275,
    established: '1990',
    subscriptionTier: 'enterprise',
    subscriptionExpiry: '2025-12-31',
    isActive: true,
    settings: {
      allowParentAccess: true,
      enableAIFeatures: true,
      enableLMS: true,
      enableAssessments: true,
      maxStudentsPerClass: 40,
      academicYearStart: '2024-06-01',
      academicYearEnd: '2025-05-31',
      gradeSystem: 'percentage',
      attendanceRequired: true,
    },
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-11-19T00:00:00Z',
  },
  {
    id: 'school-005',
    name: 'Kolkata Modern High School',
    code: 'KMHS',
    primaryColor: '#ea580c',
    secondaryColor: '#f97316',
    address: '555 Park Street, Kolkata, West Bengal 700001',
    contactEmail: 'info@kmhs.edu',
    contactPhone: '+91-33-4444-6666',
    principalName: 'Mrs. Anjali Chatterjee',
    totalStudents: 4000,
    totalTeachers: 180,
    established: '2000',
    subscriptionTier: 'premium',
    subscriptionExpiry: '2025-12-31',
    isActive: true,
    settings: {
      allowParentAccess: true,
      enableAIFeatures: true,
      enableLMS: true,
      enableAssessments: true,
      maxStudentsPerClass: 38,
      academicYearStart: '2024-04-01',
      academicYearEnd: '2025-03-31',
      gradeSystem: 'percentage',
      attendanceRequired: true,
    },
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-11-19T00:00:00Z',
  },
  {
    id: 'school-006',
    name: 'Hyderabad Tech Academy',
    code: 'HTA',
    primaryColor: '#0891b2',
    secondaryColor: '#06b6d4',
    address: '888 Cyber City, Hyderabad, Telangana 500001',
    contactEmail: 'admin@hta.edu',
    contactPhone: '+91-40-7777-8888',
    principalName: 'Dr. Venkat Rao',
    totalStudents: 5200,
    totalTeachers: 260,
    established: '2010',
    subscriptionTier: 'enterprise',
    subscriptionExpiry: '2025-12-31',
    isActive: true,
    settings: {
      allowParentAccess: true,
      enableAIFeatures: true,
      enableLMS: true,
      enableAssessments: true,
      maxStudentsPerClass: 42,
      academicYearStart: '2024-06-01',
      academicYearEnd: '2025-05-31',
      gradeSystem: 'gpa',
      attendanceRequired: true,
    },
    createdAt: '2024-02-15T00:00:00Z',
    updatedAt: '2024-11-19T00:00:00Z',
  },
  {
    id: 'school-007',
    name: 'Pune International School',
    code: 'PIS',
    primaryColor: '#9333ea',
    secondaryColor: '#a855f7',
    address: '999 University Road, Pune, Maharashtra 411001',
    contactEmail: 'contact@pis.edu',
    contactPhone: '+91-20-3333-4444',
    principalName: 'Ms. Meera Joshi',
    totalStudents: 4800,
    totalTeachers: 240,
    established: '2008',
    subscriptionTier: 'premium',
    subscriptionExpiry: '2025-12-31',
    isActive: true,
    settings: {
      allowParentAccess: true,
      enableAIFeatures: true,
      enableLMS: true,
      enableAssessments: true,
      maxStudentsPerClass: 36,
      academicYearStart: '2024-06-01',
      academicYearEnd: '2025-05-31',
      gradeSystem: 'letter',
      attendanceRequired: true,
    },
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-11-19T00:00:00Z',
  },
  {
    id: 'school-008',
    name: 'Ahmedabad Global Academy',
    code: 'AGA',
    primaryColor: '#be123c',
    secondaryColor: '#e11d48',
    address: '777 Sabarmati Avenue, Ahmedabad, Gujarat 380001',
    contactEmail: 'info@aga.edu',
    contactPhone: '+91-79-6666-7777',
    principalName: 'Dr. Amit Patel',
    totalStudents: 5800,
    totalTeachers: 290,
    established: '1998',
    subscriptionTier: 'enterprise',
    subscriptionExpiry: '2025-12-31',
    isActive: true,
    settings: {
      allowParentAccess: true,
      enableAIFeatures: true,
      enableLMS: true,
      enableAssessments: true,
      maxStudentsPerClass: 44,
      academicYearStart: '2024-04-01',
      academicYearEnd: '2025-03-31',
      gradeSystem: 'percentage',
      attendanceRequired: true,
    },
    createdAt: '2024-03-15T00:00:00Z',
    updatedAt: '2024-11-19T00:00:00Z',
  },
  {
    id: 'school-009',
    name: 'Jaipur Royal School',
    code: 'JRS',
    primaryColor: '#ca8a04',
    secondaryColor: '#eab308',
    address: '444 Palace Road, Jaipur, Rajasthan 302001',
    contactEmail: 'admin@jrs.edu',
    contactPhone: '+91-141-5555-6666',
    principalName: 'Mrs. Kavita Singh',
    totalStudents: 4200,
    totalTeachers: 190,
    established: '2003',
    subscriptionTier: 'premium',
    subscriptionExpiry: '2025-12-31',
    isActive: true,
    settings: {
      allowParentAccess: true,
      enableAIFeatures: true,
      enableLMS: true,
      enableAssessments: true,
      maxStudentsPerClass: 34,
      academicYearStart: '2024-06-01',
      academicYearEnd: '2025-05-31',
      gradeSystem: 'percentage',
      attendanceRequired: true,
    },
    createdAt: '2024-04-01T00:00:00Z',
    updatedAt: '2024-11-19T00:00:00Z',
  },
  {
    id: 'school-010',
    name: 'Lucknow Central Academy',
    code: 'LCA',
    primaryColor: '#0f766e',
    secondaryColor: '#14b8a6',
    address: '222 Hazratganj, Lucknow, Uttar Pradesh 226001',
    contactEmail: 'contact@lca.edu',
    contactPhone: '+91-522-8888-9999',
    principalName: 'Dr. Ramesh Verma',
    totalStudents: 5100,
    totalTeachers: 255,
    established: '1992',
    subscriptionTier: 'enterprise',
    subscriptionExpiry: '2025-12-31',
    isActive: true,
    settings: {
      allowParentAccess: true,
      enableAIFeatures: true,
      enableLMS: true,
      enableAssessments: true,
      maxStudentsPerClass: 40,
      academicYearStart: '2024-04-01',
      academicYearEnd: '2025-03-31',
      gradeSystem: 'percentage',
      attendanceRequired: true,
    },
    createdAt: '2024-04-15T00:00:00Z',
    updatedAt: '2024-11-19T00:00:00Z',
  },
];

export const SchoolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [schools, setSchools] = useState<School[]>(MOCK_SCHOOLS);
  const [activeSchoolId, setActiveSchoolId] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);

  // Load active school from localStorage
  useEffect(() => {
    const savedSchoolId = localStorage.getItem('activeSchoolId');
    if (savedSchoolId && schools.find(s => s.id === savedSchoolId)) {
      setActiveSchoolId(savedSchoolId);
    } else if (schools.length > 0) {
      setActiveSchoolId(schools[0].id);
    }
  }, [schools]);

  // Save active school to localStorage
  useEffect(() => {
    if (activeSchoolId) {
      localStorage.setItem('activeSchoolId', activeSchoolId);
    }
  }, [activeSchoolId]);

  const activeSchool = schools.find(s => s.id === activeSchoolId) || null;

  const setActiveSchool = (schoolId: string) => {
    setActiveSchoolId(schoolId);
  };

  const updateSchool = (schoolId: string, updates: Partial<School>) => {
    setSchools(prev => prev.map(school =>
      school.id === schoolId
        ? { ...school, ...updates, updatedAt: new Date().toISOString() }
        : school
    ));
  };

  const addSchool = (schoolData: Omit<School, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSchool: School = {
      ...schoolData,
      id: `school-${String(schools.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSchools(prev => [...prev, newSchool]);
  };

  const loadPerformanceMetrics = () => {
    // Mock performance data
    const metrics: PerformanceMetrics = {
      activeUsers: Math.floor(Math.random() * 10000) + 5000,
      totalLogins: Math.floor(Math.random() * 50000) + 20000,
      avgSessionDuration: Math.floor(Math.random() * 30) + 15,
      apiResponseTime: Math.floor(Math.random() * 200) + 50,
      errorRate: Math.random() * 0.5,
      timestamp: new Date().toISOString(),
    };
    setPerformanceMetrics(metrics);
  };

  // Load initial metrics
  useEffect(() => {
    loadPerformanceMetrics();
    // Refresh metrics every 30 seconds
    const interval = setInterval(loadPerformanceMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SchoolContext.Provider
      value={{
        schools,
        activeSchool,
        performanceMetrics,
        setActiveSchool,
        updateSchool,
        addSchool,
        loadPerformanceMetrics,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = (): SchoolContextType => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
};
