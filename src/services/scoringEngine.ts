/**
 * Success Score Engine
 * Computes transparent, explainable 0-100 student success score with proportional weight renormalization
 * when components are missing, and flags provisional scores.
 */

import { Student, ScoringWeights, SuccessScoreBreakdown, ComponentBreakdown } from '../types';

export const DEFAULT_WEIGHTS: ScoringWeights = {
  academics: 30,
  attendance: 20,
  lms: 10,
  campus: 10,
  placement: 20,
  skills: 10,
};

export function validateWeights(weights: ScoringWeights): { isValid: boolean; error?: string } {
  const values = Object.values(weights);
  for (const v of values) {
    if (typeof v !== 'number' || isNaN(v) || v < 0) {
      return { isValid: false, error: 'All weights must be non-negative numbers.' };
    }
  }
  const sum = Math.round(values.reduce((acc, curr) => acc + curr, 0) * 100) / 100;
  if (Math.abs(sum - 100) > 0.1) {
    return { isValid: false, error: `Weights must sum to 100%. Current sum: ${sum}%.` };
  }
  return { isValid: true };
}

export function computeComponentNormalized(
  student: Partial<Student>
): {
  academics: { raw: number | null; normalized: number | null; available: boolean; unit: string; description: string };
  attendance: { raw: number | null; normalized: number | null; available: boolean; unit: string; description: string };
  lms: { raw: number | null; normalized: number | null; available: boolean; unit: string; description: string };
  campus: { raw: number | null; normalized: number | null; available: boolean; unit: string; description: string };
  placement: { raw: number | null; normalized: number | null; available: boolean; unit: string; description: string };
  skills: { raw: number | null; normalized: number | null; available: boolean; unit: string; description: string };
} {
  // 1. Academics: CGPA (0.0 to 10.0) -> scaled by 10 (0 to 100)
  const hasAcademic = student.cgpa !== null && student.cgpa !== undefined && !isNaN(student.cgpa);
  const academicRaw = hasAcademic ? Number(student.cgpa) : null;
  const academicNorm = hasAcademic ? Math.min(100, Math.max(0, Math.round(Number(student.cgpa) * 10 * 10) / 10)) : null;

  // 2. Attendance: direct 0 to 100%
  const hasAttendance = student.attendance !== null && student.attendance !== undefined && !isNaN(student.attendance);
  const attendanceRaw = hasAttendance ? Number(student.attendance) : null;
  const attendanceNorm = hasAttendance ? Math.min(100, Math.max(0, Math.round(Number(student.attendance) * 10) / 10)) : null;

  // 3. LMS Engagement: Logins (30%), Assignments (40%), Video watch (30%)
  const hasLms =
    (student.lmsLoginsPerWeek !== null && student.lmsLoginsPerWeek !== undefined) ||
    (student.assignmentCompletionRate !== null && student.assignmentCompletionRate !== undefined);
  let lmsNorm: number | null = null;
  let lmsRaw: number | null = null;
  if (hasLms) {
    const logins = student.lmsLoginsPerWeek ?? 4;
    const loginsScore = Math.min(100, (logins / 14) * 100);
    const assignScore = student.assignmentCompletionRate ?? 50;
    const videoScore = student.videoWatchPercentage ?? 50;
    lmsNorm = Math.min(100, Math.max(0, Math.round((loginsScore * 0.3 + assignScore * 0.4 + videoScore * 0.3) * 10) / 10));
    lmsRaw = lmsNorm;
  }

  // 4. Campus Engagement: Clubs (20pts each, up to 40), Events (12pts each, up to 36), Leadership (24pts)
  const hasCampus =
    student.clubParticipationCount !== null &&
    student.clubParticipationCount !== undefined &&
    student.eventParticipationCount !== null &&
    student.eventParticipationCount !== undefined;
  let campusNorm: number | null = null;
  let campusRaw: number | null = null;
  if (hasCampus) {
    const clubs = (student.clubParticipationCount ?? 0) * 20;
    const events = (student.eventParticipationCount ?? 0) * 12;
    const leadership = student.hasLeadershipRole ? 25 : 0;
    const sports = student.sportsOrCultural ? 15 : 0;
    campusNorm = Math.min(100, Math.max(0, Math.round((clubs + events + leadership + sports) * 10) / 10));
    campusRaw = campusNorm;
  }

  // 5. Placement Readiness: Coding (35%), Aptitude (25%), Mock Interview (25%), Resume (15%)
  const hasPlacement =
    (student.codingScore !== null && student.codingScore !== undefined) ||
    (student.aptitudeScore !== null && student.aptitudeScore !== undefined);
  let placementNorm: number | null = null;
  let placementRaw: number | null = null;
  if (hasPlacement) {
    const coding = student.codingScore ?? 50;
    const aptitude = student.aptitudeScore ?? 50;
    const interview = student.mockInterviewScore ?? 50;
    const resume = student.resumeScore ?? 50;
    placementNorm = Math.min(
      100,
      Math.max(0, Math.round((coding * 0.35 + aptitude * 0.25 + interview * 0.25 + resume * 0.15) * 10) / 10)
    );
    placementRaw = placementNorm;
  }

  // 6. Skills Assessment: Technical (60%), Soft Skills (40%) scaled 0-10 -> 0-100
  const hasSkills =
    (student.technicalSkill !== null && student.technicalSkill !== undefined) ||
    (student.softSkill !== null && student.softSkill !== undefined);
  let skillsNorm: number | null = null;
  let skillsRaw: number | null = null;
  if (hasSkills) {
    const tech = (student.technicalSkill ?? 5) * 10;
    const soft = (student.softSkill ?? 5) * 10;
    skillsNorm = Math.min(100, Math.max(0, Math.round((tech * 0.6 + soft * 0.4) * 10) / 10));
    skillsRaw = skillsNorm;
  }

  return {
    academics: {
      raw: academicRaw,
      normalized: academicNorm,
      available: hasAcademic,
      unit: 'CGPA',
      description: 'Normalized as (CGPA / 10) × 100',
    },
    attendance: {
      raw: attendanceRaw,
      normalized: attendanceNorm,
      available: hasAttendance,
      unit: '%',
      description: 'Direct classroom and lab attendance percentage',
    },
    lms: {
      raw: lmsRaw,
      normalized: lmsNorm,
      available: hasLms,
      unit: 'Score',
      description: '30% Login frequency + 40% Assignment rate + 30% Video watch',
    },
    campus: {
      raw: campusRaw,
      normalized: campusNorm,
      available: hasCampus,
      unit: 'Score',
      description: 'Clubs (20pts ea), Events (12pts ea), Leadership (+25pts), Sports (+15pts)',
    },
    placement: {
      raw: placementRaw,
      normalized: placementNorm,
      available: hasPlacement,
      unit: 'Score',
      description: '35% Coding + 25% Aptitude + 25% Mock Interview + 15% Resume',
    },
    skills: {
      raw: skillsRaw,
      normalized: skillsNorm,
      available: hasSkills,
      unit: 'Score',
      description: '60% Technical competency (0-10×10) + 40% Soft skills (0-10×10)',
    },
  };
}

export function computeSuccessScore(
  student: Partial<Student>,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): {
  successScore: number;
  breakdown: SuccessScoreBreakdown;
  dataCompleteness: number;
  isProvisional: boolean;
} {
  const normData = computeComponentNormalized(student);
  const keys: Array<keyof ScoringWeights> = ['academics', 'attendance', 'lms', 'campus', 'placement', 'skills'];

  let availableWeightSum = 0;
  let availableCount = 0;

  for (const k of keys) {
    if (normData[k].available && normData[k].normalized !== null) {
      availableWeightSum += weights[k];
      availableCount += 1;
    }
  }

  const dataCompleteness = Math.round((availableCount / keys.length) * 100);
  const isProvisional = dataCompleteness < 85;

  let totalScore = 0;
  const breakdown: any = {};

  for (const k of keys) {
    const comp = normData[k];
    const nominalWeight = weights[k];
    let effectiveWeight = 0;
    let contribution = 0;

    if (comp.available && comp.normalized !== null && availableWeightSum > 0) {
      // Renormalize available weights proportionally so they sum to 100%
      effectiveWeight = Math.round(((nominalWeight / availableWeightSum) * 100) * 10) / 10;
      contribution = Math.round((comp.normalized * (effectiveWeight / 100)) * 10) / 10;
      totalScore += contribution;
    }

    breakdown[k] = {
      raw: comp.raw,
      normalized: comp.normalized,
      weight: nominalWeight,
      effectiveWeight,
      contribution,
      available: comp.available,
      unit: comp.unit,
      description: comp.description,
    };
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(totalScore * 10) / 10));

  return {
    successScore: finalScore,
    breakdown: breakdown as SuccessScoreBreakdown,
    dataCompleteness,
    isProvisional,
  };
}
