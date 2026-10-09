/**
 * Risk Engine
 * Computes deterministic, rule-based Academic and Placement Risk levels independently.
 * Emits transparent reasons with exact indicator values and thresholds.
 */

import { Student, RiskThresholds, AcademicRiskLevel, PlacementRiskLevel } from '../types';

export const DEFAULT_RISK_THRESHOLDS: RiskThresholds = {
  academicHighAttendance: 65,
  academicHighCgpa: 5.0,
  academicHighBacklogs: 3,
  academicMedAttendance: 75,
  academicMedCgpa: 6.0,
  academicMedBacklogs: 1,
  placementHighCutoff: 40,
  placementMedCutoff: 60,
};

export interface RiskAnalysisResult {
  academicRisk: AcademicRiskLevel;
  academicRiskReasons: string[];
  placementReadinessScore: number | null;
  placementRisk: PlacementRiskLevel;
  placementRiskReasons: string[];
}

export function evaluateRisks(
  student: Partial<Student>,
  thresholds: RiskThresholds = DEFAULT_RISK_THRESHOLDS
): RiskAnalysisResult {
  // 1. Evaluate Academic Risk
  const hasCgpa = student.cgpa !== null && student.cgpa !== undefined && !isNaN(student.cgpa);
  const hasAttendance = student.attendance !== null && student.attendance !== undefined && !isNaN(student.attendance);

  let academicRisk: AcademicRiskLevel = 'Low';
  const academicReasons: string[] = [];

  if (!hasCgpa && !hasAttendance) {
    academicRisk = 'Insufficient Data';
    academicReasons.push('Critical academic records (CGPA & Attendance) are missing from active dataset.');
  } else {
    const cgpa = student.cgpa ?? 0;
    const attendance = student.attendance ?? 0;
    const backlogs = student.backlogs ?? 0;
    const prevCgpa = student.prevCgpa;
    const cgpaDrop = prevCgpa && prevCgpa > cgpa ? Math.round((prevCgpa - cgpa) * 100) / 100 : 0;

    // High Academic Risk triggers
    const highTriggers: string[] = [];
    if (hasAttendance && attendance < thresholds.academicHighAttendance) {
      highTriggers.push(`Attendance is ${attendance}% (Threshold: < ${thresholds.academicHighAttendance}%)`);
    }
    if (hasCgpa && cgpa < thresholds.academicHighCgpa) {
      highTriggers.push(`CGPA is ${cgpa.toFixed(2)} (Threshold: < ${thresholds.academicHighCgpa.toFixed(1)})`);
    }
    if (backlogs >= thresholds.academicHighBacklogs) {
      highTriggers.push(`Active backlogs: ${backlogs} (Threshold: ≥ ${thresholds.academicHighBacklogs})`);
    }

    if (highTriggers.length > 0) {
      academicRisk = 'High';
      academicReasons.push(...highTriggers);
    } else {
      // Medium Academic Risk triggers
      const medTriggers: string[] = [];
      if (hasAttendance && attendance < thresholds.academicMedAttendance) {
        medTriggers.push(`Attendance is ${attendance}% (Warning threshold: < ${thresholds.academicMedAttendance}%)`);
      }
      if (hasCgpa && cgpa < thresholds.academicMedCgpa) {
        medTriggers.push(`CGPA is ${cgpa.toFixed(2)} (Warning threshold: < ${thresholds.academicMedCgpa.toFixed(1)})`);
      }
      if (backlogs >= thresholds.academicMedBacklogs) {
        medTriggers.push(`Active backlogs: ${backlogs} (Warning threshold: ≥ ${thresholds.academicMedBacklogs})`);
      }
      if (cgpaDrop >= 0.5) {
        medTriggers.push(`Meaningful academic decline: CGPA dropped by ${cgpaDrop.toFixed(2)} points from previous semester`);
      }

      if (medTriggers.length > 0) {
        academicRisk = 'Medium';
        academicReasons.push(...medTriggers);
      } else {
        academicRisk = 'Low';
        academicReasons.push('Metrics meet or exceed all foundational academic and attendance thresholds.');
      }
    }
  }

  // 2. Evaluate Placement Risk
  const hasCoding = student.codingScore !== null && student.codingScore !== undefined;
  const hasAptitude = student.aptitudeScore !== null && student.aptitudeScore !== undefined;
  const hasInterview = student.mockInterviewScore !== null && student.mockInterviewScore !== undefined;
  const hasResume = student.resumeScore !== null && student.resumeScore !== undefined;

  let placementReadinessScore: number | null = null;
  let placementRisk: PlacementRiskLevel = 'Low';
  const placementReasons: string[] = [];

  if (!hasCoding && !hasAptitude && !hasInterview && !hasResume) {
    placementRisk = 'Insufficient Data';
    placementReasons.push('No placement assessment scores (Aptitude, Coding, Interview, Resume) recorded.');
  } else {
    // Composite placement score: 35% Coding + 25% Aptitude + 25% Mock Interview + 15% Resume
    const coding = student.codingScore ?? 50;
    const aptitude = student.aptitudeScore ?? 50;
    const interview = student.mockInterviewScore ?? 50;
    const resume = student.resumeScore ?? 50;

    placementReadinessScore = Math.round((coding * 0.35 + aptitude * 0.25 + interview * 0.25 + resume * 0.15) * 10) / 10;

    if (placementReadinessScore < thresholds.placementHighCutoff) {
      placementRisk = 'High';
      placementReasons.push(`Placement readiness score is ${placementReadinessScore}/100 (Threshold: < ${thresholds.placementHighCutoff})`);
      if (coding < 45) placementReasons.push(`Technical coding score is low: ${coding}/100`);
      if (aptitude < 45) placementReasons.push(`Quantitative aptitude score is low: ${aptitude}/100`);
    } else if (placementReadinessScore < thresholds.placementMedCutoff) {
      placementRisk = 'Medium';
      placementReasons.push(`Placement readiness score is ${placementReadinessScore}/100 (Threshold: ${thresholds.placementHighCutoff} - ${thresholds.placementMedCutoff})`);
      if (coding < 55) placementReasons.push(`Technical coding score needs reinforcement: ${coding}/100`);
      if (interview < 55) placementReasons.push(`Mock interview performance needs practice: ${interview}/100`);
    } else {
      placementRisk = 'Low';
      placementReasons.push(`Strong placement readiness composite: ${placementReadinessScore}/100 (Threshold: ≥ ${thresholds.placementMedCutoff})`);
      if (student.internshipStatus === 'Completed') {
        placementReasons.push('Industry internship completed.');
      }
    }
  }

  return {
    academicRisk,
    academicRiskReasons: academicReasons,
    placementReadinessScore,
    placementRisk,
    placementRiskReasons: placementReasons,
  };
}
