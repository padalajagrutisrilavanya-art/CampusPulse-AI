/**
 * CSV Import/Export Service
 * Uses PapaParse and Zod for schema validation, column mapping, safe student_id merging,
 * duplicate detection, error reporting, and export capabilities.
 */

import Papa from 'papaparse';
import { z } from 'zod';
import { Student, Department } from '../types';

export type CsvDomainType =
  | 'academic'
  | 'attendance'
  | 'lms'
  | 'engagement'
  | 'placement'
  | 'skills'
  | 'full_roster';

export interface CsvValidationIssue {
  row: number;
  studentId?: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface CsvImportResult {
  domain: CsvDomainType;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  createdCount: number;
  updatedCount: number;
  issues: CsvValidationIssue[];
  mergedStudents: Student[];
}

// Schemas
const FullStudentSchema = z.object({
  student_id: z.string().min(3, 'Student ID required'),
  name: z.string().min(2, 'Full Name required'),
  email: z.string().email('Valid institutional email required'),
  department: z.enum(['CSE', 'ECE', 'EEE', 'IT', 'MECH'] as const),
  year: z.coerce.number().min(1).max(4),
  semester: z.coerce.number().min(1).max(8),
  cgpa: z.coerce.number().min(0).max(10).optional().nullable(),
  attendance: z.coerce.number().min(0).max(100).optional().nullable(),
  backlogs: z.coerce.number().min(0).default(0),
  mentor_name: z.string().optional().default('Assigned Faculty Mentor'),
});

const AcademicSchema = z.object({
  student_id: z.string().min(3, 'Student ID is required'),
  cgpa: z.coerce.number().min(0).max(10, 'CGPA must be between 0.0 and 10.0'),
  backlogs: z.coerce.number().min(0).default(0),
  prev_cgpa: z.coerce.number().min(0).max(10).optional().nullable(),
});

const AttendanceSchema = z.object({
  student_id: z.string().min(3, 'Student ID is required'),
  attendance: z.coerce.number().min(0).max(100, 'Attendance must be 0 - 100%'),
});

const LmsSchema = z.object({
  student_id: z.string().min(3, 'Student ID is required'),
  lms_logins_per_week: z.coerce.number().min(0).max(50),
  assignment_completion_rate: z.coerce.number().min(0).max(100),
  video_watch_percentage: z.coerce.number().min(0).max(100),
});

const EngagementSchema = z.object({
  student_id: z.string().min(3, 'Student ID is required'),
  club_count: z.coerce.number().min(0).max(10),
  event_count: z.coerce.number().min(0).max(20),
  has_leadership: z.coerce.boolean().or(z.string().transform((v) => v.toLowerCase() === 'true' || v === '1')),
  sports_or_cultural: z.coerce.boolean().or(z.string().transform((v) => v.toLowerCase() === 'true' || v === '1')),
});

const PlacementSchema = z.object({
  student_id: z.string().min(3, 'Student ID is required'),
  coding_score: z.coerce.number().min(0).max(100),
  aptitude_score: z.coerce.number().min(0).max(100),
  mock_interview_score: z.coerce.number().min(0).max(100),
  resume_score: z.coerce.number().min(0).max(100),
  internship_status: z.enum(['Completed', 'In Progress', 'Not Started'] as const).optional(),
});

const SkillsSchema = z.object({
  student_id: z.string().min(3, 'Student ID is required'),
  technical_skill: z.coerce.number().min(0).max(10),
  soft_skill: z.coerce.number().min(0).max(10),
});

export const CSV_TEMPLATES: Record<CsvDomainType, { filename: string; headers: string[]; sample: string }> = {
  academic: {
    filename: 'academic_records_template.csv',
    headers: ['student_id', 'cgpa', 'backlogs', 'prev_cgpa'],
    sample: `student_id,cgpa,backlogs,prev_cgpa\nCP-2023-CSE-001,8.45,0,8.30\nCP-2023-ECE-032,6.10,2,6.50\nCP-2023-MECH-105,4.90,3,5.40`,
  },
  attendance: {
    filename: 'attendance_records_template.csv',
    headers: ['student_id', 'attendance'],
    sample: `student_id,attendance\nCP-2023-CSE-001,89.5\nCP-2023-ECE-032,64.0\nCP-2023-MECH-105,58.2`,
  },
  lms: {
    filename: 'lms_activity_template.csv',
    headers: ['student_id', 'lms_logins_per_week', 'assignment_completion_rate', 'video_watch_percentage'],
    sample: `student_id,lms_logins_per_week,assignment_completion_rate,video_watch_percentage\nCP-2023-CSE-001,12,95,90\nCP-2023-ECE-032,3,52,40\nCP-2023-MECH-105,1,35,30`,
  },
  engagement: {
    filename: 'campus_engagement_template.csv',
    headers: ['student_id', 'club_count', 'event_count', 'has_leadership', 'sports_or_cultural'],
    sample: `student_id,club_count,event_count,has_leadership,sports_or_cultural\nCP-2023-CSE-001,2,4,true,true\nCP-2023-ECE-032,0,1,false,false\nCP-2023-MECH-105,1,0,false,false`,
  },
  placement: {
    filename: 'placement_evaluations_template.csv',
    headers: ['student_id', 'coding_score', 'aptitude_score', 'mock_interview_score', 'resume_score', 'internship_status'],
    sample: `student_id,coding_score,aptitude_score,mock_interview_score,resume_score,internship_status\nCP-2023-CSE-001,88,85,90,92,Completed\nCP-2023-ECE-032,42,48,50,55,Not Started\nCP-2023-MECH-105,35,40,45,50,Not Started`,
  },
  skills: {
    filename: 'skills_assessments_template.csv',
    headers: ['student_id', 'technical_skill', 'soft_skill'],
    sample: `student_id,technical_skill,soft_skill\nCP-2023-CSE-001,8.5,8.0\nCP-2023-ECE-032,5.5,6.0\nCP-2023-MECH-105,4.0,5.0`,
  },
  full_roster: {
    filename: 'new_students_roster_template.csv',
    headers: ['student_id', 'name', 'email', 'department', 'year', 'semester', 'cgpa', 'attendance', 'backlogs', 'mentor_name'],
    sample: `student_id,name,email,department,year,semester,cgpa,attendance,backlogs,mentor_name\nCP-2023-CSE-151,Prateek Joshi,prateek.joshi@campuspulse.edu,CSE,2,4,7.80,84,0,Dr. Anita Sundaram\nCP-2023-IT-152,Kavita Verma,kavita.verma@campuspulse.edu,IT,3,6,6.90,79,1,Prof. Deepali Roy`,
  },
};

export function downloadCsvTemplate(domain: CsvDomainType): void {
  const tmpl = CSV_TEMPLATES[domain];
  const blob = new Blob([tmpl.sample], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', tmpl.filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function parseAndValidateCsv(
  csvContent: string,
  domain: CsvDomainType,
  existingStudents: Student[]
): Promise<CsvImportResult> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, any>>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/[\s-]/g, '_'),
      complete: (results) => {
        const rows = results.data;
        const issues: CsvValidationIssue[] = [];
        const studentMap = new Map<string, Student>(existingStudents.map((s) => [s.id, { ...s }]));
        let validRows = 0;
        let createdCount = 0;
        let updatedCount = 0;

        const seenRowIds = new Set<string>();

        rows.forEach((row, index) => {
          const rowNum = index + 2; // header is row 1
          const rawId = String(row.student_id || row.id || '').trim();

          if (!rawId) {
            issues.push({
              row: rowNum,
              field: 'student_id',
              message: 'Missing student_id in row.',
              severity: 'error',
            });
            return;
          }

          // Duplicate detection in same file
          if (seenRowIds.has(rawId)) {
            issues.push({
              row: rowNum,
              studentId: rawId,
              field: 'student_id',
              message: `Duplicate student_id "${rawId}" detected in uploaded CSV. Subsequent row skipped.`,
              severity: 'warning',
            });
            return;
          }
          seenRowIds.add(rawId);

          const studentExists = studentMap.has(rawId);

          if (domain === 'full_roster') {
            const parsed = FullStudentSchema.safeParse(row);
            if (!parsed.success) {
              parsed.error.issues.forEach((err) => {
                issues.push({
                  row: rowNum,
                  studentId: rawId,
                  field: err.path.join('.'),
                  message: err.message,
                  severity: 'error',
                });
              });
              return;
            }

            const data = parsed.data;
            if (studentExists) {
              // Update existing student with identity & initial fields
              const curr = studentMap.get(rawId)!;
              studentMap.set(rawId, {
                ...curr,
                name: data.name,
                email: data.email,
                department: data.department as Department,
                year: data.year,
                semester: data.semester,
                cgpa: data.cgpa ?? curr.cgpa,
                attendance: data.attendance ?? curr.attendance,
                backlogs: data.backlogs ?? curr.backlogs,
                mentorName: data.mentor_name || curr.mentorName,
              });
              updatedCount++;
            } else {
              // Create new student
              const newStudent: Student = {
                id: data.student_id,
                name: data.name,
                email: data.email,
                phone: '+91 9800000000',
                department: data.department as Department,
                year: data.year,
                semester: data.semester,
                section: 'A',
                mentorName: data.mentor_name || 'Assigned Faculty Mentor',
                cgpa: data.cgpa ?? null,
                prevCgpa: null,
                backlogs: data.backlogs ?? 0,
                semesterMarks: [{ semester: data.semester, sgpa: data.cgpa ?? 7.0, credits: 22 }],
                attendance: data.attendance ?? null,
                courseAttendance: [],
                lmsLoginsPerWeek: 5,
                assignmentCompletionRate: 75,
                videoWatchPercentage: 70,
                clubParticipationCount: 1,
                eventParticipationCount: 1,
                hasLeadershipRole: false,
                sportsOrCultural: false,
                aptitudeScore: null,
                codingScore: null,
                mockInterviewScore: null,
                resumeScore: null,
                internshipStatus: 'Not Started',
                placedStatus: 'Not Placed',
                targetCompanyTier: 'IT Services',
                technicalSkill: null,
                softSkill: null,
                skillsList: [],
                mentorFeedback: [],
                successScore: 0,
                successScoreBreakdown: {} as any,
                dataCompleteness: 0,
                isProvisionalScore: true,
                academicRisk: 'Low',
                academicRiskReasons: [],
                placementReadinessScore: null,
                placementRisk: 'Insufficient Data',
                placementRiskReasons: [],
                applicableSegments: [],
              };
              studentMap.set(rawId, newStudent);
              createdCount++;
            }
            validRows++;
            return;
          }

          // For domain-specific imports (Academic, Attendance, LMS, etc.):
          // If student doesn't exist, we do NOT allow creating without identity fields.
          if (!studentExists) {
            issues.push({
              row: rowNum,
              studentId: rawId,
              field: 'student_id',
              message: `Student ID "${rawId}" does not exist in student roster. Domain updates require existing identity record. Use 'New Students Roster' CSV first.`,
              severity: 'error',
            });
            return;
          }

          const curr = studentMap.get(rawId)!;

          if (domain === 'academic') {
            const parsed = AcademicSchema.safeParse(row);
            if (!parsed.success) {
              parsed.error.issues.forEach((e) => {
                issues.push({ row: rowNum, studentId: rawId, field: e.path.join('.'), message: e.message, severity: 'error' });
              });
              return;
            }
            studentMap.set(rawId, {
              ...curr,
              cgpa: parsed.data.cgpa,
              backlogs: parsed.data.backlogs,
              prevCgpa: parsed.data.prev_cgpa !== undefined ? parsed.data.prev_cgpa : curr.prevCgpa,
            });
            updatedCount++;
            validRows++;
          } else if (domain === 'attendance') {
            const parsed = AttendanceSchema.safeParse(row);
            if (!parsed.success) {
              parsed.error.issues.forEach((e) => {
                issues.push({ row: rowNum, studentId: rawId, field: e.path.join('.'), message: e.message, severity: 'error' });
              });
              return;
            }
            studentMap.set(rawId, {
              ...curr,
              attendance: parsed.data.attendance,
            });
            updatedCount++;
            validRows++;
          } else if (domain === 'lms') {
            const parsed = LmsSchema.safeParse(row);
            if (!parsed.success) {
              parsed.error.issues.forEach((e) => {
                issues.push({ row: rowNum, studentId: rawId, field: e.path.join('.'), message: e.message, severity: 'error' });
              });
              return;
            }
            studentMap.set(rawId, {
              ...curr,
              lmsLoginsPerWeek: parsed.data.lms_logins_per_week,
              assignmentCompletionRate: parsed.data.assignment_completion_rate,
              videoWatchPercentage: parsed.data.video_watch_percentage,
            });
            updatedCount++;
            validRows++;
          } else if (domain === 'engagement') {
            const parsed = EngagementSchema.safeParse(row);
            if (!parsed.success) {
              parsed.error.issues.forEach((e) => {
                issues.push({ row: rowNum, studentId: rawId, field: e.path.join('.'), message: e.message, severity: 'error' });
              });
              return;
            }
            studentMap.set(rawId, {
              ...curr,
              clubParticipationCount: parsed.data.club_count,
              eventParticipationCount: parsed.data.event_count,
              hasLeadershipRole: Boolean(parsed.data.has_leadership),
              sportsOrCultural: Boolean(parsed.data.sports_or_cultural),
            });
            updatedCount++;
            validRows++;
          } else if (domain === 'placement') {
            const parsed = PlacementSchema.safeParse(row);
            if (!parsed.success) {
              parsed.error.issues.forEach((e) => {
                issues.push({ row: rowNum, studentId: rawId, field: e.path.join('.'), message: e.message, severity: 'error' });
              });
              return;
            }
            studentMap.set(rawId, {
              ...curr,
              codingScore: parsed.data.coding_score,
              aptitudeScore: parsed.data.aptitude_score,
              mockInterviewScore: parsed.data.mock_interview_score,
              resumeScore: parsed.data.resume_score,
              internshipStatus: parsed.data.internship_status ?? curr.internshipStatus,
            });
            updatedCount++;
            validRows++;
          } else if (domain === 'skills') {
            const parsed = SkillsSchema.safeParse(row);
            if (!parsed.success) {
              parsed.error.issues.forEach((e) => {
                issues.push({ row: rowNum, studentId: rawId, field: e.path.join('.'), message: e.message, severity: 'error' });
              });
              return;
            }
            studentMap.set(rawId, {
              ...curr,
              technicalSkill: parsed.data.technical_skill,
              softSkill: parsed.data.soft_skill,
            });
            updatedCount++;
            validRows++;
          }
        });

        resolve({
          domain,
          totalRows: rows.length,
          validRows,
          invalidRows: rows.length - validRows,
          createdCount,
          updatedCount,
          issues,
          mergedStudents: Array.from(studentMap.values()),
        });
      },
      error: (err: any) => {
        resolve({
          domain,
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          createdCount: 0,
          updatedCount: 0,
          issues: [{ row: 0, field: 'file', message: err.message, severity: 'error' }],
          mergedStudents: existingStudents,
        });
      },
    });
  });
}

export function exportStudentsToCsv(students: Student[], filename = 'campuspulse_students.csv'): void {
  const exportRows = students.map((s) => ({
    student_id: s.id,
    name: s.name,
    email: s.email,
    department: s.department,
    year: s.year,
    semester: s.semester,
    cgpa: s.cgpa ?? 'N/A',
    attendance: s.attendance !== null ? `${s.attendance}%` : 'N/A',
    backlogs: s.backlogs,
    success_score: s.successScore,
    data_completeness: `${s.dataCompleteness}%`,
    is_provisional: s.isProvisionalScore ? 'YES' : 'NO',
    academic_risk: s.academicRisk,
    academic_risk_reasons: s.academicRiskReasons.join(' | '),
    placement_readiness: s.placementReadinessScore ?? 'N/A',
    placement_risk: s.placementRisk,
    mentor_name: s.mentorName,
    internship_status: s.internshipStatus,
    target_tier: s.targetCompanyTier,
  }));

  const csv = Papa.unparse(exportRows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
