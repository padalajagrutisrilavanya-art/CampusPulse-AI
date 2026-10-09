import React, { useState } from 'react';
import {
  FileBarChart2,
  Download,
  Printer,
  FileText,
  CheckCircle2,
  Award,
  AlertTriangle,
  Briefcase,
  Users,
  CalendarCheck,
  Building,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { exportStudentsToCsv } from '../services/csvService';
import Papa from 'papaparse';

export const ReportsPage: React.FC = () => {
  const { students, filteredStudents, interventions, stats, weights } = useApp();
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // 1. Student Risk Report CSV
  const handleExportRiskReport = () => {
    const data = filteredStudents.map((s) => ({
      student_id: s.id,
      name: s.name,
      department: s.department,
      cgpa: s.cgpa ?? 'N/A',
      attendance: s.attendance !== null ? `${s.attendance}%` : 'N/A',
      backlogs: s.backlogs,
      academic_risk: s.academicRisk,
      academic_reasons: s.academicRiskReasons.join('; '),
      placement_risk: s.placementRisk,
      mentor_name: s.mentorName,
    }));
    downloadCsv(data, 'campuspulse_student_risk_report.csv');
  };

  // 2. Department Benchmark Report CSV
  const handleExportDeptReport = () => {
    const depts = ['CSE', 'ECE', 'EEE', 'IT', 'MECH'] as const;
    const data = depts.map((d) => {
      const list = filteredStudents.filter((s) => s.department === d);
      const avgCgpa = list.length > 0 ? list.reduce((acc, s) => acc + (s.cgpa ?? 0), 0) / list.length : 0;
      const avgAtt = list.length > 0 ? list.reduce((acc, s) => acc + (s.attendance ?? 0), 0) / list.length : 0;
      const avgSuccess = list.length > 0 ? list.reduce((acc, s) => acc + s.successScore, 0) / list.length : 0;
      const highRiskCount = list.filter((s) => s.academicRisk === 'High').length;
      return {
        department: d,
        total_students: list.length,
        avg_cgpa: avgCgpa.toFixed(2),
        avg_attendance: `${avgAtt.toFixed(1)}%`,
        avg_success_score: avgSuccess.toFixed(1),
        high_risk_students: highRiskCount,
        high_risk_percentage: `${Math.round((highRiskCount / (list.length || 1)) * 100)}%`,
      };
    });
    downloadCsv(data, 'campuspulse_department_benchmark_report.csv');
  };

  // 3. Interventions Progress Report CSV
  const handleExportInterventionsReport = () => {
    const data = interventions.map((i) => ({
      intervention_id: i.id,
      student_id: i.studentId,
      student_name: i.studentName,
      department: i.studentDepartment,
      issue: i.issue,
      action_plan: i.recommendedAction,
      assigned_mentor: i.assignedMentor,
      priority: i.priority,
      status: i.status,
      created_at: i.createdAt,
      target_date: i.targetDate,
      notes: i.notes,
    }));
    downloadCsv(data, 'campuspulse_interventions_progress_report.csv');
  };

  // 4. Data Quality Audit Report CSV
  const handleExportDataQualityReport = () => {
    const data = filteredStudents.map((s) => ({
      student_id: s.id,
      name: s.name,
      department: s.department,
      data_completeness: `${s.dataCompleteness}%`,
      is_provisional: s.isProvisionalScore ? 'YES' : 'NO',
      has_academics: s.successScoreBreakdown.academics.available ? 'YES' : 'NO',
      has_attendance: s.successScoreBreakdown.attendance.available ? 'YES' : 'NO',
      has_lms: s.successScoreBreakdown.lms.available ? 'YES' : 'NO',
      has_campus: s.successScoreBreakdown.campus.available ? 'YES' : 'NO',
      has_placement: s.successScoreBreakdown.placement.available ? 'YES' : 'NO',
      has_skills: s.successScoreBreakdown.skills.available ? 'YES' : 'NO',
    }));
    downloadCsv(data, 'campuspulse_data_quality_audit.csv');
  };

  const downloadCsv = (rows: any[], filename: string) => {
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileBarChart2 className="h-6 w-6 text-blue-600" />
            Institutional Reports & Audit Exports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Download filtered analytics datasets, audit spreadsheets & generate print-ready executive briefing summaries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPrintPreview(!showPrintPreview)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Printer className="h-4 w-4" />
            {showPrintPreview ? 'Hide Print Preview' : 'Executive Print / PDF Summary'}
          </button>
        </div>
      </div>

      {/* Pre-built Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Report 1 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Student Risk & Early Warning Audit</span>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Complete listing of all students with exact indicator values, thresholds, attendance cutoffs, and assigned faculty mentors.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">{filteredStudents.length} rows</span>
            <button
              onClick={handleExportRiskReport}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download CSV
            </button>
          </div>
        </div>

        {/* Report 2 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Departmental Performance & Benchmark</span>
              <Building className="h-4 w-4 text-teal-600" />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Aggregated department pass-rates, CGPA averages, attendance percentages, and high-risk proportions.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">5 Engineering Departments</span>
            <button
              onClick={handleExportDeptReport}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download CSV
            </button>
          </div>
        </div>

        {/* Report 3 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Interventions & Mentoring Progress Ledger</span>
              <Award className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Full log of all remedial action plans, assigned advisors, resolution target dates, and counseling progress notes.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">{interventions.length} Case Files</span>
            <button
              onClick={handleExportInterventionsReport}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download CSV
            </button>
          </div>
        </div>

        {/* Report 4 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Data Completeness & Quality Audit</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Audit stream detailing missing inputs, provisional scores, and completeness indices across all 6 success score vectors.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">{filteredStudents.length} Records</span>
            <button
              onClick={handleExportDataQualityReport}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download CSV
            </button>
          </div>
        </div>
      </div>

      {/* Print-Friendly Executive Briefing Container */}
      {showPrintPreview && (
        <div className="rounded-2xl border-2 border-slate-300 bg-white p-8 shadow-lg print:border-none print:shadow-none print:p-0">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-slate-900">CampusPulse AI</span>
                <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                  Executive Briefing
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Institutional Student Success, Early Warning & Placement Analytics Summary
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 print:hidden"
              >
                <Printer className="h-4 w-4" />
                Print / Save as PDF
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 mb-6 flex justify-between">
            <span>Generated: {new Date().toLocaleDateString()}</span>
            <span>Active Student Body Sample: {stats.totalStudents}</span>
          </div>

          {/* Key Metric Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-3 rounded-lg border border-slate-200 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Total Students</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{stats.totalStudents}</div>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Avg Success Score</div>
              <div className="text-xl font-bold text-blue-600 mt-1">{stats.avgSuccessScore} / 100</div>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-bold">High Academic Risk</div>
              <div className="text-xl font-bold text-red-600 mt-1">{stats.highAcademicRiskCount}</div>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Avg Attendance</div>
              <div className="text-xl font-bold text-emerald-600 mt-1">{stats.avgAttendance}%</div>
            </div>
          </div>

          {/* Departmental Performance Summary Table */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Departmental Summary Benchmark
            </h4>
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="p-2">Department</th>
                  <th className="p-2 text-right">Students</th>
                  <th className="p-2 text-right">Avg CGPA</th>
                  <th className="p-2 text-right">Avg Attendance</th>
                  <th className="p-2 text-right">Avg Success Score</th>
                  <th className="p-2 text-right">High Academic Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(['CSE', 'ECE', 'EEE', 'IT', 'MECH'] as const).map((d) => {
                  const list = filteredStudents.filter((s) => s.department === d);
                  const avgC = list.length > 0 ? list.reduce((a, s) => a + (s.cgpa ?? 0), 0) / list.length : 0;
                  const avgA = list.length > 0 ? list.reduce((a, s) => a + (s.attendance ?? 0), 0) / list.length : 0;
                  const avgS = list.length > 0 ? list.reduce((a, s) => a + s.successScore, 0) / list.length : 0;
                  const high = list.filter((s) => s.academicRisk === 'High').length;
                  return (
                    <tr key={d}>
                      <td className="p-2 font-bold">{d}</td>
                      <td className="p-2 text-right">{list.length}</td>
                      <td className="p-2 text-right">{avgC.toFixed(2)}</td>
                      <td className="p-2 text-right">{avgA.toFixed(1)}%</td>
                      <td className="p-2 text-right">{avgS.toFixed(1)}</td>
                      <td className="p-2 text-right font-bold text-red-600">{high}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 pt-4 text-[10px] text-slate-400 text-center">
            CampusPulse AI Analytics Engine • Confidential Institutional Report • Generated on-demand
          </div>
        </div>
      )}
    </div>
  );
};
