import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  GraduationCap,
  Sparkles,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Student, Department, AcademicRiskLevel, PlacementRiskLevel } from '../types';
import { AcademicRiskBadge, PlacementRiskBadge, Badge } from '../components/common/Badge';
import { exportStudentsToCsv } from '../services/csvService';
import { Modal } from '../components/common/Modal';

export const StudentDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { filteredStudents, filters, setFilter, resetFilters, addStudent, activeRole } = useApp();

  const [sortField, setSortField] = useState<keyof Student>('successScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Student Form State
  const [newStudent, setNewStudent] = useState({
    id: `CP-2023-CSE-${Math.floor(100 + Math.random() * 900)}`,
    name: '',
    email: '',
    department: 'CSE' as Department,
    year: 3,
    semester: 5,
    cgpa: 7.5,
    attendance: 80,
    backlogs: 0,
    mentorName: 'Dr. Anita Sundaram',
  });
  const [formError, setFormError] = useState('');

  // Handle Sort
  const handleSort = (field: keyof Student) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [filteredStudents, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedStudents.slice(start, start + pageSize);
  }, [sortedStudents, currentPage, pageSize]);

  const handleExportCsv = () => {
    exportStudentsToCsv(sortedStudents, `campuspulse_directory_export.csv`);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.id.trim() || !newStudent.name.trim() || !newStudent.email.trim()) {
      setFormError('Please fill in Student ID, Full Name, and Institutional Email.');
      return;
    }

    const created: any = {
      id: newStudent.id.trim(),
      name: newStudent.name.trim(),
      email: newStudent.email.trim(),
      phone: '+91 9812345678',
      department: newStudent.department,
      year: Number(newStudent.year),
      semester: Number(newStudent.semester),
      section: 'A',
      mentorName: newStudent.mentorName,
      cgpa: Number(newStudent.cgpa),
      prevCgpa: Number(newStudent.cgpa),
      backlogs: Number(newStudent.backlogs),
      semesterMarks: [{ semester: Number(newStudent.semester), sgpa: Number(newStudent.cgpa), credits: 22 }],
      attendance: Number(newStudent.attendance),
      courseAttendance: [],
      lmsLoginsPerWeek: 6,
      assignmentCompletionRate: 80,
      videoWatchPercentage: 75,
      clubParticipationCount: 1,
      eventParticipationCount: 2,
      hasLeadershipRole: false,
      sportsOrCultural: false,
      codingScore: 65,
      aptitudeScore: 65,
      mockInterviewScore: 70,
      resumeScore: 75,
      internshipStatus: 'In Progress',
      placedStatus: 'Not Placed',
      targetCompanyTier: 'IT Services',
      technicalSkill: 7.0,
      softSkill: 7.0,
      skillsList: [],
      mentorFeedback: [],
      successScore: 0,
      successScoreBreakdown: {} as any,
      dataCompleteness: 100,
      isProvisionalScore: false,
      academicRisk: 'Low',
      academicRiskReasons: [],
      placementReadinessScore: 67,
      placementRisk: 'Low',
      placementRiskReasons: [],
      applicableSegments: [],
    };

    addStudent(created);
    setShowAddModal(false);
    navigate(`/students/${created.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Student Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Searchable, multi-column directory with live calculated success scores, risk levels & completeness flags.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV ({sortedStudents.length})
          </button>
          {activeRole === 'admin' && (
            <button
              onClick={() => {
                setFormError('');
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Student
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilter('search', e.target.value)}
                placeholder="Filter by name, ID or department..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Academic Risk Filter */}
            <select
              value={filters.academicRisk}
              onChange={(e) => setFilter('academicRisk', e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none"
            >
              <option value="ALL">All Academic Risks</option>
              <option value="High">High Academic Risk</option>
              <option value="Medium">Medium Academic Risk</option>
              <option value="Low">Low Academic Risk</option>
            </select>

            {/* Placement Risk Filter */}
            <select
              value={filters.placementRisk}
              onChange={(e) => setFilter('placementRisk', e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none"
            >
              <option value="ALL">All Placement Risks</option>
              <option value="High">High Placement Risk (&lt;40)</option>
              <option value="Medium">Moderate Placement (40-60)</option>
              <option value="Low">Placement Ready (≥60)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {(filters.department !== 'ALL' ||
              filters.year !== 'ALL' ||
              filters.semester !== 'ALL' ||
              filters.academicRisk !== 'ALL' ||
              filters.placementRisk !== 'ALL' ||
              filters.search) && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1"
              >
                <RotateCcw className="h-3 w-3" />
                Reset filters
              </button>
            )}
            <span className="text-xs font-semibold text-slate-500">
              Showing {sortedStudents.length} students
            </span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-600">
              <tr>
                <th
                  onClick={() => handleSort('id')}
                  className="cursor-pointer px-4 py-3 font-semibold hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    Student ID <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="cursor-pointer px-4 py-3 font-semibold hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    Student Name <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('department')}
                  className="cursor-pointer px-4 py-3 font-semibold hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    Dept & Sem <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('cgpa')}
                  className="cursor-pointer px-4 py-3 font-semibold hover:text-slate-900 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    CGPA <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('attendance')}
                  className="cursor-pointer px-4 py-3 font-semibold hover:text-slate-900 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    Attendance <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('successScore')}
                  className="cursor-pointer px-4 py-3 font-semibold hover:text-slate-900 text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    Success Score <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-4 py-3 font-semibold">Academic Risk</th>
                <th className="px-4 py-3 font-semibold">Placement Readiness</th>
                <th className="px-4 py-3 font-semibold text-center">Data Quality</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                    No students matched the active filter criteria. Try resetting filters or clearing search.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((st) => (
                  <tr
                    key={st.id}
                    onClick={() => navigate(`/students/${st.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-medium text-blue-600">
                      {st.id}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div>{st.name}</div>
                      <div className="text-[11px] text-slate-400">{st.mentorName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800">{st.department}</span>
                      <span className="text-slate-500"> • Y{st.year} (S{st.semester})</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-semibold ${
                          (st.cgpa ?? 10) < 5.0
                            ? 'text-red-600 font-bold'
                            : (st.cgpa ?? 10) < 6.0
                            ? 'text-amber-600'
                            : 'text-slate-800'
                        }`}
                      >
                        {st.cgpa?.toFixed(2) ?? 'N/A'}
                      </span>
                      {st.backlogs > 0 && (
                        <span className="ml-1 text-[10px] text-red-500 font-bold">
                          ({st.backlogs} BL)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-semibold ${
                          (st.attendance ?? 100) < 65
                            ? 'text-red-600 font-bold'
                            : (st.attendance ?? 100) < 75
                            ? 'text-amber-600'
                            : 'text-emerald-700'
                        }`}
                      >
                        {st.attendance !== null ? `${st.attendance}%` : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1.5 font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                        <span>{st.successScore}</span>
                        {st.isProvisionalScore && (
                          <span
                            className="text-[9px] font-bold text-purple-700 bg-purple-100 px-1 rounded uppercase tracking-tighter"
                            title="Provisional score calculated with renormalized available weights"
                          >
                            Prov
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <AcademicRiskBadge level={st.academicRisk} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <PlacementRiskBadge level={st.placementRisk} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="h-1.5 w-12 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              st.dataCompleteness >= 85
                                ? 'bg-emerald-500'
                                : st.dataCompleteness >= 70
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${st.dataCompleteness}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-slate-500">
                          {st.dataCompleteness}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/students/${st.id}`)}
                        className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        360° Profile
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded border border-slate-200 bg-white px-2 py-1 text-xs"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>
              Page {currentPage} of {totalPages} ({sortedStudents.length} total)
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`h-7 w-7 rounded font-medium ${
                    currentPage === p
                      ? 'bg-blue-600 text-white font-bold'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Student Profile"
        subtitle="Registers student into active dataset with immediate score recalculation"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Student ID *</label>
              <input
                type="text"
                required
                value={newStudent.id}
                onChange={(e) => setNewStudent({ ...newStudent, id: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Full Name *</label>
              <input
                type="text"
                required
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                placeholder="e.g. Sumanth Reddy"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Email Address *</label>
            <input
              type="email"
              required
              value={newStudent.email}
              onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
              placeholder="e.g. sumanth.reddy@campuspulse.edu"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Department</label>
              <select
                value={newStudent.department}
                onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value as Department })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-white"
              >
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="IT">IT</option>
                <option value="MECH">MECH</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Academic Year</label>
              <select
                value={newStudent.year}
                onChange={(e) => setNewStudent({ ...newStudent, year: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-white"
              >
                <option value={1}>Year 1</option>
                <option value={2}>Year 2</option>
                <option value={3}>Year 3</option>
                <option value={4}>Year 4</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Semester</label>
              <select
                value={newStudent.semester}
                onChange={(e) => setNewStudent({ ...newStudent, semester: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Sem {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">CGPA (0 - 10)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={newStudent.cgpa}
                onChange={(e) => setNewStudent({ ...newStudent, cgpa: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Attendance %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={newStudent.attendance}
                onChange={(e) => setNewStudent({ ...newStudent, attendance: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Backlogs Count</label>
              <input
                type="number"
                min="0"
                max="20"
                value={newStudent.backlogs}
                onChange={(e) => setNewStudent({ ...newStudent, backlogs: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Assigned Mentor</label>
            <input
              type="text"
              value={newStudent.mentorName}
              onChange={(e) => setNewStudent({ ...newStudent, mentorName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Save & Open Profile
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
