import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Briefcase,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Check,
  Building,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

export const DemoLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveRole, activeRole } = useApp();
  const [selectedRole, setSelectedRole] = useState<UserRole>(activeRole);

  const roles = [
    {
      id: 'admin' as UserRole,
      title: 'Administrator',
      roleBadge: 'Full Operational Control',
      icon: ShieldCheck,
      color: 'border-purple-200 bg-purple-50/50 text-purple-700',
      iconBg: 'bg-purple-100 text-purple-700',
      description: 'Manage institutional datasets, reconfigure Success Score weights, adjust risk engine thresholds, and execute multi-source CSV imports.',
      capabilities: [
        'Modify 0-100 Success Score weights with instant recalculation',
        'Upload & merge CSV data streams (Academics, LMS, Placement)',
        'Full student directory management and database reset',
        'Access all analytical reports and cohort segmentations',
      ],
    },
    {
      id: 'faculty' as UserRole,
      title: 'Faculty / Mentor',
      roleBadge: 'Academic Support & Retention',
      icon: UserCheck,
      color: 'border-blue-200 bg-blue-50/50 text-blue-700',
      iconBg: 'bg-blue-100 text-blue-700',
      description: 'Focus on early-warning screening, academic recovery plans, course-level attendance alerts, and direct student counseling notes.',
      capabilities: [
        'Monitor At-Risk Students Queue (<65% attendance, backlogs)',
        'Create and update structured student action plans',
        'Log mentor observation notes and counseling remarks',
        'Review individual student 360° academic progression trajectories',
      ],
    },
    {
      id: 'placement' as UserRole,
      title: 'Placement Officer',
      roleBadge: 'Recruiter Readiness & Upskilling',
      icon: Briefcase,
      color: 'border-teal-200 bg-teal-50/50 text-teal-700',
      iconBg: 'bg-teal-100 text-teal-700',
      description: 'Analyze campus placement drives, technical coding proficiencies, aptitude test benchmarks, and company tier eligibility simulations.',
      capabilities: [
        'Simulate company criteria (Dream Tier, Core Eng, Services)',
        'Identify students with high CGPA but low coding readiness',
        'Export placement candidate master lists to CSV',
        'Track technical assessment scores and verified resumes',
      ],
    },
  ];

  const handleLaunch = () => {
    setActiveRole(selectedRole);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Brand Bar */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-teal-400 text-white shadow-lg shadow-blue-500/30">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tight text-white">CampusPulse AI</span>
              <span className="rounded bg-teal-400/20 px-1.5 py-0.5 text-[10px] font-bold text-teal-300">
                PROTOTYPE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Smart Student Success & Campus Analytics</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-xs text-slate-300 font-mono">
            125 Students Loaded
          </span>
        </div>
      </div>

      {/* Main Role Selection Center */}
      <div className="max-w-4xl mx-auto w-full my-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Select Your Simulated Campus Role
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Experience role-specific analytics and workflows tailored for institutional administrators, academic mentors, and placement directors.
          </p>
        </div>

        {/* Security & Prototype Notice Banner */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200/90 flex items-start gap-3 backdrop-blur-xs">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-amber-300">Simulated Demo Architecture Notice: </strong>
            Role switching demonstrates workflow permissions and domain interfaces. This application runs entirely client-side with deterministic demo data and <code className="bg-amber-950/80 px-1 py-0.5 rounded text-amber-200">localStorage</code> persistence. It does not connect to external authentication backends or expose secrets.
          </div>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedRole === r.id;

            return (
              <div
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                className={`relative flex flex-col justify-between rounded-2xl border p-5 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-slate-800/90 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/40'
                    : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-xl ${r.iconBg}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {isSelected ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold">
                        ✓
                      </span>
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-slate-700" />
                    )}
                  </div>

                  <h3 className="mt-4 text-base font-bold text-white">{r.title}</h3>
                  <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-400">
                    {r.roleBadge}
                  </span>

                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">{r.description}</p>

                  <div className="mt-4 pt-3 border-t border-slate-700/60 space-y-1.5">
                    {r.capabilities.map((cap, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                        <Check className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-3">
                  <span
                    className={`block w-full text-center py-2 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {isSelected ? 'Active Selection' : 'Select Role'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={handleLaunch}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-teal-400 transition-all cursor-pointer"
          >
            <span>Launch CampusPulse Platform</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto w-full text-center text-xs text-slate-500 py-4 border-t border-slate-800">
        CampusPulse AI — Smart Student Success & Campus Analytics Platform • Built for College Hackathon
      </div>
    </div>
  );
};
