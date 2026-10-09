import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Filter,
  HeartHandshake,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Student } from '../types';
import { AcademicRiskBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const AtRiskPage: React.FC = () => {
  const navigate = useNavigate();
  const { filteredStudents, interventions, addIntervention, activeRole } = useApp();

  const [riskTab, setRiskTab] = useState<'High' | 'Medium' | 'All'>('High');
  const [triggerFilter, setTriggerFilter] = useState<'ALL' | 'ATTENDANCE' | 'CGPA' | 'BACKLOGS' | 'DROP'>('ALL');
  const [selectedStudentForInv, setSelectedStudentForInv] = useState<Student | null>(null);

  // Intervention modal state
  const [invForm, setInvForm] = useState({
    issue: '',
    recommendedAction: '',
    assignedMentor: '',
    priority: 'High' as 'High' | 'Medium' | 'Low',
    targetDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
  });

  // Filter students based on risk level and triggers
  const atRiskStudents = useMemo(() => {
    return filteredStudents.filter((s) => {
      if (riskTab === 'High' && s.academicRisk !== 'High') return false;
      if (riskTab === 'Medium' && s.academicRisk !== 'Medium') return false;
      if (riskTab === 'All' && s.academicRisk === 'Low') return false;

      if (triggerFilter === 'ATTENDANCE') {
        if ((s.attendance ?? 100) >= 65) return false;
      } else if (triggerFilter === 'CGPA') {
        if ((s.cgpa ?? 10) >= 5.0) return false;
      } else if (triggerFilter === 'BACKLOGS') {
        if (s.backlogs < 3) return false;
      } else if (triggerFilter === 'DROP') {
        const drop = s.prevCgpa && s.cgpa ? s.prevCgpa - s.cgpa : 0;
        if (drop < 0.5) return false;
      }
      return true;
    });
  }, [filteredStudents, riskTab, triggerFilter]);

  // Check which students already have active interventions
  const activeInterventionMap = useMemo(() => {
    const map = new Map<string, number>();
    interventions.forEach((inv) => {
      if (inv.status !== 'Completed') {
        map.set(inv.studentId, (map.get(inv.studentId) || 0) + 1);
      }
    });
    return map;
  }, [interventions]);

  const handleOpenAssignModal = (student: Student) => {
    setSelectedStudentForInv(student);
    setInvForm({
      issue: student.academicRiskReasons.join('; ') || 'Identified by early warning screening.',
      recommendedAction:
        student.attendance && student.attendance < 65
          ? 'Mandatory attendance review, bi-weekly progress monitoring, and parent notification.'
          : student.backlogs >= 3
          ? 'Remedial coursework tutoring and assignment of faculty subject advisor.'
          : 'Academic counseling and goal setting for semester exams.',
      assignedMentor: student.mentorName || 'Faculty Advisor',
      priority: student.academicRisk === 'High' ? 'High' : 'Medium',
      targetDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Initial counseling session scheduled.',
    });
  };

  const handleSaveIntervention = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForInv) return;

    addIntervention({
      studentId: selectedStudentForInv.id,
      studentName: selectedStudentForInv.name,
      studentDepartment: selectedStudentForInv.department,
      issue: invForm.issue,
      recommendedAction: invForm.recommendedAction,
      assignedMentor: invForm.assignedMentor,
      priority: invForm.priority,
      targetDate: invForm.targetDate,
      status: 'Pending',
      notes: invForm.notes,
    });
    setSelectedStudentForInv(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            At-Risk Students Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dedicated early-warning intervention dashboard for proactive faculty mentoring and academic recovery.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700">
            {atRiskStudents.length} Students in Queue
          </span>
        </div>
      </div>

      {/* Ethics Disclaimer */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Explainable Screening Notice: </strong>
          Risk rankings are based strictly on quantitative triggers (Attendance &lt; 65%, CGPA &lt; 5.0, or Backlogs ≥ 3) designed for timely collegiate support. They do not constitute deterministic failure predictions or irreversible academic determinations.
        </div>
      </div>

      {/* Filter Tabs and Trigger Buttons */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Level Tabs */}
          <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
            <button
              onClick={() => setRiskTab('High')}
              className={`rounded-md px-3.5 py-1.5 transition-all ${
                riskTab === 'High' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              High Risk Priority ({filteredStudents.filter((s) => s.academicRisk === 'High').length})
            </button>
            <button
              onClick={() => setRiskTab('Medium')}
              className={`rounded-md px-3.5 py-1.5 transition-all ${
                riskTab === 'Medium' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Medium Warning ({filteredStudents.filter((s) => s.academicRisk === 'Medium').length})
            </button>
            <button
              onClick={() => setRiskTab('All')}
              className={`rounded-md px-3.5 py-1.5 transition-all ${
                riskTab === 'All' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Combined At-Risk Queue
            </button>
          </div>

          {/* Trigger filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filter by Trigger:</span>
            <select
              value={triggerFilter}
              onChange={(e) => setTriggerFilter(e.target.value as any)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none"
            >
              <option value="ALL">All Triggers</option>
              <option value="ATTENDANCE">Attendance &lt; 65%</option>
              <option value="CGPA">CGPA &lt; 5.00</option>
              <option value="BACKLOGS">Backlogs ≥ 3</option>
              <option value="DROP">Performance Drop ≥ 0.5</option>
            </select>
          </div>
        </div>
      </div>

      {/* At-Risk Cards / Roster */}
      <div className="space-y-3">
        {atRiskStudents.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 text-xs">
            No students match the selected risk criteria. All active records meet foundational thresholds!
          </div>
        ) : (
          atRiskStudents.map((student) => {
            const hasActivePlan = activeInterventionMap.has(student.id);

            return (
              <div
                key={student.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{student.name}</span>
                      <span className="font-mono text-xs text-blue-600 font-semibold">{student.id}</span>
                      <AcademicRiskBadge level={student.academicRisk} size="sm" />
                      <span className="text-xs text-slate-500">
                        {student.department} • Year {student.year} (Sem {student.semester})
                      </span>
                    </div>

                    {/* Risk indicator badges / list */}
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {student.academicRiskReasons.map((reason, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 border border-red-200"
                        >
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions & Metrics */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Attendance / CGPA</div>
                      <div className="text-xs font-bold text-slate-900">
                        <span className={(student.attendance ?? 100) < 65 ? 'text-red-600' : 'text-slate-800'}>
                          {student.attendance !== null ? `${student.attendance}%` : 'N/A'}
                        </span>
                        {' '}/ {student.cgpa?.toFixed(2) ?? 'N/A'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasActivePlan ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Plan Active
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenAssignModal(student)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
                        >
                          <HeartHandshake className="h-3.5 w-3.5" />
                          Assign Action Plan
                        </button>
                      )}

                      <button
                        onClick={() => navigate(`/students/${student.id}`)}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                        title="Open 360° Profile"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Assign Action Plan Modal */}
      {selectedStudentForInv && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedStudentForInv(null)}
          title="Create Targeted Action Plan"
          subtitle={`Assign remedial mentoring for ${selectedStudentForInv.name} (${selectedStudentForInv.id})`}
        >
          <form onSubmit={handleSaveIntervention} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Identified Triggers / Issue</label>
              <textarea
                required
                rows={2}
                value={invForm.issue}
                onChange={(e) => setInvForm({ ...invForm, issue: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Recommended Intervention Action *</label>
              <textarea
                required
                rows={2}
                value={invForm.recommendedAction}
                onChange={(e) => setInvForm({ ...invForm, recommendedAction: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Assigned Faculty Mentor</label>
                <input
                  type="text"
                  required
                  value={invForm.assignedMentor}
                  onChange={(e) => setInvForm({ ...invForm, assignedMentor: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Target Date</label>
                <input
                  type="date"
                  required
                  value={invForm.targetDate}
                  onChange={(e) => setInvForm({ ...invForm, targetDate: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Initial Progress Notes</label>
              <textarea
                rows={2}
                value={invForm.notes}
                onChange={(e) => setInvForm({ ...invForm, notes: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedStudentForInv(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Confirm & Create Action Plan
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
