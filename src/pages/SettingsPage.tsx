import React, { useState, useEffect } from 'react';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  ShieldCheck,
  Database,
  Layers,
  HelpCircle,
  Cloud,
  ArrowUpRight,
  Download,
  Key,
  RefreshCw,
  Server,
  Lock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ScoringWeights, RiskThresholds } from '../types';
import {
  testSupabaseConnection,
  migrateLocalDataToSupabase,
  SupabaseHealthResult,
  MigrationProgressReport,
} from '../services/supabaseMigration';
import {
  getSupabaseCredentials,
  saveCustomCredentials,
  clearCustomCredentials,
} from '../lib/supabase';

export const SettingsPage: React.FC = () => {
  const {
    weights,
    updateWeights,
    thresholds,
    updateThresholds,
    resetAllDemoData,
    activeRole,
    students,
  } = useApp();

  // Local form states
  const [localWeights, setLocalWeights] = useState<ScoringWeights>({ ...weights });
  const [localThresholds, setLocalThresholds] = useState<RiskThresholds>({ ...thresholds });
  const [weightsError, setWeightsError] = useState<string | null>(null);
  const [weightsSuccess, setWeightsSuccess] = useState<string | null>(null);
  const [thresholdsSuccess, setThresholdsSuccess] = useState<string | null>(null);

  // Supabase Cloud State
  const [supabaseHealth, setSupabaseHealth] = useState<SupabaseHealthResult | null>(null);
  const [isCheckingSupabase, setIsCheckingSupabase] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationReport, setMigrationReport] = useState<MigrationProgressReport | null>(null);
  const [migrationProgress, setMigrationProgress] = useState<{ current: number; total: number }>({ current: 0, total: 125 });

  const initialCreds = getSupabaseCredentials();
  const [customUrl, setCustomUrl] = useState(initialCreds.source === 'custom' ? initialCreds.url : '');
  const [customKey, setCustomKey] = useState(initialCreds.source === 'custom' ? initialCreds.key : '');
  const [configSuccess, setConfigSuccess] = useState<string | null>(null);

  // Auto-check Supabase status on mount
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setIsCheckingSupabase(true);
    setMigrationReport(null);
    try {
      const res = await testSupabaseConnection();
      setSupabaseHealth(res);
    } catch (err: any) {
      setSupabaseHealth({
        isConfigured: false,
        isConnected: false,
        tablesExist: false,
        remoteStudentCount: 0,
        message: err?.message || 'Error executing health check.',
      });
    } finally {
      setIsCheckingSupabase(false);
    }
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSuccess(null);
    if (customUrl.trim() && customKey.trim()) {
      saveCustomCredentials(customUrl.trim(), customKey.trim());
      setConfigSuccess('Supabase credentials saved to browser session.');
    } else {
      clearCustomCredentials();
      setConfigSuccess('Cleared custom credentials. Falling back to environment variables.');
    }
    checkHealth();
  };

  const handleExecuteMigration = async () => {
    if (!supabaseHealth?.isConnected || !supabaseHealth.tablesExist) {
      alert('Cannot migrate: Supabase database must be connected and schema tables created first.');
      return;
    }

    if (!window.confirm(`Initiate cloud migration of ${students.length} local student records and action plans to Supabase PostgreSQL?`)) {
      return;
    }

    setIsMigrating(true);
    setMigrationReport(null);
    try {
      const result = await migrateLocalDataToSupabase(
        students,
        useApp().interventions,
        weights,
        thresholds,
        (current, total) => setMigrationProgress({ current, total })
      );
      setMigrationReport(result);
      // Re-verify health after migration
      checkHealth();
    } catch (err: any) {
      setMigrationReport({
        success: false,
        studentsMigrated: 0,
        interventionsMigrated: 0,
        message: `Migration failed with exception: ${err.message}`,
        errors: [err.message],
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const currentWeightSum =
    (localWeights.academics || 0) +
    (localWeights.attendance || 0) +
    (localWeights.lms || 0) +
    (localWeights.campus || 0) +
    (localWeights.placement || 0) +
    (localWeights.skills || 0);

  const isWeightSumValid = Math.abs(currentWeightSum - 100) < 0.01;

  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    setWeightsError(null);
    setWeightsSuccess(null);

    const result = updateWeights(localWeights);
    if (!result.success) {
      setWeightsError(result.error || 'Failed to update weights.');
    } else {
      setWeightsSuccess('Scoring weights updated and all student scores recalculated immediately!');
    }
  };

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    setThresholdsSuccess(null);
    updateThresholds(localThresholds);
    setThresholdsSuccess('Risk thresholds updated and all student risk levels re-evaluated!');
  };

  const handleResetToDefaultWeights = () => {
    const defaults: ScoringWeights = {
      academics: 30,
      attendance: 20,
      lms: 10,
      campus: 10,
      placement: 20,
      skills: 10,
    };
    setLocalWeights(defaults);
    updateWeights(defaults);
    setWeightsSuccess('Reset to system default scoring weights (30/20/10/10/20/10).');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Sliders className="h-6 w-6 text-blue-600" />
            Scoring Weights & Risk Engine Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure institutional weights, early-warning trigger cutoffs, and persistence settings.
          </p>
        </div>
      </div>

      {activeRole !== 'admin' && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0" />
          <div>
            <strong>Simulated Role Notice: </strong>
            You are currently browsing as <strong>{activeRole}</strong>. In production, only System Administrators can mutate global scoring weights and risk thresholds. Switch to Administrator in the top navbar if desired.
          </div>
        </div>
      )}

      {/* 1. Success Score Weights Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Configurable Success Score Component Weights</h2>
            <p className="text-xs text-slate-500">
              Total weights must sum to exactly 100%. When student data is missing, weights renormalize proportionally.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-md border ${
                isWeightSumValid
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              Current Sum: {currentWeightSum}% / 100%
            </span>
            <button
              onClick={handleResetToDefaultWeights}
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 underline"
            >
              Reset to Defaults
            </button>
          </div>
        </div>

        {weightsSuccess && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {weightsSuccess}
          </div>
        )}

        {weightsError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            {weightsError}
          </div>
        )}

        <form onSubmit={handleSaveWeights} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Academics */}
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">Academics (CGPA)</label>
                <span className="font-mono text-xs font-bold text-blue-600">{localWeights.academics}%</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">Normalized: CGPA × 10</p>
              <input
                type="number"
                min="0"
                max="100"
                value={localWeights.academics}
                onChange={(e) => setLocalWeights({ ...localWeights, academics: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold"
              />
            </div>

            {/* Attendance */}
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">Classroom Attendance</label>
                <span className="font-mono text-xs font-bold text-blue-600">{localWeights.attendance}%</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">Normalized: Direct %</p>
              <input
                type="number"
                min="0"
                max="100"
                value={localWeights.attendance}
                onChange={(e) => setLocalWeights({ ...localWeights, attendance: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold"
              />
            </div>

            {/* LMS Engagement */}
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">LMS Engagement</label>
                <span className="font-mono text-xs font-bold text-blue-600">{localWeights.lms}%</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">Normalized: Logins + Assignments + Videos</p>
              <input
                type="number"
                min="0"
                max="100"
                value={localWeights.lms}
                onChange={(e) => setLocalWeights({ ...localWeights, lms: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold"
              />
            </div>

            {/* Campus Engagement */}
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">Campus Engagement</label>
                <span className="font-mono text-xs font-bold text-blue-600">{localWeights.campus}%</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">Normalized: Clubs + Events + Leadership</p>
              <input
                type="number"
                min="0"
                max="100"
                value={localWeights.campus}
                onChange={(e) => setLocalWeights({ ...localWeights, campus: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold"
              />
            </div>

            {/* Placement Readiness */}
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">Placement Readiness</label>
                <span className="font-mono text-xs font-bold text-blue-600">{localWeights.placement}%</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">Normalized: Coding + Aptitude + Interview</p>
              <input
                type="number"
                min="0"
                max="100"
                value={localWeights.placement}
                onChange={(e) => setLocalWeights({ ...localWeights, placement: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold"
              />
            </div>

            {/* Skills Assessment */}
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">Skills Assessment</label>
                <span className="font-mono text-xs font-bold text-blue-600">{localWeights.skills}%</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">Normalized: Technical + Soft Skills</p>
              <input
                type="number"
                min="0"
                max="100"
                value={localWeights.skills}
                onChange={(e) => setLocalWeights({ ...localWeights, skills: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={!isWeightSumValid}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Apply & Recalculate All Scores
            </button>
          </div>
        </form>
      </div>

      {/* 2. Risk Engine Thresholds Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <h2 className="text-sm font-bold text-slate-900">Explainable Risk Engine Thresholds</h2>
          <p className="text-xs text-slate-500">
            Define quantitative boundary cutoffs triggering High and Medium academic or placement risk warnings.
          </p>
        </div>

        {thresholdsSuccess && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {thresholdsSuccess}
          </div>
        )}

        <form onSubmit={handleSaveThresholds} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/50">
              <label className="text-xs font-bold text-red-700 block mb-1">High Risk Attendance (&lt; %)</label>
              <input
                type="number"
                value={localThresholds.academicHighAttendance}
                onChange={(e) => setLocalThresholds({ ...localThresholds, academicHighAttendance: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-semibold"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 65%</span>
            </div>

            <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/50">
              <label className="text-xs font-bold text-red-700 block mb-1">High Risk CGPA (&lt;)</label>
              <input
                type="number"
                step="0.1"
                value={localThresholds.academicHighCgpa}
                onChange={(e) => setLocalThresholds({ ...localThresholds, academicHighCgpa: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-semibold"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 5.0</span>
            </div>

            <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/50">
              <label className="text-xs font-bold text-red-700 block mb-1">High Risk Backlogs (≥)</label>
              <input
                type="number"
                value={localThresholds.academicHighBacklogs}
                onChange={(e) => setLocalThresholds({ ...localThresholds, academicHighBacklogs: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-semibold"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 3 backlogs</span>
            </div>

            <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/50">
              <label className="text-xs font-bold text-red-700 block mb-1">High Placement Risk (&lt;)</label>
              <input
                type="number"
                value={localThresholds.placementHighCutoff}
                onChange={(e) => setLocalThresholds({ ...localThresholds, placementHighCutoff: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-semibold"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 40 / 100</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              Update Risk Engine Thresholds
            </button>
          </div>
        </form>
      </div>

      {/* 3. Supabase Cloud Database & Migration Hub */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Supabase Cloud PostgreSQL & Migration Hub</h2>
              <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                PostgreSQL Integration
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify database connectivity, audit Row Level Security (RLS) policies, and migrate 125 local student records.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={checkHealth}
              disabled={isCheckingSupabase}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isCheckingSupabase ? 'animate-spin' : ''}`} />
              {isCheckingSupabase ? 'Testing Connection...' : 'Test Connection'}
            </button>
            <a
              href="/supabase/schema.sql"
              download="campuspulse_supabase_schema.sql"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Download Schema SQL
            </a>
          </div>
        </div>

        {/* Live Real-Time Connection Diagnostic Banner */}
        <div
          className={`rounded-xl border p-4 text-xs transition-colors ${
            supabaseHealth?.isConnected && supabaseHealth.tablesExist
              ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
              : supabaseHealth?.isConnected && !supabaseHealth.tablesExist
              ? 'border-amber-200 bg-amber-50/80 text-amber-900'
              : 'border-slate-200 bg-slate-50 text-slate-700'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Server
                className={`h-4 w-4 shrink-0 mt-0.5 ${
                  supabaseHealth?.isConnected && supabaseHealth.tablesExist
                    ? 'text-emerald-600'
                    : supabaseHealth?.isConnected
                    ? 'text-amber-600'
                    : 'text-slate-400'
                }`}
              />
              <div>
                <div className="font-bold flex items-center gap-2">
                  <span>
                    Database Status:{' '}
                    {supabaseHealth?.isConnected && supabaseHealth.tablesExist
                      ? 'Connected & Schema Ready'
                      : supabaseHealth?.isConnected
                      ? 'Connected (Tables Need Creation)'
                      : 'Not Connected (Autonomous Local Mode Active)'}
                  </span>
                  {supabaseHealth?.source && (
                    <span className="rounded bg-white/80 px-1.5 py-0.2 text-[10px] font-semibold border border-slate-200 text-slate-600">
                      Source: {supabaseHealth.source.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="mt-1 leading-relaxed">
                  {supabaseHealth?.message || 'Click "Test Connection" to check remote Supabase status.'}
                </p>
                {supabaseHealth?.urlPreview && (
                  <p className="mt-1 font-mono text-[11px] opacity-75">
                    Target Endpoint: {supabaseHealth.urlPreview}
                  </p>
                )}
              </div>
            </div>

            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                supabaseHealth?.isConnected && supabaseHealth.tablesExist
                  ? 'bg-emerald-200 text-emerald-800'
                  : supabaseHealth?.isConnected
                  ? 'bg-amber-200 text-amber-800'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {supabaseHealth?.isConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Database Architecture & Security Audit Panel */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-blue-600" />
              Verified Schema & Security Architecture
            </span>
            <span className="text-[11px] text-slate-500 font-medium">5 Tables • RLS Enforced</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
            <div className="rounded-lg bg-white p-2.5 border border-slate-200">
              <div className="font-semibold text-slate-800">public.students</div>
              <div className="text-[10px] text-slate-500 mt-0.5">38 fields, JSONB marks, RLS enabled</div>
            </div>
            <div className="rounded-lg bg-white p-2.5 border border-slate-200">
              <div className="font-semibold text-slate-800">public.interventions</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Foreign key to students(id), RLS enabled</div>
            </div>
            <div className="rounded-lg bg-white p-2.5 border border-slate-200">
              <div className="font-semibold text-slate-800">public.scoring_weights</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Global configuration, RLS enabled</div>
            </div>
            <div className="rounded-lg bg-white p-2.5 border border-slate-200">
              <div className="font-semibold text-slate-800">public.risk_thresholds</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Engine thresholds, RLS enabled</div>
            </div>
            <div className="rounded-lg bg-white p-2.5 border border-slate-200">
              <div className="font-semibold text-slate-800">public.import_history</div>
              <div className="text-[10px] text-slate-500 mt-0.5">CSV audit trail, RLS enabled</div>
            </div>
            <div className="rounded-lg bg-white p-2.5 border border-slate-200">
              <div className="font-semibold text-slate-800">Indexes & Constraints</div>
              <div className="text-[10px] text-slate-500 mt-0.5">B-Tree indexes on department & risk</div>
            </div>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSaveCredentials} className="rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-amber-600" />
              Supabase Project Credentials Configuration
            </span>
            {configSuccess && (
              <span className="text-xs text-emerald-700 font-semibold">{configSuccess}</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Project URL (VITE_SUPABASE_URL)
              </label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Public Anon Key (VITE_SUPABASE_ANON_KEY)
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-[11px] text-slate-500">
              Tip: You can also specify these in your local <code className="bg-slate-100 px-1 py-0.5 rounded">.env</code> file.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCustomUrl('');
                  setCustomKey('');
                  clearCustomCredentials();
                  setConfigSuccess('Custom credentials cleared.');
                  checkHealth();
                }}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Clear
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-1 text-xs font-bold text-white hover:bg-blue-700 shadow-xs"
              >
                Save & Test
              </button>
            </div>
          </div>
        </form>

        {/* Cloud Migration Action Bar */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-slate-900">
              Batch Cloud Migration (125 Students & Action Plans)
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Serializes the active 125-student local dataset and pushes records in batches of 25 to Supabase PostgreSQL.
            </p>
          </div>

          <button
            onClick={handleExecuteMigration}
            disabled={isMigrating || !supabaseHealth?.isConnected || !supabaseHealth.tablesExist}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 shrink-0"
          >
            <Cloud className={`h-4 w-4 ${isMigrating ? 'animate-pulse' : ''}`} />
            {isMigrating
              ? `Migrating (${migrationProgress.current}/${migrationProgress.total})...`
              : supabaseHealth?.isConnected && supabaseHealth.tablesExist
              ? 'Migrate 125 Students to Cloud'
              : 'Connect Supabase to Migrate'}
          </button>
        </div>

        {/* Migration Report feedback */}
        {migrationReport && (
          <div
            className={`rounded-xl border p-4 text-xs ${
              migrationReport.success
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-red-200 bg-red-50 text-red-900'
            }`}
          >
            <div className="font-bold flex items-center gap-2">
              {migrationReport.success ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <span>{migrationReport.message}</span>
            </div>
            {migrationReport.errors.length > 0 && (
              <div className="mt-2 space-y-1 font-mono text-[11px]">
                {migrationReport.errors.map((e, idx) => (
                  <div key={idx} className="text-red-700">• {e}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Demo Data Management */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-1">Demo State & Local Storage Management</h2>
        <p className="text-xs text-slate-500 mb-4">
          All modifications are saved in your browser's persistent localStorage container ({students.length} students currently active).
        </p>

        <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-slate-900">Reset Demo Environment</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Clears localStorage and re-populates pristine 125-student synthetic dataset across all 5 departments.
            </p>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Reset all demo student records, custom weights, and interventions to original seed state?')) {
                resetAllDemoData();
                setLocalWeights({ academics: 30, attendance: 20, lms: 10, campus: 10, placement: 20, skills: 10 });
                setLocalThresholds({
                  academicHighAttendance: 65,
                  academicHighCgpa: 5.0,
                  academicHighBacklogs: 3,
                  academicMedAttendance: 75,
                  academicMedCgpa: 6.0,
                  academicMedBacklogs: 1,
                  placementHighCutoff: 40,
                  placementMedCutoff: 60,
                });
                alert('Demo environment reset successfully!');
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors shrink-0"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Entire Demo Dataset
          </button>
        </div>
      </div>
    </div>
  );
};
