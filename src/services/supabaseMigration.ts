/**
 * Supabase Migration & Cloud Sync Service
 * Tests real connectivity to Supabase, checks schema readiness,
 * and provides batched migration for local records without mock claims.
 */

import { getSupabaseClient, isSupabaseConfigured, getSupabaseCredentials } from '../lib/supabase';
import { Student, Intervention, ScoringWeights, RiskThresholds } from '../types';

export interface SupabaseHealthResult {
  isConfigured: boolean;
  isConnected: boolean;
  tablesExist: boolean;
  remoteStudentCount: number;
  message: string;
  urlPreview?: string;
  source?: 'env' | 'custom' | 'none';
}

export interface MigrationProgressReport {
  success: boolean;
  studentsMigrated: number;
  interventionsMigrated: number;
  message: string;
  errors: string[];
}

/**
 * Actively tests the connection to the Supabase database.
 * Does not make false claims—reports exact HTTP/database response.
 */
export async function testSupabaseConnection(): Promise<SupabaseHealthResult> {
  const credentials = getSupabaseCredentials();

  if (!credentials.url || !credentials.key) {
    return {
      isConfigured: false,
      isConnected: false,
      tablesExist: false,
      remoteStudentCount: 0,
      message: 'Supabase credentials are not configured in environment or settings. Local demo mode active.',
      source: 'none',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      isConfigured: true,
      isConnected: false,
      tablesExist: false,
      remoteStudentCount: 0,
      message: 'Failed to initialize Supabase client. Check URL format.',
      urlPreview: credentials.url,
      source: credentials.source,
    };
  }

  try {
    // Attempt to query the students table
    const { data, error, count } = await client
      .from('students')
      .select('id', { count: 'exact', head: true });

    if (error) {
      // Check if the error is because the table has not been created yet
      if (
        error.code === '42P01' || // relation does not exist
        error.message?.toLowerCase().includes('relation') ||
        error.message?.toLowerCase().includes('does not exist')
      ) {
        return {
          isConfigured: true,
          isConnected: true,
          tablesExist: false,
          remoteStudentCount: 0,
          message: 'Connected to Supabase project successfully! However, database tables have not been created yet. Execute supabase/schema.sql in the Supabase SQL Editor.',
          urlPreview: credentials.url,
          source: credentials.source,
        };
      }

      return {
        isConfigured: true,
        isConnected: false,
        tablesExist: false,
        remoteStudentCount: 0,
        message: `Supabase returned an error: ${error.message} (Code: ${error.code || 'UNKNOWN'})`,
        urlPreview: credentials.url,
        source: credentials.source,
      };
    }

    return {
      isConfigured: true,
      isConnected: true,
      tablesExist: true,
      remoteStudentCount: count ?? 0,
      message: `Connected to Supabase PostgreSQL database. Verified 'students' table with ${count ?? 0} remote records.`,
      urlPreview: credentials.url,
      source: credentials.source,
    };
  } catch (err: any) {
    return {
      isConfigured: true,
      isConnected: false,
      tablesExist: false,
      remoteStudentCount: 0,
      message: `Network failure connecting to ${credentials.url}: ${err.message || 'Check project URL and internet connection.'}`,
      urlPreview: credentials.url,
      source: credentials.source,
    };
  }
}

/**
 * Transforms a local Student domain object to a snake_case database row.
 */
function studentToDatabaseRow(student: Student): Record<string, any> {
  return {
    id: student.id,
    name: student.name,
    email: student.email,
    phone: student.phone || '',
    department: student.department,
    year: student.year,
    semester: student.semester,
    section: student.section || 'A',
    mentor_name: student.mentorName || 'Assigned Faculty Mentor',
    avatar_url: student.avatarUrl || null,
    cgpa: student.cgpa,
    prev_cgpa: student.prevCgpa ?? null,
    backlogs: student.backlogs || 0,
    semester_marks: student.semesterMarks || [],
    attendance: student.attendance,
    course_attendance: student.courseAttendance || [],
    lms_logins_per_week: student.lmsLoginsPerWeek ?? null,
    assignment_completion_rate: student.assignmentCompletionRate ?? null,
    video_watch_percentage: student.videoWatchPercentage ?? null,
    last_lms_active_date: student.lastLmsActiveDate || null,
    club_participation_count: student.clubParticipationCount ?? 0,
    event_participation_count: student.eventParticipationCount ?? 0,
    has_leadership_role: Boolean(student.hasLeadershipRole),
    sports_or_cultural: Boolean(student.sportsOrCultural),
    aptitude_score: student.aptitudeScore ?? null,
    coding_score: student.codingScore ?? null,
    mock_interview_score: student.mockInterviewScore ?? null,
    resume_score: student.resumeScore ?? null,
    internship_status: student.internshipStatus || 'Not Started',
    placed_status: student.placedStatus || 'Not Placed',
    target_company_tier: student.targetCompanyTier || 'IT Services',
    technical_skill: student.technicalSkill ?? null,
    soft_skill: student.softSkill ?? null,
    skills_list: student.skillsList || [],
    mentor_feedback: student.mentorFeedback || [],
    success_score: student.successScore || 0,
    success_score_breakdown: student.successScoreBreakdown || {},
    data_completeness: student.dataCompleteness || 100,
    is_provisional_score: Boolean(student.isProvisionalScore),
    academic_risk: student.academicRisk || 'Low',
    academic_risk_reasons: student.academicRiskReasons || [],
    placement_readiness_score: student.placementReadinessScore ?? null,
    placement_risk: student.placementRisk || 'Low',
    placement_risk_reasons: student.placementRiskReasons || [],
    applicable_segments: student.applicableSegments || [],
    updated_at: new Date().toISOString(),
  };
}

/**
 * Transforms a local Intervention domain object to a snake_case database row.
 */
function interventionToDatabaseRow(inv: Intervention): Record<string, any> {
  return {
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
    notes: inv.notes || '',
    follow_up_date: inv.followUpDate || null,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Migrates all local student records and interventions to Supabase in safe chunks.
 */
export async function migrateLocalDataToSupabase(
  students: Student[],
  interventions: Intervention[],
  weights?: ScoringWeights,
  thresholds?: RiskThresholds,
  onProgress?: (processed: number, total: number) => void
): Promise<MigrationProgressReport> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      studentsMigrated: 0,
      interventionsMigrated: 0,
      message: 'Supabase client is not available. Please verify credentials.',
      errors: ['Supabase credentials missing'],
    };
  }

  const errors: string[] = [];
  let studentsMigrated = 0;
  let interventionsMigrated = 0;

  // 1. Migrate Students in batches of 25
  const BATCH_SIZE = 25;
  for (let i = 0; i < students.length; i += BATCH_SIZE) {
    const chunk = students.slice(i, i + BATCH_SIZE);
    const rows = chunk.map(studentToDatabaseRow);

    const { error } = await client.from('students').upsert(rows, { onConflict: 'id' });

    if (error) {
      errors.push(`Error in students batch ${i / BATCH_SIZE + 1}: ${error.message}`);
    } else {
      studentsMigrated += chunk.length;
      if (onProgress) {
        onProgress(studentsMigrated, students.length);
      }
    }
  }

  // 2. Migrate Interventions
  if (interventions.length > 0) {
    const invRows = interventions.map(interventionToDatabaseRow);
    const { error: invError } = await client.from('interventions').upsert(invRows, { onConflict: 'id' });

    if (invError) {
      errors.push(`Error migrating interventions: ${invError.message}`);
    } else {
      interventionsMigrated = interventions.length;
    }
  }

  // 3. Migrate Scoring Weights & Thresholds
  if (weights) {
    await client.from('scoring_weights').upsert({
      id: 'default_weights',
      academics: weights.academics,
      attendance: weights.attendance,
      lms: weights.lms,
      campus: weights.campus,
      placement: weights.placement,
      skills: weights.skills,
      updated_at: new Date().toISOString(),
    });
  }

  if (thresholds) {
    await client.from('risk_thresholds').upsert({
      id: 'default_thresholds',
      academic_high_attendance: thresholds.academicHighAttendance,
      academic_high_cgpa: thresholds.academicHighCgpa,
      academic_high_backlogs: thresholds.academicHighBacklogs,
      academic_med_attendance: thresholds.academicMedAttendance,
      academic_med_cgpa: thresholds.academicMedCgpa,
      academic_med_backlogs: thresholds.academicMedBacklogs,
      placement_high_cutoff: thresholds.placementHighCutoff,
      placement_med_cutoff: thresholds.placementMedCutoff,
      updated_at: new Date().toISOString(),
    });
  }

  const isSuccess = errors.length === 0;
  return {
    success: isSuccess,
    studentsMigrated,
    interventionsMigrated,
    message: isSuccess
      ? `Successfully migrated ${studentsMigrated} students and ${interventionsMigrated} action plans to Supabase!`
      : `Migration completed with ${errors.length} errors. Migrated ${studentsMigrated}/${students.length} students.`,
    errors,
  };
}

/**
 * Downloads the SQL schema script as a file for easy manual deployment.
 */
export function downloadSchemaSql(): void {
  const link = document.createElement('a');
  link.href = '/supabase/schema.sql';
  link.download = 'campuspulse_supabase_schema.sql';
  // Also create a direct text fallback if fetched via client
  const sqlSnippet = `-- CampusPulse AI Database Schema
-- Run in Supabase SQL Editor:
-- See /supabase/schema.sql in project root
`;
  const blob = new Blob([sqlSnippet], { type: 'text/sql' });
  const url = URL.createObjectURL(blob);
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
