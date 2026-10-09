/**
 * Central CampusPulse Application Context
 * Exposes active datasets, simulated role management, dynamic filters,
 * score recalculation triggers, and CRUD operations for students and interventions.
 * Fully integrated with Supabase PostgreSQL backend with zero-data-loss local persistence fallback.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Student,
  Intervention,
  ScoringWeights,
  RiskThresholds,
  UserRole,
  GlobalFilter,
  ExplainableInsight,
  CsvImportHistory,
} from '../types';
import { StorageService } from '../services/storageService';
import { validateWeights } from '../services/scoringEngine';
import { generateDatasetInsights } from '../services/analyticsEngine';
import { SupabaseService } from '../services/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';

interface AppContextType {
  students: Student[];
  filteredStudents: Student[];
  interventions: Intervention[];
  weights: ScoringWeights;
  thresholds: RiskThresholds;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  filters: GlobalFilter;
  setFilter: (key: keyof GlobalFilter, value: any) => void;
  setMultipleFilters: (updates: Partial<GlobalFilter>) => void;
  resetFilters: () => void;
  updateWeights: (newWeights: ScoringWeights) => { success: boolean; error?: string };
  updateThresholds: (newThresholds: RiskThresholds) => void;
  updateStudent: (student: Student) => Promise<void>;
  addStudent: (student: Student) => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;
  addIntervention: (interventionData: Omit<Intervention, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateIntervention: (intervention: Intervention) => Promise<void>;
  deleteIntervention: (id: string) => Promise<void>;
  addMentorFeedback: (
    studentId: string,
    note: string,
    category: 'Academic' | 'Attendance' | 'Behavioral' | 'Placement'
  ) => void;
  batchUpdateStudents: (updatedList: Student[], historyEntry?: CsvImportHistory) => Promise<{ cloudSuccess: boolean; cloudError?: string }>;
  resetAllDemoData: () => void;
  insights: ExplainableInsight[];
  importHistory: CsvImportHistory[];
  refreshImportHistory: () => void;

  // Supabase Cloud State & Sync
  cloudStatus: {
    isConfigured: boolean;
    isConnected: boolean;
    cloudStudentCount: number;
    isSyncing: boolean;
    lastSyncTime: string | null;
    syncError: string | null;
  };
  refreshCloudStatus: () => Promise<void>;
  syncWithCloud: () => Promise<{ success: boolean; message: string }>;

  stats: {
    totalStudents: number;
    avgSuccessScore: number;
    highAcademicRiskCount: number;
    medAcademicRiskCount: number;
    lowAcademicRiskCount: number;
    highPlacementRiskCount: number;
    avgAttendance: number;
    avgCgpa: number;
    interventionCompletionRate: number;
    pendingInterventionsCount: number;
  };
}

const DEFAULT_FILTERS: GlobalFilter = {
  department: 'ALL',
  year: 'ALL',
  semester: 'ALL',
  academicRisk: 'ALL',
  placementRisk: 'ALL',
  search: '',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // CRITICAL REQUIREMENT: Initialize from local storage first so local records are preserved
  const [students, setStudents] = useState<Student[]>(() => StorageService.getStudents());
  const [interventions, setInterventions] = useState<Intervention[]>(() => StorageService.getInterventions());
  const [weights, setWeights] = useState<ScoringWeights>(() => StorageService.getWeights());
  const [thresholds, setThresholds] = useState<RiskThresholds>(() => StorageService.getThresholds());
  const [activeRole, setActiveRoleState] = useState<UserRole>(() => StorageService.getActiveRole());
  const [filters, setFilters] = useState<GlobalFilter>(DEFAULT_FILTERS);
  const [importHistory, setImportHistory] = useState<CsvImportHistory[]>(() => StorageService.getImportHistory());

  // Cloud Status State
  const [cloudStatus, setCloudStatus] = useState({
    isConfigured: isSupabaseConfigured(),
    isConnected: false,
    cloudStudentCount: 0,
    isSyncing: false,
    lastSyncTime: null as string | null,
    syncError: null as string | null,
  });

  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    StorageService.saveActiveRole(role);
  };

  const setFilter = (key: keyof GlobalFilter, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const setMultipleFilters = (updates: Partial<GlobalFilter>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Refresh Cloud Connection Status
  const refreshCloudStatus = useCallback(async () => {
    const configured = isSupabaseConfigured();
    if (!configured) {
      setCloudStatus((prev) => ({
        ...prev,
        isConfigured: false,
        isConnected: false,
        cloudStudentCount: 0,
        syncError: null,
      }));
      return;
    }

    try {
      const conn = await SupabaseService.checkConnection();
      setCloudStatus((prev) => ({
        ...prev,
        isConfigured: true,
        isConnected: conn.connected && conn.tableExists,
        cloudStudentCount: conn.count,
        syncError: conn.error || null,
      }));
    } catch (err: any) {
      setCloudStatus((prev) => ({
        ...prev,
        isConnected: false,
        syncError: err?.message || 'Connection check failed',
      }));
    }
  }, []);

  // Check cloud status on mount
  useEffect(() => {
    refreshCloudStatus();
  }, [refreshCloudStatus]);

  // Safely pull from Cloud ONLY when Cloud has verified records
  const syncWithCloud = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    setCloudStatus((prev) => ({ ...prev, isSyncing: true, syncError: null }));

    try {
      const { students: cloudRecords, error } = await SupabaseService.fetchStudents();
      if (error) {
        setCloudStatus((prev) => ({ ...prev, isSyncing: false, syncError: error }));
        return { success: false, message: `Cloud fetch failed: ${error}` };
      }

      // CRITICAL REQUIREMENT: Never replace local records with an empty response!
      if (!cloudRecords || cloudRecords.length === 0) {
        setCloudStatus((prev) => ({
          ...prev,
          isSyncing: false,
          cloudStudentCount: 0,
          syncError: 'Cloud database has 0 records. Preserving local records.',
        }));
        return {
          success: false,
          message: 'Supabase table contains 0 records. Preserved local dataset to prevent data loss. Use Migration to upload local records.',
        };
      }

      // Merge cloud records with local records by student ID
      const localMap = new Map(students.map((s) => [s.id, s]));
      cloudRecords.forEach((cs) => {
        localMap.set(cs.id, cs);
      });
      const merged = Array.from(localMap.values());

      const recalculated = StorageService.recalculateAllStudents(merged, weights, thresholds);
      setStudents(recalculated);
      StorageService.saveStudents(recalculated);

      const now = new Date().toLocaleTimeString();
      setCloudStatus((prev) => ({
        ...prev,
        isSyncing: false,
        cloudStudentCount: cloudRecords.length,
        lastSyncTime: now,
        syncError: null,
      }));

      return {
        success: true,
        message: `Successfully synchronized ${cloudRecords.length} student records from Supabase!`,
      };
    } catch (err: any) {
      const msg = err?.message || 'Unexpected sync error';
      setCloudStatus((prev) => ({ ...prev, isSyncing: false, syncError: msg }));
      return { success: false, message: msg };
    }
  }, [students, weights, thresholds]);

  // Filtered Students Calculation
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (filters.department !== 'ALL' && s.department !== filters.department) return false;
      if (filters.year !== 'ALL' && s.year !== Number(filters.year)) return false;
      if (filters.semester !== 'ALL' && s.semester !== Number(filters.semester)) return false;
      if (filters.academicRisk !== 'ALL' && s.academicRisk !== filters.academicRisk) return false;
      if (filters.placementRisk !== 'ALL' && s.placementRisk !== filters.placementRisk) return false;
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const matchId = s.id.toLowerCase().includes(q);
        const matchName = s.name.toLowerCase().includes(q);
        const matchDept = s.department.toLowerCase().includes(q);
        const matchMentor = s.mentorName.toLowerCase().includes(q);
        if (!matchId && !matchName && !matchDept && !matchMentor) return false;
      }
      return true;
    });
  }, [students, filters]);

  // Derived KPI Stats
  const stats = useMemo(() => {
    const total = filteredStudents.length;
    if (total === 0) {
      return {
        totalStudents: 0,
        avgSuccessScore: 0,
        highAcademicRiskCount: 0,
        medAcademicRiskCount: 0,
        lowAcademicRiskCount: 0,
        highPlacementRiskCount: 0,
        avgAttendance: 0,
        avgCgpa: 0,
        interventionCompletionRate: 0,
        pendingInterventionsCount: 0,
      };
    }

    const totalSuccess = filteredStudents.reduce((acc, s) => acc + s.successScore, 0);
    const highRisk = filteredStudents.filter((s) => s.academicRisk === 'High').length;
    const medRisk = filteredStudents.filter((s) => s.academicRisk === 'Medium').length;
    const lowRisk = filteredStudents.filter((s) => s.academicRisk === 'Low').length;
    const highPlaceRisk = filteredStudents.filter((s) => s.placementRisk === 'High').length;

    const attStudents = filteredStudents.filter((s) => s.attendance !== null);
    const avgAttendance = attStudents.length > 0
      ? Math.round((attStudents.reduce((acc, s) => acc + (s.attendance ?? 0), 0) / attStudents.length) * 10) / 10
      : 0;

    const cgpaStudents = filteredStudents.filter((s) => s.cgpa !== null);
    const avgCgpa = cgpaStudents.length > 0
      ? Math.round((cgpaStudents.reduce((acc, s) => acc + (s.cgpa ?? 0), 0) / cgpaStudents.length) * 100) / 100
      : 0;

    const totalInterventions = interventions.length;
    const completedInterventions = interventions.filter((i) => i.status === 'Completed').length;
    const pendingCount = interventions.filter((i) => i.status !== 'Completed').length;
    const completionRate =
      totalInterventions > 0 ? Math.round((completedInterventions / totalInterventions) * 100) : 0;

    return {
      totalStudents: total,
      avgSuccessScore: Math.round((totalSuccess / total) * 10) / 10,
      highAcademicRiskCount: highRisk,
      medAcademicRiskCount: medRisk,
      lowAcademicRiskCount: lowRisk,
      highPlacementRiskCount: highPlaceRisk,
      avgAttendance,
      avgCgpa,
      interventionCompletionRate: completionRate,
      pendingInterventionsCount: pendingCount,
    };
  }, [filteredStudents, interventions]);

  // Deterministic local explainable insights
  const insights = useMemo(() => {
    return generateDatasetInsights(filteredStudents, interventions);
  }, [filteredStudents, interventions]);

  // Update weights & recalculate immediately
  const updateWeights = useCallback(
    (newWeights: ScoringWeights): { success: boolean; error?: string } => {
      const validation = validateWeights(newWeights);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }
      setWeights(newWeights);
      StorageService.saveWeights(newWeights);

      const recalculated = StorageService.recalculateAllStudents(students, newWeights, thresholds);
      setStudents(recalculated);
      StorageService.saveStudents(recalculated);
      return { success: true };
    },
    [students, thresholds]
  );

  // Update thresholds & recalculate
  const updateThresholds = useCallback(
    (newThresholds: RiskThresholds) => {
      setThresholds(newThresholds);
      StorageService.saveThresholds(newThresholds);

      const recalculated = StorageService.recalculateAllStudents(students, weights, newThresholds);
      setStudents(recalculated);
      StorageService.saveStudents(recalculated);
    },
    [students, weights]
  );

  // Single student update
  const updateStudent = useCallback(
    async (updated: Student) => {
      const updatedList = students.map((s) => (s.id === updated.id ? updated : s));
      const recalculated = StorageService.recalculateAllStudents(updatedList, weights, thresholds);
      setStudents(recalculated);
      StorageService.saveStudents(recalculated);

      // Asynchronously update Supabase in background if configured
      if (cloudStatus.isConnected) {
        const fullUpdated = recalculated.find((s) => s.id === updated.id) || updated;
        SupabaseService.upsertStudent(fullUpdated).catch((err) => {
          console.warn('Background Supabase student update failed:', err);
        });
      }
    },
    [students, weights, thresholds, cloudStatus.isConnected]
  );

  // Add new student
  const addStudent = useCallback(
    async (newStudent: Student) => {
      const updatedList = [newStudent, ...students];
      const recalculated = StorageService.recalculateAllStudents(updatedList, weights, thresholds);
      setStudents(recalculated);
      StorageService.saveStudents(recalculated);

      // Asynchronously insert to Supabase if configured
      if (cloudStatus.isConnected) {
        const fullCreated = recalculated.find((s) => s.id === newStudent.id) || newStudent;
        SupabaseService.upsertStudent(fullCreated).then(() => {
          refreshCloudStatus();
        }).catch((err) => {
          console.warn('Background Supabase student insert failed:', err);
        });
      }
    },
    [students, weights, thresholds, cloudStatus.isConnected, refreshCloudStatus]
  );

  // Delete student
  const deleteStudent = useCallback(
    async (studentId: string) => {
      const updatedList = students.filter((s) => s.id !== studentId);
      setStudents(updatedList);
      StorageService.saveStudents(updatedList);

      // Asynchronously delete from Supabase if configured
      if (cloudStatus.isConnected) {
        SupabaseService.deleteStudent(studentId).then(() => {
          refreshCloudStatus();
        }).catch((err) => {
          console.warn('Background Supabase student deletion failed:', err);
        });
      }
    },
    [students, cloudStatus.isConnected, refreshCloudStatus]
  );

  // Add Mentor Feedback note
  const addMentorFeedback = useCallback(
    (studentId: string, note: string, category: 'Academic' | 'Attendance' | 'Behavioral' | 'Placement') => {
      const student = students.find((s) => s.id === studentId);
      if (!student) return;

      const newNote = {
        id: `fb-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        mentor: activeRole === 'admin' ? 'System Administrator' : student.mentorName || 'Faculty Mentor',
        note,
        category,
      };

      const updatedStudent = {
        ...student,
        mentorFeedback: [newNote, ...student.mentorFeedback],
      };
      updateStudent(updatedStudent);
    },
    [students, activeRole, updateStudent]
  );

  // Batch update (from CSV import)
  const batchUpdateStudents = useCallback(
    async (updatedList: Student[], historyEntry?: CsvImportHistory): Promise<{ cloudSuccess: boolean; cloudError?: string }> => {
      const recalculated = StorageService.recalculateAllStudents(updatedList, weights, thresholds);
      setStudents(recalculated);
      StorageService.saveStudents(recalculated);
      if (historyEntry) {
        StorageService.addImportHistory(historyEntry);
        setImportHistory(StorageService.getImportHistory());
      }

      // If Supabase is connected, sync batch to cloud
      if (cloudStatus.isConnected) {
        try {
          const res = await SupabaseService.batchUpsertStudents(recalculated);
          refreshCloudStatus();
          if (res.failedCount > 0) {
            return {
              cloudSuccess: false,
              cloudError: `Saved locally, but ${res.failedCount} records failed to sync to Supabase: ${res.errors.join('; ')}`,
            };
          }
          return { cloudSuccess: true };
        } catch (err: any) {
          return {
            cloudSuccess: false,
            cloudError: err?.message || 'Failed to sync batch to Supabase',
          };
        }
      }

      return { cloudSuccess: true };
    },
    [weights, thresholds, cloudStatus.isConnected, refreshCloudStatus]
  );

  // Interventions CRUD
  const addIntervention = useCallback(
    async (data: Omit<Intervention, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString().split('T')[0];
      const newIntervention: Intervention = {
        ...data,
        id: `int-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      const updated = [newIntervention, ...interventions];
      setInterventions(updated);
      StorageService.saveInterventions(updated);

      if (cloudStatus.isConnected) {
        SupabaseService.upsertIntervention(newIntervention).catch((e) => {
          console.warn('Background Supabase intervention creation failed:', e);
        });
      }
    },
    [interventions, cloudStatus.isConnected]
  );

  const updateIntervention = useCallback(
    async (updatedItem: Intervention) => {
      const now = new Date().toISOString().split('T')[0];
      const updated = interventions.map((item) =>
        item.id === updatedItem.id ? { ...updatedItem, updatedAt: now } : item
      );
      setInterventions(updated);
      StorageService.saveInterventions(updated);

      if (cloudStatus.isConnected) {
        SupabaseService.upsertIntervention(updatedItem).catch((e) => {
          console.warn('Background Supabase intervention update failed:', e);
        });
      }
    },
    [interventions, cloudStatus.isConnected]
  );

  const deleteIntervention = useCallback(
    async (id: string) => {
      const updated = interventions.filter((item) => item.id !== id);
      setInterventions(updated);
      StorageService.saveInterventions(updated);

      if (cloudStatus.isConnected) {
        SupabaseService.deleteIntervention(id).catch((e) => {
          console.warn('Background Supabase intervention delete failed:', e);
        });
      }
    },
    [interventions, cloudStatus.isConnected]
  );

  const resetAllDemoData = useCallback(() => {
    const res = StorageService.resetDemoData();
    setStudents(res.students);
    setInterventions(res.interventions);
    setWeights(res.weights);
    setThresholds(res.thresholds);
    setFilters(DEFAULT_FILTERS);
    setImportHistory(StorageService.getImportHistory());
  }, []);

  const refreshImportHistory = useCallback(() => {
    setImportHistory(StorageService.getImportHistory());
  }, []);

  return (
    <AppContext.Provider
      value={{
        students,
        filteredStudents,
        interventions,
        weights,
        thresholds,
        activeRole,
        setActiveRole,
        filters,
        setFilter,
        setMultipleFilters,
        resetFilters,
        updateWeights,
        updateThresholds,
        updateStudent,
        addStudent,
        deleteStudent,
        addIntervention,
        updateIntervention,
        deleteIntervention,
        addMentorFeedback,
        batchUpdateStudents,
        resetAllDemoData,
        insights,
        importHistory,
        refreshImportHistory,
        cloudStatus,
        refreshCloudStatus,
        syncWithCloud,
        stats,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
