import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartHandshake,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit2,
  Trash2,
  ExternalLink,
  Search,
  Calendar,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Intervention, Department } from '../types';
import { StatusBadge, Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const InterventionsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    students,
    interventions,
    addIntervention,
    updateIntervention,
    deleteIntervention,
    stats,
    activeRole,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Pending' | 'In Progress' | 'Completed'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'High' | 'Medium' | 'Low'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInv, setEditingInv] = useState<Intervention | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    studentId: '',
    issue: '',
    recommendedAction: '',
    assignedMentor: 'Dr. Anita Sundaram',
    priority: 'High' as 'High' | 'Medium' | 'Low',
    targetDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Pending' as 'Pending' | 'In Progress' | 'Completed',
    notes: '',
    followUpDate: '',
  });

  // Filtered interventions list
  const filteredInterventions = useMemo(() => {
    return interventions.filter((inv) => {
      if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && inv.priority !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const m1 = inv.studentName.toLowerCase().includes(q);
        const m2 = inv.studentId.toLowerCase().includes(q);
        const m3 = inv.issue.toLowerCase().includes(q);
        const m4 = inv.assignedMentor.toLowerCase().includes(q);
        if (!m1 && !m2 && !m3 && !m4) return false;
      }
      return true;
    });
  }, [interventions, statusFilter, priorityFilter, searchQuery]);

  const handleOpenCreateModal = () => {
    // Pick the first high-risk student without an active intervention if possible
    const unassignedHighRisk = students.find(
      (s) => s.academicRisk === 'High' && !interventions.some((i) => i.studentId === s.id && i.status !== 'Completed')
    ) || students[0];

    setFormData({
      studentId: unassignedHighRisk ? unassignedHighRisk.id : '',
      issue: unassignedHighRisk?.academicRiskReasons.join('; ') || 'Academic risk advisory',
      recommendedAction: 'Weekly progress check-in, remedial tutorial assignment, and parental communication.',
      assignedMentor: unassignedHighRisk?.mentorName || 'Faculty Mentor',
      priority: 'High',
      targetDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending',
      notes: 'Initial counseling session scheduled.',
      followUpDate: '',
    });
    setEditingInv(null);
    setShowCreateModal(true);
  };

  const handleOpenEdit = (inv: Intervention) => {
    setEditingInv(inv);
    setFormData({
      studentId: inv.studentId,
      issue: inv.issue,
      recommendedAction: inv.recommendedAction,
      assignedMentor: inv.assignedMentor,
      priority: inv.priority,
      targetDate: inv.targetDate,
      status: inv.status,
      notes: inv.notes,
      followUpDate: inv.followUpDate || '',
    });
    setShowCreateModal(true);
  };

  const handleStudentSelectInForm = (stId: string) => {
    const st = students.find((s) => s.id === stId);
    if (!st) return;
    setFormData((prev) => ({
      ...prev,
      studentId: stId,
      assignedMentor: st.mentorName || prev.assignedMentor,
      issue: st.academicRiskReasons.join('; ') || prev.issue,
    }));
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.id === formData.studentId);
    if (!st) return;

    if (editingInv) {
      updateIntervention({
        ...editingInv,
        studentId: formData.studentId,
        studentName: st.name,
        studentDepartment: st.department,
        issue: formData.issue,
        recommendedAction: formData.recommendedAction,
        assignedMentor: formData.assignedMentor,
        priority: formData.priority,
        targetDate: formData.targetDate,
        status: formData.status,
        notes: formData.notes,
        followUpDate: formData.followUpDate || undefined,
      });
    } else {
      addIntervention({
        studentId: formData.studentId,
        studentName: st.name,
        studentDepartment: st.department,
        issue: formData.issue,
        recommendedAction: formData.recommendedAction,
        assignedMentor: formData.assignedMentor,
        priority: formData.priority,
        targetDate: formData.targetDate,
        status: formData.status,
        notes: formData.notes,
        followUpDate: formData.followUpDate || undefined,
      });
    }

    setShowCreateModal(false);
  };

  const handleQuickStatusChange = (inv: Intervention, nextStatus: 'Pending' | 'In Progress' | 'Completed') => {
    updateIntervention({
      ...inv,
      status: nextStatus,
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this intervention record?')) {
      deleteIntervention(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <HeartHandshake className="h-6 w-6 text-blue-600" />
            Interventions & Mentoring Action Plans
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational tracking of structured student support cases, mentor assignments, remedial tutorials & milestones.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Action Plan
          </button>
        </div>
      </div>

      {/* Progress Metric Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Case Files</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{interventions.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Active & historical interventions</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="text-xs font-semibold text-blue-600 uppercase">In Progress</div>
          <div className="mt-1 text-2xl font-bold text-blue-600">
            {interventions.filter((i) => i.status === 'In Progress').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Actively undergoing tutoring</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="text-xs font-semibold text-amber-600 uppercase">Pending Intake</div>
          <div className="mt-1 text-2xl font-bold text-amber-600">
            {interventions.filter((i) => i.status === 'Pending').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Awaiting initial counseling</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="text-xs font-semibold text-emerald-600 uppercase">Completion Rate</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">
            {stats.interventionCompletionRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {interventions.filter((i) => i.status === 'Completed').length} successfully resolved
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student, mentor, or issue keywords..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <option value="ALL">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            Showing {filteredInterventions.length} of {interventions.length} plans
          </span>
        </div>
      </div>

      {/* Interventions Master List */}
      <div className="space-y-3">
        {filteredInterventions.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500">
            No action plans match the current filter selection.
          </div>
        ) : (
          filteredInterventions.map((inv) => (
            <div
              key={inv.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{inv.studentName}</span>
                    <button
                      onClick={() => navigate(`/students/${inv.studentId}`)}
                      className="font-mono text-xs font-semibold text-blue-600 hover:underline"
                    >
                      {inv.studentId}
                    </button>
                    <span className="text-xs text-slate-500 font-medium">({inv.studentDepartment})</span>
                    <StatusBadge status={inv.status} size="sm" />
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        inv.priority === 'High'
                          ? 'bg-red-100 text-red-700'
                          : inv.priority === 'Medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {inv.priority} Priority
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-800">
                      <span className="text-slate-500 font-normal">Identified Issue: </span>
                      {inv.issue}
                    </div>
                    <div className="mt-1 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <strong>Recommended Action Plan: </strong>
                      {inv.recommendedAction}
                    </div>
                    {inv.notes && (
                      <div className="mt-1 text-[11px] text-slate-500">
                        <strong>Progress Notes: </strong>
                        {inv.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                    <span>
                      <strong>Assigned Mentor:</strong> {inv.assignedMentor}
                    </span>
                    <span>
                      <strong>Target Date:</strong> {inv.targetDate}
                    </span>
                    <span>
                      <strong>Created:</strong> {inv.createdAt}
                    </span>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2 shrink-0 pt-1">
                  <select
                    value={inv.status}
                    onChange={(e) => handleQuickStatusChange(inv, e.target.value as any)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>

                  <button
                    onClick={() => handleOpenEdit(inv)}
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    title="Edit action plan"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(inv.id)}
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    title="Delete case record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => navigate(`/students/${inv.studentId}`)}
                    className="rounded-lg border border-slate-200 p-1.5 text-blue-600 hover:bg-blue-50"
                    title="Go to 360° Profile"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={editingInv ? 'Edit Student Action Plan' : 'Create New Student Action Plan'}
        subtitle="Configures remedial goals, assigned faculty mentors, and target resolution dates"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Select Student *</label>
            <select
              required
              disabled={Boolean(editingInv)}
              value={formData.studentId}
              onChange={(e) => handleStudentSelectInForm(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs bg-white"
            >
              <option value="">-- Choose student from active roster --</option>
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.id} - {st.department}) - CGPA: {st.cgpa?.toFixed(2) ?? 'N/A'} - {st.academicRisk} Risk
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Identified Issue / Trigger Area *</label>
            <textarea
              required
              rows={2}
              value={formData.issue}
              onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Recommended Action Plan *</label>
            <textarea
              required
              rows={2}
              value={formData.recommendedAction}
              onChange={(e) => setFormData({ ...formData, recommendedAction: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Assigned Faculty Mentor</label>
              <input
                type="text"
                required
                value={formData.assignedMentor}
                onChange={(e) => setFormData({ ...formData, assignedMentor: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Priority Level</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs bg-white"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Target Completion Date</label>
              <input
                type="date"
                required
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs bg-white"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Progress Notes & Observations</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              {editingInv ? 'Save Changes' : 'Create Action Plan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
