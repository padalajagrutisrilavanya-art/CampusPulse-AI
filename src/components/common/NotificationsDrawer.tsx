import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, AlertTriangle, Clock, Database, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { students, interventions, importHistory } = useApp();

  if (!isOpen) return null;

  const highRiskStudents = students.filter((s) => s.academicRisk === 'High').slice(0, 5);
  const pendingInterventions = interventions.filter((i) => i.status !== 'Completed').slice(0, 5);
  const recentImports = importHistory.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/50">
            <div>
              <h2 className="text-base font-bold text-slate-900">Campus Alerts & Activities</h2>
              <p className="text-xs text-slate-500">Live operational signals & action reminders</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Section 1: High Academic Risk Warnings */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600">
                  <AlertTriangle className="h-4 w-4" /> High Academic Risk Flags ({highRiskStudents.length})
                </span>
                <button
                  onClick={() => {
                    onClose();
                    navigate('/at-risk');
                  }}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2">
                {highRiskStudents.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => {
                      onClose();
                      navigate(`/students/${st.id}`);
                    }}
                    className="p-3 rounded-lg border border-red-100 bg-red-50/40 hover:bg-red-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{st.name} ({st.id})</div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          {st.department} • CGPA: {st.cgpa?.toFixed(2) ?? 'N/A'} • Att: {st.attendance}%
                        </div>
                        <div className="text-[10px] text-red-700 font-medium mt-1">
                          {st.academicRiskReasons[0] || 'Multiple risk triggers active'}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: Pending Interventions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600">
                  <Clock className="h-4 w-4" /> Pending Action Plans ({pendingInterventions.length})
                </span>
                <button
                  onClick={() => {
                    onClose();
                    navigate('/interventions');
                  }}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Manage
                </button>
              </div>

              <div className="space-y-2">
                {pendingInterventions.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      onClose();
                      navigate('/interventions');
                    }}
                    className="p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{inv.studentName}</div>
                        <div className="text-[11px] text-slate-600 line-clamp-1">{inv.issue}</div>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                          <span className="text-slate-500">Mentor: {inv.assignedMentor}</span>
                          <span className="font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Due {inv.targetDate}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-blue-600">
                        {inv.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Recent Data Operations */}
            <div>
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                <Database className="h-4 w-4" /> Recent Data Imports & Audit
              </span>

              <div className="space-y-2">
                {recentImports.map((imp) => (
                  <div key={imp.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 truncate">{imp.fileName}</span>
                      <span className="text-[10px] text-slate-500">{imp.timestamp}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600">
                      <span>{imp.dataType}</span>
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> {imp.successfulRows} synced
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 p-4 bg-slate-50">
            <button
              onClick={() => {
                onClose();
                navigate('/reports');
              }}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 text-center transition-colors shadow-xs"
            >
              Export Comprehensive Audit Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
