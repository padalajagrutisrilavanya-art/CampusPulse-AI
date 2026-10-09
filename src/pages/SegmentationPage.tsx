import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Users,
  Download,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SEGMENT_DEFINITIONS, getSegmentStudents } from '../services/segmentationService';
import { AcademicRiskBadge, PlacementRiskBadge } from '../components/common/Badge';
import { exportStudentsToCsv } from '../services/csvService';

export const SegmentationPage: React.FC = () => {
  const navigate = useNavigate();
  const { filteredStudents } = useApp();

  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('high-acad-low-place');

  const selectedDef = SEGMENT_DEFINITIONS.find((s) => s.id === selectedSegmentId) || SEGMENT_DEFINITIONS[0];
  const matchingStudents = getSegmentStudents(filteredStudents, selectedSegmentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Layers className="h-6 w-6 text-indigo-600" />
            Data-Driven Student Segmentation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Rule-based multi-factor cohort grouping to deliver targeted academic coaching, upskilling, and retention workflows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportStudentsToCsv(matchingStudents, `segment_${selectedSegmentId}_cohort.csv`)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Selected Cohort ({matchingStudents.length})
          </button>
        </div>
      </div>

      {/* Segment Cards Grid (All 8 cohorts) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SEGMENT_DEFINITIONS.map((seg) => {
          const count = getSegmentStudents(filteredStudents, seg.id).length;
          const pct = Math.round((count / (filteredStudents.length || 1)) * 100);
          const isSelected = selectedSegmentId === seg.id;

          return (
            <div
              key={seg.id}
              onClick={() => setSelectedSegmentId(seg.id)}
              className={`cursor-pointer rounded-xl border p-4 transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-200'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {seg.category}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800">
                  {count} students ({pct}%)
                </span>
              </div>

              <h2 className="mt-2 text-xs font-bold text-slate-900 leading-snug">{seg.name}</h2>
              <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">{seg.description}</p>

              <div className="mt-3 rounded bg-slate-50 p-2 border border-slate-100 text-[10px] font-mono text-slate-700 truncate">
                {seg.criteria}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Segment Drill-Down Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/80 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  Active Cohort View
                </span>
                <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-900">
                  {selectedDef.name}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600">{selectedDef.description}</p>
              <div className="mt-1 text-xs font-mono text-indigo-800 font-medium">
                Applied Rule: {selectedDef.criteria}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">
                Matching: <strong>{matchingStudents.length}</strong> students
              </span>
            </div>
          </div>
        </div>

        {/* Table of matching students */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Student ID & Name</th>
                <th className="px-4 py-3 font-semibold">Department & Year</th>
                <th className="px-4 py-3 font-semibold text-right">CGPA</th>
                <th className="px-4 py-3 font-semibold text-right">Attendance</th>
                <th className="px-4 py-3 font-semibold text-right">Placement Score</th>
                <th className="px-4 py-3 font-semibold text-center">Success Score</th>
                <th className="px-4 py-3 font-semibold">Academic Risk</th>
                <th className="px-4 py-3 font-semibold">Mentor</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matchingStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                    No students currently meet the exact criteria for this segment in the active filter selection.
                  </td>
                </tr>
              ) : (
                matchingStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{st.name}</div>
                      <div className="font-mono text-[11px] text-blue-600">{st.id}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {st.department} • Year {st.year} (Sem {st.semester})
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {st.cgpa?.toFixed(2) ?? 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">
                      {st.attendance !== null ? `${st.attendance}%` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">
                      {st.placementReadinessScore ?? 'N/A'} / 100
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {st.successScore}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <AcademicRiskBadge level={st.academicRisk} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{st.mentorName}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/students/${st.id}`)}
                        className="rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
