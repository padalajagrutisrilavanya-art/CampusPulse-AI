/**
 * Supabase Service
 * Type-safe data access layer for PostgreSQL database operations with robust error handling,
 * bi-directional data mappings, chunked batch operations, and graceful offline fallback.
 */

import { Student, Intervention, Department } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { computeSuccessScore, DEFAULT_WEIGHTS } from './scoringEngine';
import { evaluateRisks, DEFAULT_RISK_THRESHOLDS } from './riskEngine';
import { evaluateStudentSegments } from './segmentationService';

export interface DbStudentRow {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  department: string;
  year: number;
  semester: number;
  section?: string | null;
  mentor_name?: string | null;
  avatar_url?: string | null;
  cgpa?: number | null;
  prev_cgpa?: number | null;
  backlogs?: number;
  semester_marks?: any;
  attendance?: number | null;
  course_attendance?: any;
  lms_logins_per_week?: number | null;
  assignment_completion_rate?: number | null;
  video_watch_percentage?: number | null;
  last_lms_active_date?: string | null;
  club_participation_count?: number | null;
  event_participation_count?: number | null;
  has_leadership_role?: boolean;
  sports_or_cultural?: boolean;
  aptitude_score?: number | null;
  coding_score?: number | null;
  mock_interview_score?: number | null;
  resume_score?: number | null;
  internship_status?: string | null;
  placed_status?: string | null;
  target_company_tier?: string | null;
  technical_skill?: number | null;
  soft_skill?: number | null;
  skills_list?: any;
  mentor_feedback?: any;
  success_score?: number | null;
  success_score_breakdown?: any;
  data_completeness?: number | null;
  is_provisional_score?: boolean;
  academic_risk?: string | null;
  academic_risk_reasons?: any;
  placement_readiness_score?: number | null;
  placement_risk?: string | null;
  placement_risk_reasons?: any;
  applicable_segments?: any;
  updated_at?: string;
}

export interface DbInterventionRow {
  id: string;
  student_id: string;
  student_name: string;
  student_department: string;
  issue: string;
  recommended_action: string;
  assigned_mentor: string;
  priority: string;
  created_at: string;
  target_date: string;
  status: string;
  notes?: string | null;
  follow_up_date?: string | null;
  updated_at?: string;
}

export interface ConnectionTestResult {
  connected: boolean;
  count: number;
  error?: string;
  tableExists: boolean;
}

/**
 * Maps frontend Student object to database row format.
 */
export function mapStudentToDb(student: Student): DbStudentRow {
  return {
    id: student.id,
    name: student.name,
    email: student.email,
    phone: student.phone || null,
    department: student.department,
    year: student.year,
    semester: student.semester,
    section: student.section || 'A',
    mentor_name: student.mentorName || null,
    avatar_url: student.avatarUrl || null,
    cgpa: student.cgpa !== null && student.cgpa !== undefined ? Number(student.cgpa) : null,
    prev_cgpa: student.prevCgpa !== null && student.prevCgpa !== undefined ? Number(student.prevCgpa) : null,
    backlogs: student.backlogs || 0,
    semester_marks: student.semesterMarks || [],
    attendance: student.attendance !== null && student.attendance !== undefined ? Number(student.attendance) : null,
    course_attendance: student.courseAttendance || [],
    lms_logins_per_week: student.lmsLoginsPerWeek !== null && student.lmsLoginsPerWeek !== undefined ? Number(student.lmsLoginsPerWeek) : null,
    assignment_completion_rate: student.assignmentCompletionRate !== null && student.assignmentCompletionRate !== undefined ? Number(student.assignmentCompletionRate) : null,
    video_watch_percentage: student.videoWatchPercentage !== null && student.videoWatchPercentage !== undefined ? Number(student.videoWatchPercentage) : null,
    last_lms_active_date: student.lastLmsActiveDate || null,
    club_participation_count: student.clubParticipationCount !== null && student.clubParticipationCount !== undefined ? Number(student.clubParticipationCount) : 0,
    event_participation_count: student.eventParticipationCount !== null && student.eventParticipationCount !== undefined ? Number(student.eventParticipationCount) : 0,
    has_leadership_role: Boolean(student.hasLeadershipRole),
    sports_or_cultural: Boolean(student.sportsOrCultural),
    aptitude_score: student.aptitudeScore !== null && student.aptitudeScore !== undefined ? Number(student.aptitudeScore) : null,
    coding_score: student.codingScore !== null && student.codingScore !== undefined ? Number(student.codingScore) : null,
    mock_interview_score: student.mockInterviewScore !== null && student.mockInterviewScore !== undefined ? Number(student.mockInterviewScore) : null,
    resume_score: student.resumeScore !== null && student.resumeScore !== undefined ? Number(student.resumeScore) : null,
    internship_status: student.internshipStatus || 'Not Started',
    placed_status: student.placedStatus || 'Not Placed',
    target_company_tier: student.targetCompanyTier || 'IT Services',
    technical_skill: student.technicalSkill !== null && student.technicalSkill !== undefined ? Number(student.technicalSkill) : null,
    soft_skill: student.softSkill !== null && student.softSkill !== undefined ? Number(student.softSkill) : null,
    skills_list: student.skillsList || [],
    mentor_feedback: student.mentorFeedback || [],
    success_score: student.successScore || 0,
    success_score_breakdown: student.successScoreBreakdown || {},
    data_completeness: student.dataCompleteness || 100,
    is_provisional_score: Boolean(student.isProvisionalScore),
    academic_risk: student.academicRisk || 'Low',
    academic_risk_reasons: student.academicRiskReasons || [],
    placement_readiness_score: student.placementReadinessScore !== null && student.placementReadinessScore !== undefined ? Number(student.placementReadinessScore) : null,
    placement_risk: student.placementRisk || 'Low',
    placement_risk_reasons: student.placementRiskReasons || [],
    applicable_segments: student.applicableSegments || [],
    updated_at: new Date().toISOString(),
  };
}

/**
 * Maps database row format to frontend Student object.
 * Recomputes dynamic scores if database row had empty pre-computed values.
 */
export function mapDbToStudent(row: DbStudentRow): Student {
  const baseStudent: Partial<Student> = {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || '+91 9800000000',
    department: (row.department as Department) || 'CSE',
    year: Number(row.year) || 1,
    semester: Number(row.semester) || 1,
    section: row.section || 'A',
    mentorName: row.mentor_name || 'Assigned Faculty Mentor',
    avatarUrl: row.avatar_url || undefined,
    cgpa: row.cgpa !== null && row.cgpa !== undefined ? Number(row.cgpa) : null,
    prevCgpa: row.prev_cgpa !== null && row.prev_cgpa !== undefined ? Number(row.prev_cgpa) : null,
    backlogs: Number(row.backlogs) || 0,
    semesterMarks: Array.isArray(row.semester_marks) ? row.semester_marks : [],
    attendance: row.attendance !== null && row.attendance !== undefined ? Number(row.attendance) : null,
    courseAttendance: Array.isArray(row.course_attendance) ? row.course_attendance : [],
    lmsLoginsPerWeek: row.lms_logins_per_week !== null && row.lms_logins_per_week !== undefined ? Number(row.lms_logins_per_week) : null,
    assignmentCompletionRate: row.assignment_completion_rate !== null && row.assignment_completion_rate !== undefined ? Number(row.assignment_completion_rate) : null,
    videoWatchPercentage: row.video_watch_percentage !== null && row.video_watch_percentage !== undefined ? Number(row.video_watch_percentage) : null,
    lastLmsActiveDate: row.last_lms_active_date || '2026-10-06',
    clubParticipationCount: Number(row.club_participation_count) || 0,
    eventParticipationCount: Number(row.event_participation_count) || 0,
    hasLeadershipRole: Boolean(row.has_leadership_role),
    sportsOrCultural: Boolean(row.sports_or_cultural),
    aptitudeScore: row.aptitude_score !== null && row.aptitude_score !== undefined ? Number(row.aptitude_score) : null,
    codingScore: row.coding_score !== null && row.coding_score !== undefined ? Number(row.coding_score) : null,
    mockInterviewScore: row.mock_interview_score !== null && row.mock_interview_score !== undefined ? Number(row.mock_interview_score) : null,
    resumeScore: row.resume_score !== null && row.resume_score !== undefined ? Number(row.resume_score) : null,
    internshipStatus: (row.internship_status as any) || 'Not Started',
    placedStatus: (row.placed_status as any) || 'Not Placed',
    targetCompanyTier: (row.target_company_tier as any) || 'IT Services',
    technicalSkill: row.technical_skill !== null && row.technical_skill !== undefined ? Number(row.technical_skill) : null,
    softSkill: row.soft_skill !== null && row.soft_skill !== undefined ? Number(row.soft_skill) : null,
    skillsList: Array.isArray(row.skills_list) ? row.skills_list : [],
    mentorFeedback: Array.isArray(row.mentor_feedback) ? row.mentor_feedback : [],
  };

  const scoreResult = computeSuccessScore(baseStudent, DEFAULT_WEIGHTS);
  const riskResult = evaluateRisks(baseStudent, DEFAULT_RISK_THRESHOLDS);

  const fullStudent: Student = {
    ...(baseStudent as any),
    successScore: row.success_score !== null && row.success_score !== undefined ? Number(row.success_score) : scoreResult.successScore,
    successScoreBreakdown: row.success_score_breakdown && Object.keys(row.success_score_breakdown).length > 0 ? row.success_score_breakdown : scoreResult.breakdown,
    dataCompleteness: row.data_completeness !== null && row.data_completeness !== undefined ? Number(row.data_completeness) : scoreResult.dataCompleteness,
    isProvisionalScore: row.is_provisional_score !== undefined ? Boolean(row.is_provisional_score) : scoreResult.isProvisional,
    academicRisk: (row.academic_risk as any) || riskResult.academicRisk,
    academicRiskReasons: Array.isArray(row.academic_risk_reasons) ? row.academic_risk_reasons : riskResult.academicRiskReasons,
    placementReadinessScore: row.placement_readiness_score !== null && row.placement_readiness_score !== undefined ? Number(row.placement_readiness_score) : riskResult.placementReadinessScore,
    placementRisk: (row.placement_risk as any) || riskResult.placementRisk,
    placementRiskReasons: Array.isArray(row.placement_risk_reasons) ? row.placement_risk_reasons : riskResult.placementRiskReasons,
    applicableSegments: Array.isArray(row.applicable_segments) ? row.applicable_segments : [],
  };

  if (!fullStudent.applicableSegments || fullStudent.applicableSegments.length === 0) {
    fullStudent.applicableSegments = evaluateStudentSegments(fullStudent);
  }

  return fullStudent;
}

export const SupabaseService = {
  /**
   * Tests Supabase connectivity and reports database count or error.
   */
  async checkConnection(): Promise<ConnectionTestResult> {
    if (!isSupabaseConfigured()) {
      return {
        connected: false,
        count: 0,
        tableExists: false,
        error: 'Supabase credentials not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      };
    }

    const client = getSupabaseClient();
    if (!client) {
      return {
        connected: false,
        count: 0,
        tableExists: false,
        error: 'Failed to initialize Supabase client instance.',
      };
    }

    try {
      const { count, error } = await client
        .from('campuspulse_students')
        .select('id', { count: 'exact', head: true });

      if (error) {
        // Table might not exist yet
        const isTableMissing =
          error.code === '42P01' || error.message.toLowerCase().includes('relation') || error.message.toLowerCase().includes('not exist');
        return {
          connected: true,
          count: 0,
          tableExists: !isTableMissing,
          error: isTableMissing
            ? 'Connected to Supabase, but "campuspulse_students" table does not exist. Please run the provided SQL migration in the Supabase SQL Editor.'
            : `Supabase query error: ${error.message}`,
        };
      }

      return {
        connected: true,
        count: count ?? 0,
        tableExists: true,
      };
    } catch (err: any) {
      return {
        connected: false,
        count: 0,
        tableExists: false,
        error: err?.message || 'Network connection failed while reaching Supabase.',
      };
    }
  },

  /**
   * Fetches all students from Supabase database.
   */
  async fetchStudents(): Promise<{ students: Student[]; error?: string }> {
    const client = getSupabaseClient();
    if (!client) {
      return { students: [], error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await client
        .from('campuspulse_students')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        return { students: [], error: error.message };
      }

      const mapped = (data || []).map(mapDbToStudent);
      return { students: mapped };
    } catch (err: any) {
      return { students: [], error: err?.message || 'Network error fetching students' };
    }
  },

  /**
   * Fetches student count from Supabase.
   */
  async getStudentCount(): Promise<number> {
    const client = getSupabaseClient();
    if (!client) return 0;
    try {
      const { count, error } = await client
        .from('campuspulse_students')
        .select('id', { count: 'exact', head: true });
      if (error) return 0;
      return count ?? 0;
    } catch {
      return 0;
    }
  },

  /**
   * Upserts a single student record.
   */
  async upsertStudent(student: Student): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const row = mapStudentToDb(student);
      const { error } = await client
        .from('campuspulse_students')
        .upsert(row, { onConflict: 'id' });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to upsert student' };
    }
  },

  /**
   * Batch upserts multiple students in chunks of 25 with progress reporting.
   */
  async batchUpsertStudents(
    students: Student[],
    onProgress?: (processed: number, total: number) => void
  ): Promise<{ successCount: number; failedCount: number; errors: string[] }> {
    const client = getSupabaseClient();
    if (!client) {
      return {
        successCount: 0,
        failedCount: students.length,
        errors: ['Supabase client is not configured'],
      };
    }

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    const chunkSize = 25;

    for (let i = 0; i < students.length; i += chunkSize) {
      const chunk = students.slice(i, i + chunkSize);
      const rows = chunk.map(mapStudentToDb);

      try {
        const { error } = await client
          .from('campuspulse_students')
          .upsert(rows, { onConflict: 'id' });

        if (error) {
          failedCount += chunk.length;
          errors.push(`Chunk [${i + 1}-${i + chunk.length}]: ${error.message}`);
        } else {
          successCount += chunk.length;
        }
      } catch (err: any) {
        failedCount += chunk.length;
        errors.push(`Chunk [${i + 1}-${i + chunk.length}]: ${err?.message || 'Network error'}`);
      }

      if (onProgress) {
        onProgress(Math.min(i + chunkSize, students.length), students.length);
      }
    }

    return { successCount, failedCount, errors };
  },

  /**
   * Deletes a student by ID.
   */
  async deleteStudent(studentId: string): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await client
        .from('campuspulse_students')
        .delete()
        .eq('id', studentId);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete student' };
    }
  },

  /**
   * Fetches all interventions from Supabase.
   */
  async fetchInterventions(): Promise<{ interventions: Intervention[]; error?: string }> {
    const client = getSupabaseClient();
    if (!client) {
      return { interventions: [], error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await client
        .from('campuspulse_interventions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { interventions: [], error: error.message };
      }

      const mapped: Intervention[] = (data || []).map((row: DbInterventionRow) => ({
        id: row.id,
        studentId: row.student_id,
        studentName: row.student_name,
        studentDepartment: row.student_department as Department,
        issue: row.issue,
        recommendedAction: row.recommended_action,
        assignedMentor: row.assigned_mentor,
        priority: row.priority as any,
        createdAt: row.created_at,
        targetDate: row.target_date,
        status: row.status as any,
        notes: row.notes || '',
        followUpDate: row.follow_up_date || undefined,
        updatedAt: row.updated_at || row.created_at,
      }));

      return { interventions: mapped };
    } catch (err: any) {
      return { interventions: [], error: err?.message || 'Failed to fetch interventions' };
    }
  },

  /**
   * Upserts an intervention record.
   */
  async upsertIntervention(inv: Intervention): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const row: DbInterventionRow = {
        id: inv.id,
        student_id: inv.studentId,
        student_name: inv.studentName,
        student_department: inv.studentDepartment,
        issue: inv.issue,
        recommended_action: inv.recommendedAction,
        assigned_mentor: inv.assignedMentor,
        priority: inv.priority,
        created_at: inv.createdAt,
        target_date: inv.targetDate,
        status: inv.status,
        notes: inv.notes || null,
        follow_up_date: inv.followUpDate || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await client
        .from('campuspulse_interventions')
        .upsert(row, { onConflict: 'id' });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to upsert intervention' };
    }
  },

  /**
   * Deletes an intervention record by ID.
   */
  async deleteIntervention(id: string): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await client
        .from('campuspulse_interventions')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete intervention' };
    }
  },
};
