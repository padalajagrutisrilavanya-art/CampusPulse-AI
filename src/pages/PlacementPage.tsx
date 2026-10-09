import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Award,
  AlertTriangle,
  Code2,
  FileCheck,
  TrendingUp,
  Download,
  ExternalLink,
  Target,
  Sparkles,
  Building,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { PlacementRiskBadge } from '../components/common/Badge';
import { exportStudentsToCsv } from '../services/csvService';

export const PlacementPage: React.FC = () => {
  const navigate = useNavigate();
  const { filteredStudents } = useApp();

  const [tierFilter, setTierFilter] = useState<'ALL' | 'DREAM' | 'CORE' | 'SERVICES' | 'AT_RISK'>('ALL');

  // Eligibility Rules
  // Dream / Product: CGPA >= 8.0 AND Readiness >= 75
  // Core Engineering: CGPA >= 6.5 AND Readiness >= 60
  // Mass IT Services: CGPA >= 6.0 AND Readiness >= 50
  // At-Risk: Readiness < 40

  const studentsWithEligibility = useMemo(() => {
    return filteredStudents.map((s) => {
      const cgpa = s.cgpa ?? 0;
      const readiness = s.placementReadinessScore ?? 0;

      const isDreamEligible = cgpa >= 8.0 && readiness >= 75 && s.backlogs === 0;
      const isCoreEligible = cgpa >= 6.5 && readiness >= 60 && s.backlogs <= 1;
      const isServicesEligible = cgpa >= 6.0 && readiness >= 50;
      const isAtRisk = readiness < 40;

      let tierBadge = 'Not Eligible';
      let tierColor = 'bg-slate-100 text-slate-700';

      if (isDreamEligible) {
        tierBadge = 'Dream Tier 1 (Product)';
        tierColor = 'bg-emerald-50 text-emerald-800 border border-emerald-200';
      } else if (isCoreEligible) {
        tierBadge = 'Core Engineering / IT';
        tierColor = 'bg-blue-50 text-blue-800 border border-blue-200';
      } else if (isServicesEligible) {
        tierBadge = 'Services Recruiters';
        tierColor = 'bg-amber-50 text-amber-800 border border-amber-200';
      } else if (isAtRisk) {
        tierBadge = 'Placement High Risk';
        tierColor = 'bg-red-50 text-red-800 border border-red-200';
      }

      return {
        ...s,
        isDreamEligible,
        isCoreEligible,
        isServicesEligible,
        isAtRisk,
        tierBadge,
        tierColor,
      };
    });
  }, [filteredStudents]);

  const displayedStudents = useMemo(() => {
    return studentsWithEligibility.filter((s) => {
      if (tierFilter === 'DREAM') return s.isDreamEligible;
      if (tierFilter === 'CORE') return s.isCoreEligible;
      if (tierFilter === 'SERVICES') return s.isServicesEligible;
      if (tierFilter === 'AT_RISK') return s.isAtRisk;
      return true;
    });
  }, [studentsWithEligibility, tierFilter]);

  // Statistics for Placement Cell
  const dreamCount = studentsWithEligibility.filter((s) => s.isDreamEligible).length;
  const coreCount = studentsWithEligibility.filter((s) => s.isCoreEligible).length;
  const servicesCount = studentsWithEligibility.filter((s) => s.isServicesEligible).length;
  const atRiskCount = studentsWithEligibility.filter((s) => s.isAtRisk).length;

  // Department Placement Benchmark
  const depts = ['CSE', 'ECE', 'EEE', 'IT', 'MECH'] as const;
  const deptData = depts.map((d) => {
    const list = studentsWithEligibility.filter((s) => s.department === d);
    const avgCoding = list.length > 0 ? list.reduce((acc, s) => acc + (s.codingScore ?? 0), 0) / list.length : 0;
    const avgAptitude = list.length > 0 ? list.reduce((acc, s) => acc + (s.aptitudeScore ?? 0), 0) / list.length : 0;
    const avgInterview = list.length > 0 ? list.reduce((acc, s) => acc + (s.mockInterviewScore ?? 0), 0) / list.length : 0;
    return {
      department: d,
      avgCoding: Math.round(avgCoding),
      avgAptitude: Math.round(avgAptitude),
      avgInterview: Math.round(avgInterview),
    };
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-teal-600" />
            Placement Readiness & Corporate Eligibility
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Placement Cell operational console for recruiter criteria simulation, coding proficiency & skills gap intervention.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportStudentsToCsv(displayedStudents, 'placement_readiness_candidates.csv')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Candidates CSV ({displayedStudents.length})
          </button>
        </div>
      </div>

      {/* Recruiter Eligibility Simulator Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setTierFilter(tierFilter === 'DREAM' ? 'ALL' : 'DREAM')}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            tierFilter === 'DREAM' ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-200' : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Dream Tier (Product)</span>
            <Target className="h-4 w-4 text-teal-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{dreamCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">CGPA ≥ 8.0 & Readiness ≥ 75</div>
        </div>

        <div
          onClick={() => setTierFilter(tierFilter === 'CORE' ? 'ALL' : 'CORE')}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            tierFilter === 'CORE' ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-200' : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Core Engineering / IT</span>
            <Building className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{coreCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">CGPA ≥ 6.5 & Readiness ≥ 60</div>
        </div>

        <div
          onClick={() => setTierFilter(tierFilter === 'SERVICES' ? 'ALL' : 'SERVICES')}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            tierFilter === 'SERVICES' ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-200' : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Mass Recruiters</span>
            <Award className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{servicesCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">CGPA ≥ 6.0 & Readiness ≥ 50</div>
        </div>

        <div
          onClick={() => setTierFilter(tierFilter === 'AT_RISK' ? 'ALL' : 'AT_RISK')}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            tierFilter === 'AT_RISK' ? 'border-red-500 bg-red-50/50 ring-2 ring-red-200' : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700">High Placement Risk</span>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{atRiskCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Readiness &lt; 40 / 100</div>
        </div>
      </div>

      {/* Benchmark Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-1">
          Technical & Aptitude Competencies by Department
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Comparing average coding assessment, quantitative aptitude, and mock interview scores
        </p>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="department" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              <Legend verticalAlign="bottom" height={36} />
              <Bar name="Coding Assessment" dataKey="avgCoding" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar name="Quantitative Aptitude" dataKey="avgAptitude" fill="#0d9488" radius={[4, 4, 0, 0]} />
              <Bar name="Mock Interview" dataKey="avgInterview" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-200 bg-slate-50/75 px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">
            Candidate Roster ({displayedStudents.length} Students)
            {tierFilter !== 'ALL' && <span className="ml-2 text-blue-600 font-semibold">• Filter: {tierFilter}</span>}
          </span>
          {tierFilter !== 'ALL' && (
            <button
              onClick={() => setTierFilter('ALL')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Reset Tier Filter
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Student ID & Name</th>
                <th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold text-right">CGPA</th>
                <th className="px-4 py-3 font-semibold text-right">Coding</th>
                <th className="px-4 py-3 font-semibold text-right">Aptitude</th>
                <th className="px-4 py-3 font-semibold text-right">Interview</th>
                <th className="px-4 py-3 font-semibold text-center">Composite Readiness</th>
                <th className="px-4 py-3 font-semibold">Simulated Eligibility</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedStudents.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{st.name}</div>
                    <div className="font-mono text-[11px] text-blue-600">{st.id}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {st.department} • Year {st.year}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {st.cgpa?.toFixed(2) ?? 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={(st.codingScore ?? 100) < 45 ? 'text-red-600 font-bold' : 'text-slate-800'}>
                      {st.codingScore ?? 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-800">
                    {st.aptitudeScore ?? 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-800">
                    {st.mockInterviewScore ?? 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex items-center gap-1 font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {st.placementReadinessScore ?? 'N/A'} / 100
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${st.tierColor}`}>
                      {st.tierBadge}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => navigate(`/students/${st.id}`)}
                      className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      Profile
                    </button>
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
