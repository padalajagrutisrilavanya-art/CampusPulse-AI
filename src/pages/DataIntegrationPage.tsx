import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  UploadCloud,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  Sparkles,
  ArrowRight,
  Eye,
  Check,
  FileText,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  CsvDomainType,
  downloadCsvTemplate,
  parseAndValidateCsv,
  CsvImportResult,
  exportStudentsToCsv,
} from '../services/csvService';
import { Modal } from '../components/common/Modal';

export const DataIntegrationPage: React.FC = () => {
  const navigate = useNavigate();
  const { students, batchUpdateStudents, resetAllDemoData, importHistory } = useApp();

  const [selectedDomain, setSelectedDomain] = useState<CsvDomainType>('academic');
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);
  const [rawPreviewRows, setRawPreviewRows] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const domainDescriptions: Record<CsvDomainType, { title: string; desc: string; fields: string }> = {
    academic: {
      title: 'Academic Records',
      desc: 'Updates semester CGPA, active backlogs, and prior GPA for semester trend tracking.',
      fields: 'student_id, cgpa, backlogs, prev_cgpa',
    },
    attendance: {
      title: 'Attendance Records',
      desc: 'Updates overall physical classroom and lab attendance percentages.',
      fields: 'student_id, attendance',
    },
    lms: {
      title: 'LMS Activity Logs',
      desc: 'Syncs digital learning engagement: weekly logins, assignment completion rate, and video completion.',
      fields: 'student_id, lms_logins_per_week, assignment_completion_rate, video_watch_percentage',
    },
    engagement: {
      title: 'Campus Engagement',
      desc: 'Syncs club memberships, hackathon/cultural participation, and student leadership roles.',
      fields: 'student_id, club_count, event_count, has_leadership, sports_or_cultural',
    },
    placement: {
      title: 'Placement Evaluations',
      desc: 'Updates mock interview, coding challenge, quantitative aptitude, and resume scores.',
      fields: 'student_id, coding_score, aptitude_score, mock_interview_score, resume_score, internship_status',
    },
    skills: {
      title: 'Skills Assessment',
      desc: 'Syncs technical and soft skills ratings evaluated by departmental evaluators.',
      fields: 'student_id, technical_skill, soft_skill',
    },
    full_roster: {
      title: 'New Students Full Roster',
      desc: 'Registers new student records into the database with mandatory identity and academic profile fields.',
      fields: 'student_id, name, email, department, year, semester, cgpa, attendance, backlogs, mentor_name',
    },
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportSuccessMessage('');
    const reader = new FileReader();

    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      const res = await parseAndValidateCsv(content, selectedDomain, students);
      setImportResult(res);

      // Extract first 5 rows for visual preview
      const lines = content.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length > 1) {
        const headers = lines[0].split(',').map((h) => h.trim());
        const rows = lines.slice(1, 6).map((line) => {
          const cells = line.split(',');
          const obj: any = {};
          headers.forEach((h, i) => {
            obj[h] = cells[i]?.trim();
          });
          return obj;
        });
        setRawPreviewRows(rows);
      }
      setIsProcessing(false);
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmMerge = () => {
    if (!importResult || importResult.validRows === 0) return;

    const historyEntry = {
      id: `imp-${Date.now()}`,
      timestamp: new Date().toLocaleString([], { hour12: false }),
      fileName: `${selectedDomain}_data_import.csv`,
      dataType: domainDescriptions[selectedDomain].title,
      totalRows: importResult.totalRows,
      successfulRows: importResult.validRows,
      failedRows: importResult.invalidRows,
      errors: importResult.issues.map((i) => `Row ${i.row}: ${i.message}`).slice(0, 5),
    };

    batchUpdateStudents(importResult.mergedStudents, historyEntry);
    setImportSuccessMessage(
      `Successfully synced ${importResult.validRows} records into active dataset! Recalculated scores, risks, and segments.`
    );
    setImportResult(null);
    setRawPreviewRows([]);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Database className="h-6 w-6 text-blue-600" />
            Data Integration & Multi-Source CSV Sync
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingest and merge distributed university data streams. Safe schema validation, duplicate detection, and automated score recalculation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/settings')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-xs hover:bg-emerald-100 transition-colors"
          >
            <Database className="h-4 w-4 text-emerald-600" />
            Supabase Cloud Sync
          </button>
          <button
            onClick={() => exportStudentsToCsv(students, 'campuspulse_master_database.csv')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Full Master CSV ({students.length})
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {importSuccessMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>{importSuccessMessage}</span>
          </div>
          <button
            onClick={() => navigate('/students')}
            className="rounded bg-emerald-600 text-white font-bold px-3 py-1 text-xs hover:bg-emerald-700"
          >
            Review Roster
          </button>
        </div>
      )}

      {/* Domain Selector & Upload Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Domain Tabs */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Select Data Domain Stream
          </h2>
          {(Object.keys(domainDescriptions) as CsvDomainType[]).map((dom) => {
            const item = domainDescriptions[dom];
            const isSelected = selectedDomain === dom;
            return (
              <button
                key={dom}
                onClick={() => {
                  setSelectedDomain(dom);
                  setImportResult(null);
                  setRawPreviewRows([]);
                  setImportSuccessMessage('');
                }}
                className={`flex w-full flex-col items-start rounded-xl p-3 text-left transition-all ${
                  isSelected
                    ? 'bg-blue-50 border border-blue-200 shadow-xs'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className={`text-xs font-bold ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                    {item.title}
                  </span>
                  {dom === 'full_roster' && (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                      Identity
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">{item.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Right: Upload Dropzone & Actions (2 cols wide) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {domainDescriptions[selectedDomain].title} Import
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Expected CSV headers: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-700 font-mono text-[11px]">{domainDescriptions[selectedDomain].fields}</code>
                </p>
              </div>

              <button
                onClick={() => downloadCsvTemplate(selectedDomain)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-xs"
              >
                <Download className="h-3.5 w-3.5" />
                Download Template CSV
              </button>
            </div>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3">
                <UploadCloud className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                Click to browse or drop CSV file here
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                Supports standard comma-separated UTF-8 CSV files
              </p>
              <div className="mt-3 inline-block rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                Safe Merge: Non-specified student fields will remain intact
              </div>
            </div>
          </div>

          {/* Quick dataset reload helper */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Need to restore original demo records?</span>
            <button
              onClick={() => {
                if (window.confirm('Reset student roster back to pristine seed dataset?')) {
                  resetAllDemoData();
                  setImportSuccessMessage('Reset to pristine 125-student seed dataset complete.');
                }
              }}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-amber-700 font-medium"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reload 125 Seed Students
            </button>
          </div>
        </div>
      </div>

      {/* Validation Result Inspection & Confirmation */}
      {importResult && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Import Validation & Schema Audit</h3>
              <p className="text-xs text-slate-500">
                Review parsed records, error diagnostics, and merge impact before committing to database.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                {importResult.validRows} Valid Rows
              </span>
              {importResult.invalidRows > 0 && (
                <span className="text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                  {importResult.invalidRows} Rows with Issues
                </span>
              )}
            </div>
          </div>

          {/* Error / Warning issues report */}
          {importResult.issues.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Validation Alerts ({importResult.issues.length})
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1 text-xs text-slate-700">
                {importResult.issues.map((iss, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="font-mono text-red-600 font-semibold">[Row {iss.row}]</span>
                    <span>{iss.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Row Preview Table */}
          {rawPreviewRows.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-700 mb-2">
                Preview of Uploaded Data (First 5 Rows):
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      {Object.keys(rawPreviewRows[0]).map((h) => (
                        <th key={h} className="px-3 py-2 font-mono font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rawPreviewRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 font-mono text-[11px]">
                        {Object.values(row).map((val: any, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 text-slate-800">
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Merge Commit Button */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Ready to merge {importResult.validRows} rows into active campus dataset.
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setImportResult(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Discard
              </button>
              <button
                onClick={handleConfirmMerge}
                disabled={importResult.validRows === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Commit & Merge Records ({importResult.validRows})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import History Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-500" />
          Recent CSV Import Audit Log
        </h3>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Timestamp</th>
                <th className="px-4 py-2.5 font-semibold">File Name</th>
                <th className="px-4 py-2.5 font-semibold">Domain Stream</th>
                <th className="px-4 py-2.5 font-semibold text-right">Total Rows</th>
                <th className="px-4 py-2.5 font-semibold text-right">Synced Rows</th>
                <th className="px-4 py-2.5 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {importHistory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-slate-500 font-mono text-[11px]">{item.timestamp}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">{item.fileName}</td>
                  <td className="px-4 py-2.5 text-slate-700">{item.dataType}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-700">{item.totalRows}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-700">
                    {item.successfulRows}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" /> Synced
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
