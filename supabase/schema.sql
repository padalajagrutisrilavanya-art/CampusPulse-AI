-- ==============================================================================
-- CampusPulse AI — Smart Student Success & Campus Analytics Platform
-- Supabase PostgreSQL Schema & Migration Script
-- Version: 1.0.0
-- Security: Row Level Security (RLS) enabled on all tables
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE department_type AS ENUM ('CSE', 'ECE', 'EEE', 'IT', 'MECH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE academic_risk_level AS ENUM ('High', 'Medium', 'Low', 'Insufficient Data');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE placement_risk_level AS ENUM ('High', 'Medium', 'Low', 'Insufficient Data');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE intervention_status AS ENUM ('Pending', 'In Progress', 'Completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE priority_level AS ENUM ('High', 'Medium', 'Low');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL DEFAULT '',
    department TEXT NOT NULL,
    year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 4),
    semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
    section TEXT NOT NULL DEFAULT 'A',
    mentor_name TEXT NOT NULL DEFAULT 'Assigned Faculty Mentor',
    avatar_url TEXT,

    -- Academic metrics
    cgpa NUMERIC(4, 2) CHECK (cgpa >= 0.0 AND cgpa <= 10.0),
    prev_cgpa NUMERIC(4, 2) CHECK (prev_cgpa >= 0.0 AND prev_cgpa <= 10.0),
    backlogs INTEGER NOT NULL DEFAULT 0 CHECK (backlogs >= 0),
    semester_marks JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Attendance metrics
    attendance NUMERIC(5, 2) CHECK (attendance >= 0.0 AND attendance <= 100.0),
    course_attendance JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- LMS metrics
    lms_logins_per_week NUMERIC(5, 2),
    assignment_completion_rate NUMERIC(5, 2) CHECK (assignment_completion_rate >= 0.0 AND assignment_completion_rate <= 100.0),
    video_watch_percentage NUMERIC(5, 2) CHECK (video_watch_percentage >= 0.0 AND video_watch_percentage <= 100.0),
    last_lms_active_date DATE,

    -- Campus engagement metrics
    club_participation_count INTEGER DEFAULT 0,
    event_participation_count INTEGER DEFAULT 0,
    has_leadership_role BOOLEAN NOT NULL DEFAULT FALSE,
    sports_or_cultural BOOLEAN NOT NULL DEFAULT FALSE,

    -- Placement metrics
    aptitude_score NUMERIC(5, 2) CHECK (aptitude_score >= 0.0 AND aptitude_score <= 100.0),
    coding_score NUMERIC(5, 2) CHECK (coding_score >= 0.0 AND coding_score <= 100.0),
    mock_interview_score NUMERIC(5, 2) CHECK (mock_interview_score >= 0.0 AND mock_interview_score <= 100.0),
    resume_score NUMERIC(5, 2) CHECK (resume_score >= 0.0 AND resume_score <= 100.0),
    internship_status TEXT NOT NULL DEFAULT 'Not Started' CHECK (internship_status IN ('Completed', 'In Progress', 'Not Started')),
    placed_status TEXT NOT NULL DEFAULT 'Not Placed' CHECK (placed_status IN ('Placed', 'In Process', 'Not Placed', 'Higher Studies')),
    target_company_tier TEXT NOT NULL DEFAULT 'IT Services',

    -- Skills & qualitative notes
    technical_skill NUMERIC(4, 2),
    soft_skill NUMERIC(4, 2),
    skills_list JSONB NOT NULL DEFAULT '[]'::jsonb,
    mentor_feedback JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Calculated metrics (synced from scoring & risk engines)
    success_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    success_score_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    data_completeness NUMERIC(5, 2) NOT NULL DEFAULT 100.0,
    is_provisional_score BOOLEAN NOT NULL DEFAULT FALSE,
    academic_risk TEXT NOT NULL DEFAULT 'Low',
    academic_risk_reasons TEXT[] NOT NULL DEFAULT '{}'::text[],
    placement_readiness_score NUMERIC(5, 2),
    placement_risk TEXT NOT NULL DEFAULT 'Low',
    placement_risk_reasons TEXT[] NOT NULL DEFAULT '{}'::text[],
    applicable_segments TEXT[] NOT NULL DEFAULT '{}'::text[],

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. INTERVENTIONS TABLE
CREATE TABLE IF NOT EXISTS public.interventions (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_department TEXT NOT NULL,
    issue TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    assigned_mentor TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'High' CHECK (priority IN ('High', 'Medium', 'Low')),
    created_at DATE NOT NULL DEFAULT CURRENT_DATE,
    target_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
    notes TEXT NOT NULL DEFAULT '',
    follow_up_date DATE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CONFIGURATION: SCORING WEIGHTS TABLE
CREATE TABLE IF NOT EXISTS public.scoring_weights (
    id TEXT PRIMARY KEY DEFAULT 'default_weights',
    academics NUMERIC(5, 2) NOT NULL DEFAULT 30.0,
    attendance NUMERIC(5, 2) NOT NULL DEFAULT 20.0,
    lms NUMERIC(5, 2) NOT NULL DEFAULT 10.0,
    campus NUMERIC(5, 2) NOT NULL DEFAULT 10.0,
    placement NUMERIC(5, 2) NOT NULL DEFAULT 20.0,
    skills NUMERIC(5, 2) NOT NULL DEFAULT 10.0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. CONFIGURATION: RISK THRESHOLDS TABLE
CREATE TABLE IF NOT EXISTS public.risk_thresholds (
    id TEXT PRIMARY KEY DEFAULT 'default_thresholds',
    academic_high_attendance NUMERIC(5, 2) NOT NULL DEFAULT 65.0,
    academic_high_cgpa NUMERIC(4, 2) NOT NULL DEFAULT 5.0,
    academic_high_backlogs INTEGER NOT NULL DEFAULT 3,
    academic_med_attendance NUMERIC(5, 2) NOT NULL DEFAULT 75.0,
    academic_med_cgpa NUMERIC(4, 2) NOT NULL DEFAULT 6.0,
    academic_med_backlogs INTEGER NOT NULL DEFAULT 1,
    placement_high_cutoff NUMERIC(5, 2) NOT NULL DEFAULT 40.0,
    placement_med_cutoff NUMERIC(5, 2) NOT NULL DEFAULT 60.0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. AUDIT & IMPORT HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.import_history (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    file_name TEXT NOT NULL,
    data_type TEXT NOT NULL,
    total_rows INTEGER NOT NULL DEFAULT 0,
    successful_rows INTEGER NOT NULL DEFAULT 0,
    failed_rows INTEGER NOT NULL DEFAULT 0,
    errors TEXT[] NOT NULL DEFAULT '{}'::text[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. INDEXES FOR HIGH QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_students_department ON public.students (department);
CREATE INDEX IF NOT EXISTS idx_students_year_semester ON public.students (year, semester);
CREATE INDEX IF NOT EXISTS idx_students_academic_risk ON public.students (academic_risk);
CREATE INDEX IF NOT EXISTS idx_students_placement_risk ON public.students (placement_risk);
CREATE INDEX IF NOT EXISTS idx_students_cgpa ON public.students (cgpa);
CREATE INDEX IF NOT EXISTS idx_students_attendance ON public.students (attendance);
CREATE INDEX IF NOT EXISTS idx_interventions_student_id ON public.interventions (student_id);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON public.interventions (status);
CREATE INDEX IF NOT EXISTS idx_interventions_assigned_mentor ON public.interventions (assigned_mentor);

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;

-- Anonymous and Authenticated Read Access Policies
CREATE POLICY "Allow public read on students" ON public.students
    FOR SELECT USING (true);

CREATE POLICY "Allow public read on interventions" ON public.interventions
    FOR SELECT USING (true);

CREATE POLICY "Allow public read on scoring_weights" ON public.scoring_weights
    FOR SELECT USING (true);

CREATE POLICY "Allow public read on risk_thresholds" ON public.risk_thresholds
    FOR SELECT USING (true);

CREATE POLICY "Allow public read on import_history" ON public.import_history
    FOR SELECT USING (true);

-- Permissive demo/admin write policies (allows client sync when anon key is provided)
CREATE POLICY "Allow authenticated or anon write on students" ON public.students
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated or anon write on interventions" ON public.interventions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated or anon write on scoring_weights" ON public.scoring_weights
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated or anon write on risk_thresholds" ON public.risk_thresholds
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated or anon write on import_history" ON public.import_history
    FOR ALL USING (true) WITH CHECK (true);

-- 10. INITIAL SEED CONFIGURATION ROWS
INSERT INTO public.scoring_weights (id, academics, attendance, lms, campus, placement, skills)
VALUES ('default_weights', 30.0, 20.0, 10.0, 10.0, 20.0, 10.0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.risk_thresholds (
    id, academic_high_attendance, academic_high_cgpa, academic_high_backlogs,
    academic_med_attendance, academic_med_cgpa, academic_med_backlogs,
    placement_high_cutoff, placement_med_cutoff
)
VALUES ('default_thresholds', 65.0, 5.0, 3, 75.0, 6.0, 1, 40.0, 60.0)
ON CONFLICT (id) DO NOTHING;
