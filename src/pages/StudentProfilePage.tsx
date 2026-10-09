import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  GraduationCap,
  CalendarCheck,
  Award,
  AlertTriangle,
  Briefcase,
  Layers,
  HeartHandshake,
  Mail,
  Phone,
  User,
  Clock,
  Sparkles,
  Plus,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldAlert,
  Send,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { AcademicRiskBadge, PlacementRiskBadge, StatusBadge, Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const StudentProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    students,
    interventions,
    addIntervention,
    addMentorFeedback,
    activeRole,
  } = useApp();

  const student = students.find((s) => s.id === id);

  const [activeTab, setActiveTab] = useState<'academics' | 'engagement' | 'placement' | 'feedback' | 'interventions'>('academics');
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // New Intervention Form State
  const [newInv, setNewInv] = useState({
    issue: '',
    recommendedAction: '',
    assignedMentor: student?.mentorName || 'Faculty Mentor',
    priority: 'High' as 'High' | 'Medium' | 'Low',
    targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
  });

  // New Feedback Note Form State
  const [feedbackNote, setFeedbackNote] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState<'Academic' | 'Attendance' | 'Behavioral' | 'Placement'>('Academic');

  if (!student) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <h2 className="text-base font-bold text-slate-800">Student Record Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">
          The requested student ID "{id}" could not be located in the active campus dataset.
        </p>
        <button
          onClick={() => navigate('/students')}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
        >
          Return to Student Directory
        </button>
      </div>
    );
  }

  // Pre-fill recommendations based on actual risk triggers
  const handleOpenInterventionModal = () => {
    let issueSuggestion = '';
    let actionSuggestion = '';

    if (student.academicRiskReasons.length > 0) {
      issueSuggestion = student.academicRiskReasons.join('; ');
      if (student.attendance && student.attendance < 65) {
        actionSuggestion = 'Issue formal attendance advisory letter, mandate attendance logging, and arrange guardian counseling.';
      } else if (student.backlogs >= 3) {
        actionSuggestion = 'Enroll in specialized remedial tutoring batches and assign peer-study mentor.';
      } else {
        actionSuggestion = 'Conduct bi-weekly academic progress reviews and concept reinforcement sessions.';
      }
    } else if (student.placementRisk === 'High') {
      issueSuggestion = `Placement readiness deficit: ${student.placementRiskReasons.join('; ')}`;
      actionSuggestion = 'Mandate 40 hours of Data Structures practice and weekly mock interviews with placement coaches.';
    } else {
      issueSuggestion = 'General mentor progress review and academic counseling.';
      actionSuggestion = 'Follow-up on semester examination preparedness and career milestone tracking.';
    }

    setNewInv({
      issue: issueSuggestion,
      recommendedAction: actionSuggestion,
      assignedMentor: student.mentorName || 'Faculty Mentor',
      priority: student.academicRisk === 'High' ? 'High' : 'Medium',
      targetDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Initial counseling session scheduled.',
    });
    setShowInterventionModal(true);
  };

  const handleCreateIntervention = (e: React.FormEvent) => {
    e.preventDefault();
    addIntervention({
      studentId: student.id,
      studentName: student.name,
      studentDepartment: student.department,
      issue: newInv.issue,
      recommendedAction: newInv.recommendedAction,
      assignedMentor: newInv.assignedMentor,
      priority: newInv.priority,
      targetDate: newInv.targetDate,
      status: 'Pending',
      notes: newInv.notes,
    });
    setShowInterventionModal(false);
  };

  const handleAddFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackNote.trim()) return;
    addMentorFeedback(student.id, feedbackNote.trim(), feedbackCategory);
    setFeedbackNote('');
    setShowFeedbackModal(false);
  };

  const studentInterventions = interventions.filter((i) => i.studentId === student.id);

  // Component breakdown table items
  const breakdownItems = [
    { key: 'academics', label: 'Academics (CGPA)', data: student.successScoreBreakdown.academics },
    { key: 'attendance', label: 'Classroom Attendance', data: student.successScoreBreakdown.attendance },
    { key: 'lms', label: 'LMS Engagement', data: student.successScoreBreakdown.lms },
    { key: 'campus', label: 'Campus Engagement', data: student.successScoreBreakdown.campus },
    { key: 'placement', label: 'Placement Readiness', data: student.successScoreBreakdown.placement },
    { key: 'skills', label: 'Skills Assessment', data: student.successScoreBreakdown.skills },
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/students')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Directory
        </button>
      </div>

      {/* Student 360° Hero Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-xl font-bold text-white shadow-md">
              {student.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{student.name}</h1>
                <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {student.id}
                </span>
                <AcademicRiskBadge level={student.academicRisk} />
                <PlacementRiskBadge level={student.placementRisk} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span>
                  <strong>Department:</strong> {student.department}
                </span>
                <span>
                  <strong>Year & Sem:</strong> Year {student.year} (Semester {student.semester}) - Sec {student.section}
                </span>
                <span>
                  <strong>Mentor:</strong> {student.mentorName}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-slate-400" /> {student.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-slate-400" /> {student.phone}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              <FileText className="h-4 w-4" />
              Add Mentor Note
            </button>
            <button
              onClick={handleOpenInterventionModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
            >
              <HeartHandshake className="h-4 w-4" />
              Create Action Plan
            </button>
          </div>
        </div>

        {/* Highlight Stats Row */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 pt-6">
          <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Current CGPA</div>
            <div className="mt-1 text-xl font-bold text-slate-900">{student.cgpa?.toFixed(2) ?? 'N/A'}</div>
            <div className="text-[10px] text-slate-500">{student.backlogs} active backlogs</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Attendance</div>
            <div
              className={`mt-1 text-xl font-bold ${
                (student.attendance ?? 100) < 65
                  ? 'text-red-600'
                  : (student.attendance ?? 100) < 75
                  ? 'text-amber-600'
                  : 'text-emerald-700'
              }`}
            >
              {student.attendance !== null ? `${student.attendance}%` : 'N/A'}
            </div>
            <div className="text-[10px] text-slate-500">Min required: 75%</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Success Score</div>
            <div className="mt-1 text-xl font-bold text-blue-600 flex items-center justify-center gap-1">
              {student.successScore}
              {student.isProvisionalScore && (
                <span className="text-[9px] bg-purple-100 text-purple-700 px-1 rounded uppercase font-bold">
                  Prov
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500">{student.dataCompleteness}% data completeness</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Placement Readiness</div>
            <div className="mt-1 text-xl font-bold text-teal-700">
              {student.placementReadinessScore !== null ? `${student.placementReadinessScore} / 100` : 'Pending'}
            </div>
            <div className="text-[10px] text-slate-500">{student.internshipStatus} internship</div>
          </div>
        </div>
      </div>

      {/* Success Score & Risk Engine Transparency Dual Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transparent Success Score Breakdown Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Configurable Success Score Breakdown</h2>
              <p className="text-xs text-slate-500">
                Dynamic weights, proportional renormalization & contribution points
              </p>
            </div>
            <button
              onClick={() => navigate('/settings')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Settings
            </button>
          </div>

          {student.isProvisionalScore && (
            <div className="mb-4 rounded-lg bg-purple-50 p-3 border border-purple-200 text-xs text-purple-900">
              <span className="font-bold">Provisional Score Notice: </span>
              Certain component data is missing from the active roster. Available weights have been proportionally renormalized to maintain a 100% composite basis without defaulting missing inputs to zero.
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="pb-2 font-semibold">Component</th>
                  <th className="pb-2 font-semibold text-right">Raw</th>
                  <th className="pb-2 font-semibold text-right">Norm (0-100)</th>
                  <th className="pb-2 font-semibold text-right">Nominal Wt</th>
                  <th className="pb-2 font-semibold text-right">Effective Wt</th>
                  <th className="pb-2 font-semibold text-right">Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {breakdownItems.map((item) => (
                  <tr key={item.key} className="hover:bg-slate-50">
                    <td className="py-2.5 font-medium text-slate-900">
                      <div>{item.label}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{item.data.description}</div>
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-700">
                      {item.data.available && item.data.raw !== null ? item.data.raw : <span className="text-slate-400 italic">Missing</span>}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-slate-800">
                      {item.data.available && item.data.normalized !== null ? item.data.normalized : '-'}
                    </td>
                    <td className="py-2.5 text-right text-slate-500">{item.data.weight}%</td>
                    <td className="py-2.5 text-right font-medium text-blue-700">
                      {item.data.available ? `${item.data.effectiveWeight}%` : '0%'}
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-900">
                      {item.data.available ? item.data.contribution : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 font-bold text-slate-900">
                <tr>
                  <td className="pt-2.5">Total Composite Success Score</td>
                  <td colSpan={4} className="pt-2.5 text-right text-slate-500">Sum of contributions:</td>
                  <td className="pt-2.5 text-right text-sm text-blue-600">{student.successScore} / 100</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Explainable Risk Engine Audit Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Risk Engine Audit & Trigger Explanations</h2>
                <p className="text-xs text-slate-500">Deterministic rule-based criteria and indicators</p>
              </div>
              <ShieldAlert className="h-5 w-5 text-slate-400" />
            </div>

            {/* Academic Risk Reasons */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Academic Risk Classification</span>
                  <AcademicRiskBadge level={student.academicRisk} />
                </div>
                <div className="mt-2 space-y-1">
                  {student.academicRiskReasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="text-red-500 font-bold mt-0.5">•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Placement Risk Reasons */}
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Placement Risk Classification</span>
                  <PlacementRiskBadge level={student.placementRisk} />
                </div>
                <div className="mt-2 space-y-1">
                  {student.placementRiskReasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="text-amber-500 font-bold mt-0.5">•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ethical Disclaimer */}
            <div className="mt-4 rounded-xl bg-amber-50/70 p-3.5 border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
              <span className="font-bold flex items-center gap-1 text-amber-800 mb-0.5">
                <AlertCircle className="h-3.5 w-3.5" /> Explainable Analytics Ethics Disclaimer:
              </span>
              Rule-based indicators identify students who statistically benefit from early academic advising, remedial support, or placement mentoring. These flags do not predict guaranteed academic failure or unemployability.
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Active segments:</span>
            <div className="flex flex-wrap gap-1">
              {student.applicableSegments.map((seg) => (
                <span key={seg} className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                  {seg}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Detailed Information */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6">
          {[
            { id: 'academics', label: 'Marks & Attendance Details', icon: GraduationCap },
            { id: 'engagement', label: 'LMS & Campus Engagement', icon: Layers },
            { id: 'placement', label: 'Placement & Skills Matrix', icon: Briefcase },
            { id: 'feedback', label: `Mentor Feedback (${student.mentorFeedback.length})`, icon: FileText },
            { id: 'interventions', label: `Interventions (${studentInterventions.length})`, icon: HeartHandshake },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 border-b-2 py-4 px-4 text-xs font-semibold transition-all ${
                  isActive
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* TAB 1: ACADEMICS */}
          {activeTab === 'academics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Semester Trend Chart */}
                <div className="rounded-xl border border-slate-200 p-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Semester-by-Semester SGPA Progression
                  </h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={student.semesterMarks}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="semester" tickFormatter={(v) => `Sem ${v}`} tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: any) => [`${v}`, 'SGPA']} />
                        <Line
                          type="monotone"
                          dataKey="sgpa"
                          stroke="#2563eb"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: '#2563eb' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Course Attendance Breakdown */}
                <div className="rounded-xl border border-slate-200 p-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                    Course-Level Attendance Breakdown
                  </h3>
                  <div className="space-y-3">
                    {student.courseAttendance.map((ca) => (
                      <div key={ca.courseCode} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-slate-900">{ca.courseCode}: {ca.courseName}</span>
                            <div className="text-[11px] text-slate-500">{ca.attended} of {ca.total} sessions attended</div>
                          </div>
                          <span
                            className={`font-bold ${
                              ca.percentage < 65
                                ? 'text-red-600'
                                : ca.percentage < 75
                                ? 'text-amber-600'
                                : 'text-emerald-700'
                            }`}
                          >
                            {ca.percentage}%
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              ca.percentage < 65 ? 'bg-red-500' : ca.percentage < 75 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${ca.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ENGAGEMENT */}
          {activeTab === 'engagement' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-slate-200 p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Digital LMS Engagement Metrics
                </h3>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <span className="text-slate-600">Portal Logins per Week</span>
                  <span className="font-bold text-slate-900">{student.lmsLoginsPerWeek ?? 'N/A'} logins/week</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <span className="text-slate-600">Assignment Submission Rate</span>
                  <span className="font-bold text-slate-900">{student.assignmentCompletionRate ?? 'N/A'}%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <span className="text-slate-600">Courseware Video Watch %</span>
                  <span className="font-bold text-slate-900">{student.videoWatchPercentage ?? 'N/A'}%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <span className="text-slate-600">Last LMS Login Date</span>
                  <span className="font-mono text-slate-800">{student.lastLmsActiveDate || '2026-10-06'}</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Campus & Co-Curricular Engagement
                </h3>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <span className="text-slate-600">Registered Club Memberships</span>
                  <span className="font-bold text-slate-900">{student.clubParticipationCount ?? 0} Clubs</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <span className="text-slate-600">Event & Hackathon Participation</span>
                  <span className="font-bold text-slate-900">{student.eventParticipationCount ?? 0} Events</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <span className="text-slate-600">Student Leadership Role</span>
                  <span className="font-bold text-slate-900">{student.hasLeadershipRole ? 'Yes (Active)' : 'None'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <span className="text-slate-600">Sports or Cultural Representative</span>
                  <span className="font-bold text-slate-900">{student.sportsOrCultural ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PLACEMENT & SKILLS */}
          {activeTab === 'placement' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-200 p-3 text-center">
                  <div className="text-[11px] text-slate-500 font-semibold uppercase">Coding Score</div>
                  <div className="mt-1 text-xl font-bold text-slate-900">{student.codingScore ?? 'N/A'}</div>
                </div>
                <div className="rounded-xl border border-slate-200 p-3 text-center">
                  <div className="text-[11px] text-slate-500 font-semibold uppercase">Aptitude Score</div>
                  <div className="mt-1 text-xl font-bold text-slate-900">{student.aptitudeScore ?? 'N/A'}</div>
                </div>
                <div className="rounded-xl border border-slate-200 p-3 text-center">
                  <div className="text-[11px] text-slate-500 font-semibold uppercase">Mock Interview</div>
                  <div className="mt-1 text-xl font-bold text-slate-900">{student.mockInterviewScore ?? 'N/A'}</div>
                </div>
                <div className="rounded-xl border border-slate-200 p-3 text-center">
                  <div className="text-[11px] text-slate-500 font-semibold uppercase">Resume Score</div>
                  <div className="mt-1 text-xl font-bold text-slate-900">{student.resumeScore ?? 'N/A'}</div>
                </div>
              </div>

              {/* Skills Matrix */}
              <div className="rounded-xl border border-slate-200 p-5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Verified Skills Competency Matrix
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {student.skillsList.map((sk, i) => (
                    <div key={i} className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-900">{sk.name}</div>
                        <div className="text-[10px] text-slate-500">{sk.category} Competency</div>
                      </div>
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                        {sk.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MENTOR FEEDBACK */}
          {activeTab === 'feedback' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Faculty & Counselor Observations
                </h3>
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Observation Note
                </button>
              </div>

              {student.mentorFeedback.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No feedback notes recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {student.mentorFeedback.map((fb) => (
                    <div key={fb.id} className="p-4 rounded-xl border border-slate-200 bg-white">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{fb.mentor}</span>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            {fb.category}
                          </span>
                        </div>
                        <span className="text-slate-400 text-[11px]">{fb.date}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-700 leading-relaxed">{fb.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: INTERVENTIONS */}
          {activeTab === 'interventions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Action Plans & Remedial Cases
                </h3>
                <button
                  onClick={handleOpenInterventionModal}
                  className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Action Plan
                </button>
              </div>

              {studentInterventions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed rounded-xl border-slate-300">
                  No active interventions created for this student yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {studentInterventions.map((inv) => (
                    <div key={inv.id} className="p-4 rounded-xl border border-slate-200 bg-white">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={inv.status} />
                          <span className="font-bold text-slate-900">Priority: {inv.priority}</span>
                        </div>
                        <span className="text-slate-500 text-[11px]">Due: {inv.targetDate}</span>
                      </div>
                      <div className="mt-2 text-xs">
                        <div className="font-semibold text-slate-900">Issue: {inv.issue}</div>
                        <div className="mt-1 text-slate-700"><strong>Recommended Action:</strong> {inv.recommendedAction}</div>
                        <div className="mt-1 text-slate-500"><strong>Mentor Notes:</strong> {inv.notes}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Intervention Modal */}
      <Modal
        isOpen={showInterventionModal}
        onClose={() => setShowInterventionModal(false)}
        title="Create Student Action Plan"
        subtitle={`Assign mentoring, remedial support, or placement tasks for ${student.name}`}
      >
        <form onSubmit={handleCreateIntervention} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Issue / Identified Risk Area *</label>
            <textarea
              required
              rows={2}
              value={newInv.issue}
              onChange={(e) => setNewInv({ ...newInv, issue: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Recommended Action Plan *</label>
            <textarea
              required
              rows={2}
              value={newInv.recommendedAction}
              onChange={(e) => setNewInv({ ...newInv, recommendedAction: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Assigned Mentor</label>
              <input
                type="text"
                required
                value={newInv.assignedMentor}
                onChange={(e) => setNewInv({ ...newInv, assignedMentor: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Priority Level</label>
              <select
                value={newInv.priority}
                onChange={(e) => setNewInv({ ...newInv, priority: e.target.value as any })}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs bg-white"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Target Completion Date</label>
            <input
              type="date"
              required
              value={newInv.targetDate}
              onChange={(e) => setNewInv({ ...newInv, targetDate: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Counseling Notes</label>
            <textarea
              rows={2}
              value={newInv.notes}
              onChange={(e) => setNewInv({ ...newInv, notes: e.target.value })}
              placeholder="Record counseling notes or scheduled tutorial sessions..."
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowInterventionModal(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Create Action Plan
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Feedback Note Modal */}
      <Modal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        title="Add Mentor Observation Note"
        subtitle={`Records progress observation for ${student.name}`}
      >
        <form onSubmit={handleAddFeedback} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Category</label>
            <select
              value={feedbackCategory}
              onChange={(e) => setFeedbackCategory(e.target.value as any)}
              className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs bg-white"
            >
              <option value="Academic">Academic Progress</option>
              <option value="Attendance">Attendance Counseling</option>
              <option value="Behavioral">Behavioral / Engagement</option>
              <option value="Placement">Placement Preparation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Observation Details *</label>
            <textarea
              required
              rows={4}
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              placeholder="Enter mentor notes regarding student performance, discussion summary, or recommendations..."
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowFeedbackModal(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Save Note
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
