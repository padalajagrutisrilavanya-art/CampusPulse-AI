# CampusPulse AI — Smart Student Success & Campus Analytics Platform

CampusPulse AI is an enterprise-grade, responsive React + TypeScript analytics platform built for university leadership, faculty mentors, and placement cells. It features a deterministic Explainable Analytics Engine, configurable multidimensional student success scoring, rule-based academic & placement early warning risk screening, and safe multi-source CSV data integration.

---

## Key Architectural Principles

1. **Client-Side Autonomy:** Runs entirely in modern browsers (and locally via Vite in VS Code) without requiring Firebase, external databases, or third-party cloud API keys.
2. **Deterministic & Seeded:** Features a synthetic seed dataset of 125 realistic students across 5 engineering departments (CSE, ECE, EEE, IT, MECH) with reproducible traits, semester progression, backlogs, and placement scores.
3. **Persistent Local State:** All score recalculations, CSV imports, student additions, and mentor interventions persist in `localStorage` through a dedicated `StorageService`.
4. **Transparent Explainability:** Scores and risk classifications avoid black-box opacity. The platform shows exact normalized component scores, nominal vs. effective weights, and quantitative trigger criteria (e.g. `Attendance < 65%`, `Backlogs ≥ 3`, `CGPA < 5.0`).
5. **Proportional Weight Renormalization:** When student profiles have missing data streams (e.g., pending placement tests or LMS records), available weights are proportionally renormalized to 100% and flagged with a `Provisional` badge.

---

## Pages & Feature Modules

1. **Overview Dashboard (`/`):** Real-time calculated KPIs (Total Students, Average Success Score, Academic Risk counts, Placement Risk, Attendance, CGPA, Intervention Completion Rate). Interactive Recharts visualizations (Risk Donut, Score Histogram, Department Benchmarks, Attendance vs. CGPA Scatter, Placement Tiers, Semester Trends, Risk Triggers). Local deterministic Explainable Analytics signal cards.
2. **Student Directory (`/students`):** Searchable, sortable, paginated student roster with department, year, semester, risk, and data completeness filters, CSV export, and Add Student modal.
3. **Student 360° Profile (`/students/:id`):** Deep audit breakdown with Success Score component weights table, semester SGPA progression chart, course-level attendance percentages, digital LMS metrics, co-curricular activities, placement test scores, skills matrix, faculty feedback notes, and risk audit explanations.
4. **At-Risk Students (`/at-risk`):** Dedicated early-warning triage queue with trigger filtering (`Attendance < 65%`, `CGPA < 5.0`, `Backlogs ≥ 3`, `Performance Drop ≥ 0.5`) and one-click action plan creation.
5. **Placement Readiness (`/placement`):** Recruiter company tier simulation (Dream Tier, Core Engineering, IT Services), departmental skills gap analysis, and high-risk student upskilling pathways.
6. **Student Segmentation (`/segmentation`):** 8 multi-factor data cohorts with matching student rosters and cohort CSV exports.
7. **Data Integration (`/data-integration`):** Multi-domain CSV import workflows (Academic, Attendance, LMS, Engagement, Placement, Skills, Full Roster) with Papa Parse, Zod schema validation, duplicate ID detection, downloadable templates, and safe student_id merging.
8. **Action Plans & Interventions (`/interventions`):** Full CRUD for student intervention cases, assigned faculty mentors, target dates, priorities, and status tracking.
9. **Reports & Exports (`/reports`):** Pre-built CSV exports (Risk Report, Department Benchmark, Interventions Ledger, Data Quality Audit) and a browser print-friendly executive briefing report.
10. **Settings & Scoring (`/settings`):** Configurable weights (Academics, Attendance, LMS, Campus, Placement, Skills) with sum validation to 100%, customizable risk thresholds, and one-click Demo Data Reset.
11. **Demo Role Login (`/login`):** Simulated role selection for Administrator, Faculty / Mentor, and Placement Officer.

---

## Setup & Local Execution Instructions

### Prerequisites
- Node.js (v18 or newer recommended)
- npm or pnpm

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Open browser
# Navigate to http://localhost:3000
```

---

## Test & Verification Checklist

- [x] **Initial Data Seeding:** 125 students across CSE, ECE, EEE, IT, and MECH are seeded deterministically with realistic metrics.
- [x] **KPI Integrity:** All dashboard metrics (average CGPA, attendance, success score, risk counts) update dynamically when filters or data change.
- [x] **Chart Interactivity:** Clicking risk categories navigates to the pre-filtered student roster.
- [x] **Success Score Calculation:** CGPA is normalized (CGPA × 10), weights sum to 100%, and missing components trigger proportional weight renormalization and provisional badges.
- [x] **Risk Engine Triggers:** High Academic Risk activates on `attendance < 65%`, `cgpa < 5.0`, or `backlogs >= 3` with human-readable explanations.
- [x] **Search & Navigation:** Global student search in top navbar instantly surfaces matching students by name, ID, or department.
- [x] **CSV Data Sync:** CSV templates download correctly; invalid CSV rows report line errors; safe merge updates student records without overwriting other domains.
- [x] **Action Plans (Interventions):** Interventions can be created, updated, status toggled, and deleted with immediate local storage persistence.
- [x] **Print-Friendly Executive Report:** Generates clean, printer-formatted executive briefing suitable for browser Print / Save as PDF.
- [x] **Demo State Reset:** Clicking "Reset Demo Data" restores pristine 125-student seed dataset.

---

## Supabase PostgreSQL Cloud Integration & Migration

CampusPulse AI includes complete PostgreSQL database schema definition, security policies, and migration logic ready to connect to a Supabase project when desired.

### Supabase Architecture:
- **Schema File:** `supabase/schema.sql` and `supabase/migrations/20261009000000_init_campus_pulse.sql`.
- **Database Tables:**
  1. `students`: 38 columns containing all academic, attendance, LMS, placement, and calculated risk metrics with JSONB arrays for semester marks and course breakdowns.
  2. `interventions`: Mentoring cases, target dates, priorities, and progress notes with foreign key constraint to `students(id)`.
  3. `scoring_weights`: Configurable success score weights.
  4. `risk_thresholds`: Configurable early-warning boundary cutoffs.
  5. `import_history`: Audit trail for all CSV batch ingestions.
- **Security & RLS:** All tables have Row Level Security (`ENABLE ROW LEVEL SECURITY`) activated with read and write policies for public and authenticated roles.
- **Indexes:** High-performance B-Tree indexes created on `department`, `academic_risk`, `placement_risk`, `cgpa`, `attendance`, and `interventions.student_id`.

### Manual Steps to Connect Supabase:
1. **Create Supabase Project:** Sign in to [Supabase](https://supabase.com) and create a new project.
2. **Execute SQL Schema:** Navigate to the **SQL Editor** tab in your Supabase dashboard, copy the contents of `supabase/schema.sql`, and execute it.
3. **Configure Environment Variables:**
   Add your project credentials to `.env` or in the in-app Settings panel:
   ```env
   VITE_SUPABASE_URL="https://your-project-id.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
   ```
4. **Test Connection & Run Migration:**
   - Go to **Settings & Scoring** -> **Supabase Cloud PostgreSQL & Migration Hub**.
   - Click **Test Connection** to verify database status.
   - Click **Migrate 125 Students to Cloud** to push local records to your Supabase PostgreSQL database.

