/**
 * Student Segmentation Service
 * Evaluates 8 distinct data-driven cohorts for targeted campus interventions.
 */

import { Student, SegmentDefinition } from '../types';

export const SEGMENT_DEFINITIONS: SegmentDefinition[] = [
  {
    id: 'high-acad-low-place',
    name: 'High Academics, Low Placement Readiness',
    category: 'Placement',
    description: 'Students excelling in university coursework but falling behind in technical interviews or coding assessments.',
    criteria: 'CGPA ≥ 7.50 AND Placement Readiness < 50',
    color: 'border-amber-500 text-amber-700 bg-amber-50',
  },
  {
    id: 'strong-place-weak-acad',
    name: 'Strong Placement Readiness, Weak Academics',
    category: 'Critical Support',
    description: 'Students with good coding and problem-solving skills who are at risk of campus drive disqualification due to low CGPA or backlogs.',
    criteria: 'Placement Readiness ≥ 70 AND CGPA < 6.50',
    color: 'border-orange-500 text-orange-700 bg-orange-50',
  },
  {
    id: 'low-att-acad-risk',
    name: 'Low Attendance & Academic Risk',
    category: 'Critical Support',
    description: 'Chronic absenteeism actively compounding coursework deficits and examination detention risk.',
    criteria: 'Attendance < 75% AND Academic Risk in [High, Medium]',
    color: 'border-red-500 text-red-700 bg-red-50',
  },
  {
    id: 'low-lms-engagement',
    name: 'Low LMS Engagement',
    category: 'Engagement',
    description: 'Students with minimal interaction on the learning management system, missing digital coursework submissions.',
    criteria: 'LMS Normalized Score < 50 / 100',
    color: 'border-purple-500 text-purple-700 bg-purple-50',
  },
  {
    id: 'high-pot-low-eng',
    name: 'High Potential, Low Campus Engagement',
    category: 'Engagement',
    description: 'Capable students who maintain solid CGPA but do not participate in collegiate clubs, technical fests, or campus activities.',
    criteria: 'CGPA ≥ 7.00 AND (Campus Engagement < 50 OR LMS < 50)',
    color: 'border-blue-500 text-blue-700 bg-blue-50',
  },
  {
    id: 'balanced-high-performers',
    name: 'Balanced High Performers',
    category: 'Excellence',
    description: 'Exemplary all-rounders with top grades, consistent attendance, and competitive placement metrics. Candidates for leadership and honors.',
    criteria: 'CGPA ≥ 8.00 AND Placement Readiness ≥ 75 AND Attendance ≥ 80%',
    color: 'border-emerald-500 text-emerald-700 bg-emerald-50',
  },
  {
    id: 'multiple-support-needs',
    name: 'Multiple Support Needs',
    category: 'Critical Support',
    description: 'Urgent priority cohort facing concurrent academic crisis and severely low placement readiness.',
    criteria: 'Academic Risk = High AND Placement Risk = High',
    color: 'border-rose-600 text-rose-800 bg-rose-50',
  },
  {
    id: 'insufficient-data',
    name: 'Insufficient Data Audit',
    category: 'Data Quality',
    description: 'Profiles missing one or more foundational data streams, requiring administrative data import or sync.',
    criteria: 'Data Completeness < 70%',
    color: 'border-slate-500 text-slate-700 bg-slate-100',
  },
];

export function evaluateStudentSegments(student: Student): string[] {
  const segments: string[] = [];
  const cgpa = student.cgpa ?? 0;
  const placementScore = student.placementReadinessScore ?? 0;
  const attendance = student.attendance ?? 0;
  const lmsScore = student.successScoreBreakdown?.lms?.normalized ?? 0;
  const campusScore = student.successScoreBreakdown?.campus?.normalized ?? 0;

  // 1. High Academics, Low Placement
  if (student.cgpa !== null && cgpa >= 7.5 && placementScore > 0 && placementScore < 50) {
    segments.push('high-acad-low-place');
  }

  // 2. Strong Placement, Weak Academics
  if (placementScore >= 70 && student.cgpa !== null && cgpa < 6.5) {
    segments.push('strong-place-weak-acad');
  }

  // 3. Low Attendance & Academic Risk
  if (student.attendance !== null && attendance < 75 && (student.academicRisk === 'High' || student.academicRisk === 'Medium')) {
    segments.push('low-att-acad-risk');
  }

  // 4. Low LMS Engagement
  if (student.successScoreBreakdown?.lms?.available && lmsScore < 50) {
    segments.push('low-lms-engagement');
  }

  // 5. High Potential, Low Engagement
  if (student.cgpa !== null && cgpa >= 7.0 && (campusScore < 50 || lmsScore < 50)) {
    segments.push('high-pot-low-eng');
  }

  // 6. Balanced High Performers
  if (student.cgpa !== null && cgpa >= 8.0 && placementScore >= 75 && student.attendance !== null && attendance >= 80) {
    segments.push('balanced-high-performers');
  }

  // 7. Multiple Support Needs
  if (student.academicRisk === 'High' && student.placementRisk === 'High') {
    segments.push('multiple-support-needs');
  }

  // 8. Insufficient Data
  if (student.dataCompleteness < 70) {
    segments.push('insufficient-data');
  }

  return segments;
}

export function getSegmentStudents(students: Student[], segmentId: string): Student[] {
  return students.filter((s) => s.applicableSegments?.includes(segmentId));
}
