/**
 * Local Storage Persistence Service
 * Manages reliable persistence of students, interventions, configuration weights,
 * thresholds, and import history with automatic score/risk re-evaluations.
 */

import { Student, Intervention, ScoringWeights, RiskThresholds, UserRole, CsvImportHistory } from '../types';
import { generateSeedStudents } from '../data/seedStudents';
import { SEED_INTERVENTIONS } from '../data/seedInterventions';
import { DEFAULT_WEIGHTS, computeSuccessScore } from './scoringEngine';
import { DEFAULT_RISK_THRESHOLDS, evaluateRisks } from './riskEngine';
import { evaluateStudentSegments } from './segmentationService';

const STORAGE_KEYS = {
  STUDENTS: 'campuspulse_students_v1',
  INTERVENTIONS: 'campuspulse_interventions_v1',
  WEIGHTS: 'campuspulse_weights_v1',
  THRESHOLDS: 'campuspulse_thresholds_v1',
  ROLE: 'campuspulse_active_role_v1',
  IMPORT_HISTORY: 'campuspulse_import_history_v1',
  ACADEMIC_YEAR: 'campuspulse_acad_year_v1',
  ACADEMIC_SEMESTER: 'campuspulse_acad_semester_v1',
};

export const StorageService = {
  getStudents(): Student[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to read students from localStorage, initializing seed data', e);
    }
    const initial = generateSeedStudents();
    this.saveStudents(initial);
    return initial;
  },

  saveStudents(students: Student[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } catch (e) {
      console.error('Failed to save students to localStorage', e);
    }
  },

  getInterventions(): Intervention[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INTERVENTIONS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to read interventions, using seeds', e);
    }
    this.saveInterventions(SEED_INTERVENTIONS);
    return SEED_INTERVENTIONS;
  },

  saveInterventions(interventions: Intervention[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.INTERVENTIONS, JSON.stringify(interventions));
    } catch (e) {
      console.error('Failed to save interventions', e);
    }
  },

  getWeights(): ScoringWeights {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WEIGHTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to read weights', e);
    }
    return DEFAULT_WEIGHTS;
  },

  saveWeights(weights: ScoringWeights): void {
    try {
      localStorage.setItem(STORAGE_KEYS.WEIGHTS, JSON.stringify(weights));
    } catch (e) {
      console.error('Failed to save weights', e);
    }
  },

  getThresholds(): RiskThresholds {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.THRESHOLDS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to read thresholds', e);
    }
    return DEFAULT_RISK_THRESHOLDS;
  },

  saveThresholds(thresholds: RiskThresholds): void {
    try {
      localStorage.setItem(STORAGE_KEYS.THRESHOLDS, JSON.stringify(thresholds));
    } catch (e) {
      console.error('Failed to save thresholds', e);
    }
  },

  getActiveRole(): UserRole {
    try {
      const role = localStorage.getItem(STORAGE_KEYS.ROLE);
      if (role === 'admin' || role === 'faculty' || role === 'placement') {
        return role;
      }
    } catch (e) {
      // fallback
    }
    return 'admin';
  },

  saveActiveRole(role: UserRole): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ROLE, role);
    } catch (e) {
      console.error('Failed to save active role', e);
    }
  },

  getImportHistory(): CsvImportHistory[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.IMPORT_HISTORY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load import history', e);
    }
    return [
      {
        id: 'hist-seed',
        timestamp: '2026-10-09 08:00',
        fileName: 'seed_campus_roster_125.csv',
        dataType: 'Full Comprehensive Roster',
        totalRows: 125,
        successfulRows: 125,
        failedRows: 0,
        errors: [],
      },
    ];
  },

  addImportHistory(entry: CsvImportHistory): void {
    try {
      const history = this.getImportHistory();
      const updated = [entry, ...history].slice(0, 30);
      localStorage.setItem(STORAGE_KEYS.IMPORT_HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to append import history', e);
    }
  },

  recalculateAllStudents(
    students: Student[],
    weights: ScoringWeights,
    thresholds: RiskThresholds
  ): Student[] {
    return students.map((student) => {
      const scoreRes = computeSuccessScore(student, weights);
      const riskRes = evaluateRisks(student, thresholds);

      const updated: Student = {
        ...student,
        successScore: scoreRes.successScore,
        successScoreBreakdown: scoreRes.breakdown,
        dataCompleteness: scoreRes.dataCompleteness,
        isProvisionalScore: scoreRes.isProvisional,
        academicRisk: riskRes.academicRisk,
        academicRiskReasons: riskRes.academicRiskReasons,
        placementReadinessScore: riskRes.placementReadinessScore,
        placementRisk: riskRes.placementRisk,
        placementRiskReasons: riskRes.placementRiskReasons,
        applicableSegments: [],
      };

      updated.applicableSegments = evaluateStudentSegments(updated);
      return updated;
    });
  },

  resetDemoData(): { students: Student[]; interventions: Intervention[]; weights: ScoringWeights; thresholds: RiskThresholds } {
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.INTERVENTIONS);
    localStorage.removeItem(STORAGE_KEYS.WEIGHTS);
    localStorage.removeItem(STORAGE_KEYS.THRESHOLDS);

    const freshStudents = generateSeedStudents();
    this.saveStudents(freshStudents);
    this.saveInterventions(SEED_INTERVENTIONS);
    this.saveWeights(DEFAULT_WEIGHTS);
    this.saveThresholds(DEFAULT_RISK_THRESHOLDS);

    return {
      students: freshStudents,
      interventions: SEED_INTERVENTIONS,
      weights: DEFAULT_WEIGHTS,
      thresholds: DEFAULT_RISK_THRESHOLDS,
    };
  },
};
