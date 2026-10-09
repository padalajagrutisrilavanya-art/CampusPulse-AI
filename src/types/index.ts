/**
 * Core Domain Types for CampusPulse AI
 */

export type Department = 'CSE' | 'ECE' | 'EEE' | 'IT' | 'MECH';

export type AcademicRiskLevel = 'High' | 'Medium' | 'Low' | 'Insufficient Data';
export type PlacementRiskLevel = 'High' | 'Medium' | 'Low' | 'Insufficient Data';

export type UserRole = 'admin' | 'faculty' | 'placement';

export interface SemesterMark {
  semester: number;
  sgpa: number;
  credits: number;
}

export interface CourseAttendance {
  courseCode: string;
  courseName: string;
  attended: number;
  total: number;
  percentage: number;
}

export interface SkillItem {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: 'Technical' | 'Soft' | 'Core';
}

export interface MentorFeedbackNote {
  id: string;
  date: string;
  mentor: string;
  note: string;
  category: 'Academic' | 'Attendance' | 'Behavioral' | 'Placement';
}

export interface ComponentBreakdown {
  raw: number | null;
  normalized: number | null;
  weight: number;
  effectiveWeight: number;
  contribution: number;
  available: boolean;
  unit: string;
  description: string;
}

export interface SuccessScoreBreakdown {
  academics: ComponentBreakdown;
  attendance: ComponentBreakdown;
  lms: ComponentBreakdown;
  campus: ComponentBreakdown;
  placement: ComponentBreakdown;
  skills: ComponentBreakdown;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: Department;
  year: number; // 1, 2, 3, 4
  semester: number; // 1 to 8
  section: string;
  mentorName: string;
  avatarUrl?: string;

  // Academic data
  cgpa: number | null;
  prevCgpa?: number | null;
  backlogs: number;
  semesterMarks: SemesterMark[];

  // Attendance data
  attendance: number | null; // Overall %
  courseAttendance: CourseAttendance[];

  // LMS activity
  lmsLoginsPerWeek: number | null;
  assignmentCompletionRate: number | null; // %
  videoWatchPercentage: number | null; // %
  lastLmsActiveDate?: string;

  // Campus engagement
  clubParticipationCount: number | null;
  eventParticipationCount: number | null;
  hasLeadershipRole: boolean;
  sportsOrCultural: boolean;

  // Placement readiness
  aptitudeScore: number | null; // 0-100
  codingScore: number | null; // 0-100
  mockInterviewScore: number | null; // 0-100
  resumeScore: number | null; // 0-100
  internshipStatus: 'Completed' | 'In Progress' | 'Not Started';
  placedStatus: 'Placed' | 'In Process' | 'Not Placed' | 'Higher Studies';
  targetCompanyTier: 'Tier 1 / Product' | 'Core Engineering' | 'IT Services' | 'Consulting';

  // Skills
  technicalSkill: number | null; // 0-10 scale
  softSkill: number | null; // 0-10 scale
  skillsList: SkillItem[];

  // Mentor feedback
  mentorFeedback: MentorFeedbackNote[];

  // Computed fields (populated dynamically by engines)
  successScore: number;
  successScoreBreakdown: SuccessScoreBreakdown;
  dataCompleteness: number; // 0 to 100
  isProvisionalScore: boolean;
  academicRisk: AcademicRiskLevel;
  academicRiskReasons: string[];
  placementReadinessScore: number | null; // composite 0-100
  placementRisk: PlacementRiskLevel;
  placementRiskReasons: string[];
  applicableSegments: string[];
}

export interface Intervention {
  id: string;
  studentId: string;
  studentName: string;
  studentDepartment: Department;
  issue: string;
  recommendedAction: string;
  assignedMentor: string;
  priority: 'High' | 'Medium' | 'Low';
  createdAt: string;
  targetDate: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  notes: string;
  followUpDate?: string;
  updatedAt: string;
}

export interface ScoringWeights {
  academics: number; // default 30
  attendance: number; // default 20
  lms: number; // default 10
  campus: number; // default 10
  placement: number; // default 20
  skills: number; // default 10
}

export interface RiskThresholds {
  academicHighAttendance: number; // < 65
  academicHighCgpa: number; // < 5.0
  academicHighBacklogs: number; // >= 3
  academicMedAttendance: number; // < 75
  academicMedCgpa: number; // < 6.0
  academicMedBacklogs: number; // >= 1
  placementHighCutoff: number; // < 40
  placementMedCutoff: number; // < 60
}

export interface SegmentDefinition {
  id: string;
  name: string;
  category: 'Critical Support' | 'Engagement' | 'Placement' | 'Excellence' | 'Data Quality';
  description: string;
  criteria: string;
  color: string;
}

export interface GlobalFilter {
  department: 'ALL' | Department;
  year: 'ALL' | number;
  semester: 'ALL' | number;
  academicRisk: 'ALL' | AcademicRiskLevel;
  placementRisk: 'ALL' | PlacementRiskLevel;
  search: string;
}

export interface ExplainableInsight {
  id: string;
  type: 'alert' | 'opportunity' | 'trend' | 'benchmark';
  title: string;
  departmentScope?: Department | 'ALL';
  evidence: string;
  calculationExplanation: string;
  affectedCount: number;
  recommendedAction: string;
  filterAction?: Partial<GlobalFilter> & { segmentId?: string };
}

export interface CsvImportHistory {
  id: string;
  timestamp: string;
  fileName: string;
  dataType: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errors: string[];
}
