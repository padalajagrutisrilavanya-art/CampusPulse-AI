import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Award,
  AlertTriangle,
  Briefcase,
  CalendarCheck,
  GraduationCap,
  HeartHandshake,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  Layers,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { MetricCard } from '../components/common/MetricCard';
import { AcademicRiskBadge } from '../components/common/Badge';
import { Department } from '../types';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { filteredStudents, stats, insights, setMultipleFilters } = useApp();

  // 1. Risk Distribution Data
  const riskData = [
    { name: 'Low Risk', value: stats.lowAcademicRiskCount, color: '#10b981' },
    { name: 'Medium Risk', value: stats.medAcademicRiskCount, color: '#f59e0b' },
    { name: 'High Risk', value: stats.highAcademicRiskCount, color: '#ef4444' },
  ];

  // 2. Success Score Histogram (Bands: <50, 50-65, 66-79, 80-89, 90-100)
  const scoreBuckets = [
    { range: '< 50', count: filteredStudents.filter((s) => s.successScore < 50).length },
    { range: '50-65', count: filteredStudents.filter((s) => s.successScore >= 50 && s.successScore < 66).length },
    { range: '66-79', count: filteredStudents.filter((s) => s.successScore >= 66 && s.successScore < 80).length },
    { range: '80-89', count: filteredStudents.filter((s) => s.successScore >= 80 && s.successScore < 90).length },
    { range: '90-100', count: filteredStudents.filter((s) => s.successScore >= 90).length },
  ];

  // 3. Department Performance Benchmark
  const depts: Department[] = ['CSE', 'ECE', 'EEE', 'IT', 'MECH'];
  const deptPerformanceData = depts.map((d) => {
    const list = filteredStudents.filter((s) => s.department === d);
    if (list.length === 0) return { dept: d, avgCgpa: 0, avgAttendance: 0, avgSuccess: 0, count: 0 };
    const avgCgpa = list.reduce((acc, s) => acc + (s.cgpa ?? 0), 0) / list.length;
    const avgAttendance = list.reduce((acc, s) => acc + (s.attendance ?? 0), 0) / list.length;
    const avgSuccess = list.reduce((acc, s) => acc + s.successScore, 0) / list.length;
    return {
      dept: d,
      avgCgpa: Math.round(avgCgpa * 10 * 10) / 10, // scaled out of 100
      rawCgpa: Math.round(avgCgpa * 100) / 100,
      avgAttendance: Math.round(avgAttendance * 10) / 10,
      avgSuccess: Math.round(avgSuccess * 10) / 10,
      count: list.length,
    };
  });

  // 4. Attendance vs CGPA Scatter Data
  const scatterData = filteredStudents
    .filter((s) => s.attendance !== null && s.cgpa !== null)
    .map((s) => ({
      name: s.name,
      attendance: s.attendance,
      cgpa: s.cgpa,
      department: s.department,
      risk: s.academicRisk,
    }));

  // 5. Placement Readiness Tiers
  const placementTiers = [
    {
      tier: 'Product / Dream (≥75)',
      count: filteredStudents.filter((s) => (s.placementReadinessScore ?? 0) >= 75).length,
      fill: '#0d9488',
    },
    {
      tier: 'Core / IT (60-74)',
      count: filteredStudents.filter((s) => (s.placementReadinessScore ?? 0) >= 60 && (s.placementReadinessScore ?? 0) < 75).length,
      fill: '#2563eb',
    },
    {
      tier: 'Moderate (40-59)',
      count: filteredStudents.filter((s) => (s.placementReadinessScore ?? 0) >= 40 && (s.placementReadinessScore ?? 0) < 60).length,
      fill: '#f59e0b',
    },
    {
      tier: 'High Risk (<40)',
      count: filteredStudents.filter((s) => s.placementReadinessScore !== null && (s.placementReadinessScore ?? 0) < 40).length,
      fill: '#ef4444',
    },
  ];

  // 6. Semester Average Trends
  const semesterTrendData = [1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
    const list = filteredStudents.filter((s) => s.semester === sem);
    const avgC = list.length > 0 ? list.reduce((acc, s) => acc + (s.cgpa ?? 0), 0) / list.length : 7.0;
    const avgA = list.length > 0 ? list.reduce((acc, s) => acc + (s.attendance ?? 0), 0) / list.length : 80;
    return {
      sem: `Sem ${sem}`,
      avgCgpa: Math.round(avgC * 100) / 100,
      avgAttendance: Math.round(avgA * 10) / 10,
      students: list.length,
    };
  });

  // 7. Specific Risk Triggers
  const riskFactors = [
    { factor: 'Attendance < 65%', count: filteredStudents.filter((s) => (s.attendance ?? 100) < 65).length },
    { factor: 'CGPA < 5.00', count: filteredStudents.filter((s) => (s.cgpa ?? 10) < 5.0).length },
    { factor: 'Backlogs ≥ 3', count: filteredStudents.filter((s) => s.backlogs >= 3).length },
    { factor: 'Placement Readiness < 40', count: filteredStudents.filter((s) => (s.placementReadinessScore ?? 100) < 40).length },
  ];

  const handleRiskChartClick = (entry: any) => {
    if (!entry) return;
    const riskMap: Record<string, 'High' | 'Medium' | 'Low'> = {
      'High Risk': 'High',
      'Medium Risk': 'Medium',
      'Low Risk': 'Low',
    };
    const mapped = riskMap[entry.name];
    if (mapped) {
      setMultipleFilters({ academicRisk: mapped });
      navigate('/students');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Institutional Success & Campus Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time, rule-based screening engine monitoring academic milestones, student retention & placement trajectories.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/students')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Users className="h-4 w-4" />
            View Student Roster
          </button>
          <button
            onClick={() => navigate('/at-risk')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-red-700 transition-colors"
          >
            <AlertTriangle className="h-4 w-4" />
            At-Risk Queue ({stats.highAcademicRiskCount})
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Students"
          value={stats.totalStudents}
          subtitle="Active enrolled roster"
          icon={Users}
          accentColor="blue"
          onClick={() => navigate('/students')}
        />
        <MetricCard
          title="Avg Success Score"
          value={`${stats.avgSuccessScore}`}
          subtitle="Out of 100 index"
          icon={Award}
          trendText="Institutional"
          trendType="neutral"
          accentColor="teal"
          onClick={() => navigate('/settings')}
        />
        <MetricCard
          title="High Academic Risk"
          value={stats.highAcademicRiskCount}
          subtitle="Requires immediate review"
          icon={AlertTriangle}
          trendText="Action Required"
          trendType="negative"
          accentColor="red"
          onClick={() => {
            setMultipleFilters({ academicRisk: 'High' });
            navigate('/at-risk');
          }}
        />
        <MetricCard
          title="High Placement Risk"
          value={stats.highPlacementRiskCount}
          subtitle="Score < 40 / 100"
          icon={Briefcase}
          trendText="Upskilling needed"
          trendType="negative"
          accentColor="amber"
          onClick={() => navigate('/placement')}
        />
        <MetricCard
          title="Avg Attendance"
          value={`${stats.avgAttendance}%`}
          subtitle="Min threshold: 75%"
          icon={CalendarCheck}
          trendText={stats.avgAttendance >= 75 ? 'Healthy' : 'Below cutoff'}
          trendType={stats.avgAttendance >= 75 ? 'positive' : 'negative'}
          accentColor={stats.avgAttendance >= 75 ? 'emerald' : 'amber'}
        />
        <MetricCard
          title="Average CGPA"
          value={stats.avgCgpa.toFixed(2)}
          subtitle="Scale 0.0 - 10.0"
          icon={GraduationCap}
          accentColor="blue"
        />
        <MetricCard
          title="Medium Risk"
          value={stats.medAcademicRiskCount}
          subtitle="Early warning cohort"
          icon={TrendingUp}
          accentColor="amber"
          onClick={() => {
            setMultipleFilters({ academicRisk: 'Medium' });
            navigate('/students');
          }}
        />
        <MetricCard
          title="Low Risk (Healthy)"
          value={stats.lowAcademicRiskCount}
          subtitle="On-track students"
          icon={Award}
          trendText="Satisfactory"
          trendType="positive"
          accentColor="emerald"
          onClick={() => {
            setMultipleFilters({ academicRisk: 'Low' });
            navigate('/students');
          }}
        />
        <MetricCard
          title="Action Plan Progress"
          value={`${stats.interventionCompletionRate}%`}
          subtitle="Completed interventions"
          icon={HeartHandshake}
          trendText={`${stats.pendingInterventionsCount} Pending`}
          trendType="neutral"
          accentColor="purple"
          onClick={() => navigate('/interventions')}
        />
        <MetricCard
          title="Active Segments"
          value="8 Cohorts"
          subtitle="Data-driven personas"
          icon={Layers}
          accentColor="teal"
          onClick={() => navigate('/segmentation')}
        />
      </div>

      {/* Deterministic Explainable Analytics Section */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-teal-500/20 p-2 text-teal-300 border border-teal-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Explainable Analytics Engine — Key Institutional Signals</h2>
              <p className="text-xs text-slate-300">
                Rule-based signals computed directly from the active dataset. Every insight reveals exact evidence and calculation criteria.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300 border border-slate-700">
            {insights.length} Signals Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((ins) => (
            <div
              key={ins.id}
              className="flex flex-col justify-between rounded-xl bg-slate-800/80 p-4 border border-slate-700/80 hover:border-slate-600 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      ins.type === 'alert'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : ins.type === 'opportunity'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    }`}
                  >
                    {ins.type.toUpperCase()}
                  </span>
                  <span className="text-xs font-bold text-slate-300">
                    {ins.affectedCount} Affected
                  </span>
                </div>

                <h3 className="mt-2 text-xs font-bold text-white leading-snug">{ins.title}</h3>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">{ins.evidence}</p>

                <div className="mt-2.5 rounded bg-slate-900/60 p-2 border border-slate-800 text-[11px] text-slate-400">
                  <span className="text-slate-200 font-semibold">Rule logic: </span>
                  {ins.calculationExplanation}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
                <span className="text-[11px] text-teal-300 font-medium">Rec: {ins.recommendedAction.slice(0, 42)}...</span>
                <button
                  onClick={() => {
                    if (ins.filterAction?.segmentId) {
                      navigate('/segmentation');
                    } else if (ins.filterAction) {
                      setMultipleFilters(ins.filterAction);
                      navigate('/students');
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded bg-blue-600 hover:bg-blue-500 px-2.5 py-1 text-xs font-semibold text-white shadow-xs"
                >
                  View Cohort
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Charts Row 1: Risk Donut & Success Score Histogram */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Academic Risk Distribution</h2>
              <p className="text-xs text-slate-500">Interactive: Click any segment to view matching students</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">Rule-based classification</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  onClick={(entry) => handleRiskChartClick(entry)}
                  cursor="pointer"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [
                    `${val} students (${Math.round(((val as number) / stats.totalStudents) * 100)}%)`,
                    name,
                  ]}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-center text-xs text-slate-400">
            Tip: Click on High Risk or Medium Risk to open the pre-filtered student roster.
          </div>
        </div>

        {/* Success Score Distribution */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Success Score Distribution</h2>
              <p className="text-xs text-slate-500">Multidimensional composite index (0 - 100)</p>
            </div>
            <button
              onClick={() => navigate('/settings')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Weights Config
            </button>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreBuckets}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  formatter={(val: any) => [`${val} students`, 'Student Count']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Interactive Charts Row 2: Department Performance & Attendance vs CGPA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Benchmark */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Department Performance Comparison</h2>
              <p className="text-xs text-slate-500">Average CGPA (x10), Attendance %, and Success Score</p>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="dept" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
                <Tooltip
                  formatter={(val: any, name: any) => [`${val}`, name]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend verticalAlign="bottom" height={36} />
                <Bar name="Avg Success Score" dataKey="avgSuccess" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar name="Avg Attendance %" dataKey="avgAttendance" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar name="CGPA Index" dataKey="avgCgpa" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance vs CGPA Scatter */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Attendance vs. CGPA Correlation</h2>
              <p className="text-xs text-slate-500">Visualizing academic retention impact</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">Each dot is a student</span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  dataKey="attendance"
                  name="Attendance"
                  unit="%"
                  domain={[40, 100]}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <YAxis
                  type="number"
                  dataKey="cgpa"
                  name="CGPA"
                  domain={[3.0, 10.0]}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(val: any, name: any) => [val, name]}
                  content={({ payload }: any) => {
                    if (payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-md text-xs">
                          <p className="font-bold text-slate-900">{data.name}</p>
                          <p className="text-slate-600">Department: {data.department}</p>
                          <p className="text-slate-600">Attendance: {data.attendance}%</p>
                          <p className="text-slate-600">CGPA: {data.cgpa}</p>
                          <p className="mt-1 font-semibold text-red-600">Risk: {data.risk}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Students" data={scatterData} fill="#2563eb" fillOpacity={0.65} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Placement Readiness & Risk Factor Counts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placement Readiness Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Placement Readiness Tiers</h2>
              <p className="text-xs text-slate-500">Campus drive eligibility distribution</p>
            </div>
            <button
              onClick={() => navigate('/placement')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Placement Cell
            </button>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={placementTiers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis dataKey="tier" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={140} />
                <Tooltip
                  formatter={(val: any) => [`${val} students`, 'Candidates']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {placementTiers.map((entry, index) => (
                    <Cell key={`tier-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Primary Academic Risk Triggers */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Primary Risk Factor Triggers</h2>
              <p className="text-xs text-slate-500">Students violating specific early-warning criteria</p>
            </div>
            <button
              onClick={() => navigate('/at-risk')}
              className="text-xs font-semibold text-red-600 hover:underline"
            >
              Risk Queue
            </button>
          </div>

          <div className="space-y-3 mt-4">
            {riskFactors.map((rf, idx) => {
              const pct = Math.round((rf.count / stats.totalStudents) * 100);
              return (
                <div key={idx} className="p-3 rounded-lg border border-slate-100 bg-slate-50/70">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-800">{rf.factor}</span>
                    <span className="font-bold text-slate-900">{rf.count} students ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-red-500' : idx === 2 ? 'bg-rose-600' : 'bg-blue-600'}`}
                      style={{ width: `${Math.min(100, pct * 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
