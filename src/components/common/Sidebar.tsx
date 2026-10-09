import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  AlertOctagon,
  Briefcase,
  Layers,
  HeartHandshake,
  Database,
  FileBarChart2,
  Sliders,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { stats, activeRole, resetAllDemoData } = useApp();

  const navItems = [
    {
      to: '/',
      label: 'Overview Dashboard',
      icon: LayoutDashboard,
      roleAccess: ['admin', 'faculty', 'placement'],
    },
    {
      to: '/students',
      label: 'Student Directory',
      icon: Users,
      roleAccess: ['admin', 'faculty', 'placement'],
    },
    {
      to: '/at-risk',
      label: 'At-Risk Students',
      icon: AlertOctagon,
      badge: stats.highAcademicRiskCount > 0 ? `${stats.highAcademicRiskCount}` : undefined,
      badgeColor: 'bg-red-500 text-white',
      roleAccess: ['admin', 'faculty'],
    },
    {
      to: '/placement',
      label: 'Placement Readiness',
      icon: Briefcase,
      badge: stats.highPlacementRiskCount > 0 ? `${stats.highPlacementRiskCount}` : undefined,
      badgeColor: 'bg-amber-500 text-white',
      roleAccess: ['admin', 'placement'],
    },
    {
      to: '/segmentation',
      label: 'Student Segmentation',
      icon: Layers,
      roleAccess: ['admin', 'faculty', 'placement'],
    },
    {
      to: '/interventions',
      label: 'Action Plans & Interventions',
      icon: HeartHandshake,
      badge: stats.pendingInterventionsCount > 0 ? `${stats.pendingInterventionsCount}` : undefined,
      badgeColor: 'bg-blue-500 text-white',
      roleAccess: ['admin', 'faculty', 'placement'],
    },
    {
      to: '/data-integration',
      label: 'Data Integration (CSV)',
      icon: Database,
      roleAccess: ['admin'],
    },
    {
      to: '/reports',
      label: 'Reports & Exports',
      icon: FileBarChart2,
      roleAccess: ['admin', 'faculty', 'placement'],
    },
    {
      to: '/settings',
      label: 'Settings & Scoring',
      icon: Sliders,
      roleAccess: ['admin'],
    },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-800 bg-[#0a1128] text-slate-300 transition-all duration-300 ease-in-out z-20 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-4">
        {!collapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-teal-400 text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-white">CampusPulse</span>
                <span className="rounded bg-teal-500/20 px-1 py-0.2 text-[10px] font-bold text-teal-300">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Student Success SaaS</p>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-teal-400 text-white shadow-md">
            <GraduationCap className="h-5 w-5" />
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800/60 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isPermitted = item.roleAccess.includes(activeRole);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                } ${!isPermitted ? 'opacity-60' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105" />
              {!collapsed && (
                <div className="flex flex-1 items-center justify-between">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                  {!isPermitted && (
                    <span className="text-[10px] text-slate-400 italic font-normal">view only</span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info Area */}
      <div className="border-t border-slate-800/80 p-3">
        {!collapsed ? (
          <div className="rounded-xl bg-slate-800/40 p-3 border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Total Enrolled</span>
              <span className="font-bold text-white">{stats.totalStudents}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-slate-400">Avg Success</span>
              <span className="font-bold text-teal-400">{stats.avgSuccessScore} / 100</span>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between">
              <button
                onClick={() => {
                  if (window.confirm('Reset all demo student records, custom weights, and interventions to pristine 125-student seed dataset?')) {
                    resetAllDemoData();
                  }
                }}
                className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-amber-300 transition-colors"
                title="Reset local changes and restore original 125 students"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Demo Data
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => {
                if (window.confirm('Reset all demo data back to pristine seed dataset?')) {
                  resetAllDemoData();
                }
              }}
              className="p-2 text-slate-400 hover:text-amber-300"
              title="Reset Demo Data"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
