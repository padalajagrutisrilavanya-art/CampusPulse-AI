import React, { useState, useEffect } from 'react';
import {
  Database,
  CloudUpload,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Modal } from './Modal';
import { useApp } from '../../context/AppContext';
import { MigrationService, MigrationPreview, MigrationResult } from '../../services/migrationService';
import { SupabaseService } from '../../services/supabaseService';
import { getSupabaseConfig } from '../../lib/supabase';

interface MigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMigrationComplete?: () => void;
}

export const MigrationModal: React.FC<MigrationModalProps> = ({
  isOpen,
  onClose,
  onMigrationComplete,
}) => {
  const { students } = useApp();
  const [preview, setPreview] = useState<MigrationPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; message: string }>({
    current: 0,
    total: 0,
    message: '',
  });
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [strategy, setStrategy] = useState<'upsert_all' | 'skip_duplicates'>('upsert_all');
  const [step, setStep] = useState<'preview' | 'migrating' | 'completed'>('preview');

  const config = getSupabaseConfig();

  const loadPreview = async () => {
    setIsLoadingPreview(true);
    setResult(null);
    try {
      const p = await MigrationService.prepareMigrationPreview(students);
      setPreview(p);
    } catch (e: any) {
      setPreview({
        localCount: students.length,
        cloudCount: 0,
        newToCloudCount: 0,
        existingInCloudCount: 0,
        canMigrate: false,
        cloudConnected: false,
        errorMessage: e?.message || 'Failed to inspect database state.',
        duplicateIds: [],
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStep('preview');
      loadPreview();
    }
  }, [isOpen, students]);

  const handleStartMigration = async () => {
    if (!preview || !preview.canMigrate) return;

    setStep('migrating');
    setIsMigrating(true);

    try {
      const res = await MigrationService.executeMigration(
        students,
        strategy,
        (p) => setProgress(p)
      );
      setResult(res);
      setStep('completed');
      if (onMigrationComplete) {
        onMigrationComplete();
      }
    } catch (err: any) {
      setResult({
        success: false,
        totalAttempted: students.length,
        successfullyMigrated: 0,
        skippedDuplicates: 0,
        failedCount: students.length,
        verifiedCloudCount: preview.cloudCount,
        errors: [err?.message || 'Migration encountered an unhandled exception.'],
        timestamp: new Date().toISOString(),
      });
      setStep('completed');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supabase Cloud Migration & Data Sync"
      subtitle="Safely transfer local browser student records to your Supabase PostgreSQL database."
      maxWidth="xl"
    >
      <div className="space-y-5">
        {/* Connection status header */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  preview?.cloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="text-xs font-bold text-slate-800">
                {preview?.cloudConnected ? 'Supabase Database Connected' : 'Supabase Not Connected'}
              </span>
            </div>
            <button
              onClick={loadPreview}
              disabled={isLoadingPreview || isMigrating}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingPreview ? 'animate-spin' : ''}`} />
              Refresh Status
            </button>
          </div>

          <div className="mt-2 text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
            <span>
              Config Source: <strong>{config.source.toUpperCase()}</strong>
            </span>
            {config.url && (
              <span className="truncate max-w-xs font-mono">
                URL: {config.url}
              </span>
            )}
          </div>
        </div>

        {/* Safety Guarantee Banner */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed text-[11px]">
            <strong>Zero Data-Loss Guarantee: </strong>
            Your {students.length} local records in <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">campuspulse_students_v1</code> will remain completely intact. Local records are never deleted or cleared during migration.
          </div>
        </div>

        {/* STEP 1: PREVIEW */}
        {step === 'preview' && (
          <div className="space-y-4">
            {isLoadingPreview ? (
              <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                <RefreshCw className="h-6 w-6 text-blue-600 animate-spin mx-auto" />
                <p>Auditing local records vs. Supabase database...</p>
              </div>
            ) : preview ? (
              <>
                {preview.errorMessage && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Database Attention Needed: </span>
                      {preview.errorMessage}
                    </div>
                  </div>
                )}

                {/* Statistics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Local Records</div>
                    <div className="mt-1 text-xl font-bold text-slate-900">{preview.localCount}</div>
                    <div className="text-[10px] text-slate-400">In browser storage</div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Cloud Records</div>
                    <div className="mt-1 text-xl font-bold text-blue-600">{preview.cloudCount}</div>
                    <div className="text-[10px] text-slate-400">Currently in Supabase</div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                    <div className="text-[10px] uppercase font-bold text-emerald-600">New to Cloud</div>
                    <div className="mt-1 text-xl font-bold text-emerald-600">{preview.newToCloudCount}</div>
                    <div className="text-[10px] text-slate-400">Will be created</div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                    <div className="text-[10px] uppercase font-bold text-amber-600">Existing IDs</div>
                    <div className="mt-1 text-xl font-bold text-amber-600">{preview.existingInCloudCount}</div>
                    <div className="text-[10px] text-slate-400">Duplicate / Matches</div>
                  </div>
                </div>

                {/* Conflict Resolution Strategy */}
                <div className="rounded-xl border border-slate-200 p-4 space-y-2 bg-slate-50/50">
                  <label className="text-xs font-bold text-slate-800 block">
                    Duplicate ID Conflict Resolution Strategy:
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="conflict_strategy"
                        value="upsert_all"
                        checked={strategy === 'upsert_all'}
                        onChange={() => setStrategy('upsert_all')}
                        className="mt-0.5 text-blue-600"
                      />
                      <div>
                        <strong>Safe Upsert (Recommended): </strong>
                        Insert new students and safely update matching IDs with latest local values.
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="conflict_strategy"
                        value="skip_duplicates"
                        checked={strategy === 'skip_duplicates'}
                        onChange={() => setStrategy('skip_duplicates')}
                        className="mt-0.5 text-blue-600"
                      />
                      <div>
                        <strong>Skip Existing Records: </strong>
                        Only upload new records; never overwrite any student already existing in the database.
                      </div>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500">
                    Ready to migrate {strategy === 'upsert_all' ? preview.localCount : preview.newToCloudCount} records.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!preview.canMigrate}
                      onClick={handleStartMigration}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                    >
                      <CloudUpload className="h-4 w-4" />
                      Begin Migration
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* STEP 2: MIGRATING IN PROGRESS */}
        {step === 'migrating' && (
          <div className="py-6 space-y-4">
            <div className="text-center space-y-1">
              <CloudUpload className="h-8 w-8 text-blue-600 animate-bounce mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">Synchronizing Records to Supabase...</h4>
              <p className="text-xs text-slate-500">{progress.message}</p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600 font-semibold">
                <span>Progress</span>
                <span>
                  {progress.current} / {progress.total} Records (
                  {progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{
                    width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Processing in chunks of 25 with atomic upserts to prevent payload throttling.
            </p>
          </div>
        )}

        {/* STEP 3: COMPLETED REPORT */}
        {step === 'completed' && result && (
          <div className="space-y-4">
            <div
              className={`rounded-xl border p-4 ${
                result.success
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-amber-200 bg-amber-50 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                )}
                <div>
                  <h4 className="text-xs font-bold">
                    {result.success
                      ? 'Migration & Verification Successfully Completed!'
                      : 'Migration Finished with Partial Results'}
                  </h4>
                  <p className="text-[11px] mt-0.5">
                    Verified total in Supabase PostgreSQL: <strong>{result.verifiedCloudCount} students</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Result Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Successfully Migrated</div>
                <div className="text-lg font-bold text-emerald-600 mt-0.5">{result.successfullyMigrated}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Skipped Duplicates</div>
                <div className="text-lg font-bold text-amber-600 mt-0.5">{result.skippedDuplicates}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Failed Rows</div>
                <div className="text-lg font-bold text-red-600 mt-0.5">{result.failedCount}</div>
              </div>
            </div>

            {/* Error Diagnostics if any */}
            {result.errors.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 space-y-1 max-h-32 overflow-y-auto font-mono text-[11px]">
                <div className="font-bold text-red-900">Diagnostics:</div>
                {result.errors.map((err, i) => (
                  <div key={i}>• {err}</div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
              >
                Close & Review Roster
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
