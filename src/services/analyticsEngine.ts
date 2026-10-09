/**
 * Explainable Analytics Engine
 * Generates transparent, deterministic, data-grounded insights and actionable recommendations
 * directly from the active campus dataset without external AI calls.
 */

import { Student, ExplainableInsight, Intervention, Department } from '../types';

export function generateDatasetInsights(
  students: Student[],
  interventions: Intervention[]
): ExplainableInsight[] {
  const insights: ExplainableInsight[] = [];
  if (students.length === 0) return insights;

  // 1. Attendance vs CGPA Correlation Signal
  const lowAttStudents = students.filter((s) => s.attendance !== null && s.attendance < 75);
  const goodAttStudents = students.filter((s) => s.attendance !== null && s.attendance >= 75);

  const avgCgpaLowAtt =
    lowAttStudents.length > 0
      ? lowAttStudents.reduce((acc, s) => acc + (s.cgpa ?? 0), 0) / lowAttStudents.length
      : 0;
  const avgCgpaGoodAtt =
    goodAttStudents.length > 0
      ? goodAttStudents.reduce((acc, s) => acc + (s.cgpa ?? 0), 0) / goodAttStudents.length
      : 0;
  const deltaCgpa = Math.round((avgCgpaGoodAtt - avgCgpaLowAtt) * 100) / 100;

  if (lowAttStudents.length > 0 && deltaCgpa > 0.4) {
    insights.push({
      id: 'insight-attendance-cgpa-drop',
      type: 'alert',
      title: 'Class Attendance Directly Correlates to a CGPA Deficit',
      evidence: `Students with <75% attendance average a CGPA of ${avgCgpaLowAtt.toFixed(2)}, compared to ${avgCgpaGoodAtt.toFixed(2)} for those with ≥75% attendance (a net gap of ${deltaCgpa.toFixed(2)} points).`,
      calculationExplanation: `Sample: ${lowAttStudents.length} students under 75% attendance vs ${goodAttStudents.length} students with healthy attendance. Difference calculated as [Avg CGPA (≥75%) - Avg CGPA (<75%)].`,
      affectedCount: lowAttStudents.length,
      recommendedAction: 'Issue automated attendance advisory alerts and mandate bi-weekly mentor check-ins before semester detention cutoffs.',
      filterAction: { academicRisk: 'High' },
    });
  }

  // 2. High CGPA but Coding Bottleneck for Placements
  const placementBottleneck = students.filter(
    (s) => (s.cgpa ?? 0) >= 7.5 && s.codingScore !== null && s.codingScore < 50
  );
  if (placementBottleneck.length > 0) {
    insights.push({
      id: 'insight-placement-coding-gap',
      type: 'opportunity',
      title: 'Academically Strong Students at Risk of Placement Technical Rejection',
      evidence: `${placementBottleneck.length} students maintain a competitive CGPA ≥ 7.50 but score below 50/100 on coding assessments, disqualifying them from Tier-1 product campus drives.`,
      calculationExplanation: `Condition: cgpa >= 7.50 AND codingScore < 50. Total affected: ${placementBottleneck.length} / ${students.length} students (${Math.round((placementBottleneck.length / students.length) * 100)}%).`,
      affectedCount: placementBottleneck.length,
      recommendedAction: 'Enroll these students into intensive Data Structures & Algorithms bootcamps and weekly timed mock coding rounds.',
      filterAction: { segmentId: 'high-acad-low-place' },
    });
  }

  // 3. Departmental Risk Concentration
  const departments: Department[] = ['CSE', 'ECE', 'EEE', 'IT', 'MECH'];
  let maxRiskDept: { dept: Department; count: number; total: number; rate: number } | null = null;

  for (const dept of departments) {
    const deptStudents = students.filter((s) => s.department === dept);
    if (deptStudents.length >= 5) {
      const highRiskCount = deptStudents.filter((s) => s.academicRisk === 'High').length;
      const rate = highRiskCount / deptStudents.length;
      if (!maxRiskDept || rate > maxRiskDept.rate) {
        maxRiskDept = { dept, count: highRiskCount, total: deptStudents.length, rate };
      }
    }
  }

  if (maxRiskDept && maxRiskDept.count > 0 && maxRiskDept.rate >= 0.12) {
    const pct = Math.round(maxRiskDept.rate * 100);
    insights.push({
      id: 'insight-dept-concentration',
      type: 'benchmark',
      title: `${maxRiskDept.dept} Department Shows Highest Academic Risk Concentration`,
      departmentScope: maxRiskDept.dept,
      evidence: `${pct}% (${maxRiskDept.count} of ${maxRiskDept.total}) of ${maxRiskDept.dept} students exhibit High Academic Risk indicators, surpassing the institutional baseline.`,
      calculationExplanation: `Department high-risk rate: (count of academicRisk === 'High' in ${maxRiskDept.dept} / total ${maxRiskDept.dept} students) × 100 = ${pct}%.`,
      affectedCount: maxRiskDept.count,
      recommendedAction: `Coordinate with ${maxRiskDept.dept} Head of Department to schedule departmental remedial tutoring and review foundational subject pass-rates.`,
      filterAction: { department: maxRiskDept.dept, academicRisk: 'High' },
    });
  }

  // 4. Intervention Coverage Gap for High Risk Students
  const highRiskStudents = students.filter((s) => s.academicRisk === 'High');
  const activeInterventionStudentIds = new Set(
    interventions.filter((i) => i.status !== 'Completed').map((i) => i.studentId)
  );
  const unassignedHighRisk = highRiskStudents.filter((s) => !activeInterventionStudentIds.has(s.id));

  if (unassignedHighRisk.length > 0) {
    insights.push({
      id: 'insight-intervention-coverage-gap',
      type: 'alert',
      title: `${unassignedHighRisk.length} High-Risk Students Lack an Active Action Plan`,
      evidence: `Out of ${highRiskStudents.length} high academic risk students, ${unassignedHighRisk.length} do not have an active faculty intervention or mentoring case on file.`,
      calculationExplanation: `High risk students (${highRiskStudents.length}) minus students with active interventions (${highRiskStudents.length - unassignedHighRisk.length}) = ${unassignedHighRisk.length} unassigned.`,
      affectedCount: unassignedHighRisk.length,
      recommendedAction: 'Use the At-Risk dashboard to assign faculty mentors and create structured 30-day intervention goals.',
      filterAction: { academicRisk: 'High' },
    });
  }

  // 5. Digital Disengagement Warning
  const lowLmsCount = students.filter((s) => (s.lmsLoginsPerWeek ?? 10) < 3 && (s.assignmentCompletionRate ?? 100) < 60);
  if (lowLmsCount.length > 0) {
    insights.push({
      id: 'insight-lms-disengagement',
      type: 'trend',
      title: 'Digital LMS Inactivity Precedes Mid-Term Submission Failures',
      evidence: `${lowLmsCount.length} students log into the portal fewer than 3 times per week with assignment completion below 60%.`,
      calculationExplanation: `Filter: loginsPerWeek < 3 AND assignmentCompletionRate < 60%. Identifies digital absenteeism before formal exam results.`,
      affectedCount: lowLmsCount.length,
      recommendedAction: 'Trigger LMS push reminders for pending course modules and verify student device/internet accessibility.',
      filterAction: { segmentId: 'low-lms-engagement' },
    });
  }

  return insights;
}
