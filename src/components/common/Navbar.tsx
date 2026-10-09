import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  SlidersHorizontal,
  ShieldCheck,
  UserCheck,
  Briefcase,
  AlertTriangle,
  X,
  ExternalLink,
  ChevronDown,
  Info,
  Cloud,
  CloudOff,
  Database,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole, Department } from '../../types';
import { MigrationModal } from './MigrationModal';

interface NavbarProps {
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNotifications }) => {
  const navigate = useNavigate();
  const {
    students,
    filters,
    setFilter,
    setMultipleFilters,
    resetFilters,
    activeRole,
    setActiveRole,
    stats,
    cloudStatus,
    refreshCloudStatus,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showDemoInfoModal, setShowDemoInfoModal] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  // Search results
  const searchResults = searchQuery.trim()
    ? students
        .filter(
          (s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.department.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 6)
    : [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setShowRoleMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectStudent = (id: string) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    navigate(`/students/${id}`);
  };

  const roleLabels: Record<UserRole, { title: string; desc: string; icon: any; color: string }> = {
    admin: {
      title: 'Administrator',
      desc: 'Full system control, weights & data import',
      icon: ShieldCheck,
      color: 'text-purple-600 bg-purple-50',
    },
    faculty: {
      title: 'Faculty / Mentor',
      desc: 'Academic early warning & student support',
      icon: UserCheck,
      color: 'text-blue-600 bg-blue-50',
    },
    placement: {
      title: 'Placement Officer',
      desc: 'Recruiter readiness & technical skills',
      icon: Briefcase,
      color: 'text-teal-600 bg-teal-50',
    },
  };

  const activeRoleData = roleLabels[activeRole];
  const ActiveRoleIcon = activeRoleData.icon;

  const totalAlertCount = stats.highAcademicRiskCount + stats.pendingInterventionsCount;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 shadow-xs">
      {/* Left Area: Global Search */}
      <div className="flex items-center gap-4 flex-1 max-w-md" ref={searchRef}>
        <div className="relative w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            placeholder="Search student by name, ID (e.g. CP-2023-CSE-001)..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Quick Search Dropdown */}
          {showSearchDropdown && searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full mt-1 max-h-80 overflow-y-auto rounded-lg border border-slate-200 bg-white py-2 shadow-xl z-50">
              <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Matching Students ({searchResults.length})
              </div>
              {searchResults.length === 0 ? (
                <div className="px-4 py-3 text-center text-sm text-slate-500">
                  No students found matching "{searchQuery}"
                </div>
              ) : (
                searchResults.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => handleSelectStudent(st.id)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{st.name}</div>
                      <div className="text-xs text-slate-500">
                        {st.id} • {st.department} • Year {st.year} (Sem {st.semester})
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-slate-700">CGPA: {st.cgpa?.toFixed(2) ?? 'N/A'}</div>
                      <span
                        className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                          st.academicRisk === 'High'
                            ? 'bg-red-100 text-red-700'
                            : st.academicRisk === 'Medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {st.academicRisk} Risk
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Middle/Right: Global Filter Selectors */}
      <div className="hidden lg:flex items-center gap-3 mx-4">
        {/* Dept Selector */}
        <select
          value={filters.department}
          onChange={(e) => setFilter('department', e.target.value)}
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="ALL">All Departments</option>
          <option value="CSE">CSE (Computer Science)</option>
          <option value="ECE">ECE (Electronics & Comm)</option>
          <option value="EEE">EEE (Electrical & Electronics)</option>
          <option value="IT">IT (Information Tech)</option>
          <option value="MECH">MECH (Mechanical Eng)</option>
        </select>

        {/* Year Selector */}
        <select
          value={filters.year}
          onChange={(e) => setFilter('year', e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="ALL">All Years</option>
          <option value="1">Year 1</option>
          <option value="2">Year 2</option>
          <option value="3">Year 3</option>
          <option value="4">Year 4</option>
        </select>

        {/* Semester Selector */}
        <select
          value={filters.semester}
          onChange={(e) => setFilter('semester', e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="ALL">All Semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
            <option key={s} value={s}>
              Semester {s}
            </option>
          ))}
        </select>

        {(filters.department !== 'ALL' || filters.year !== 'ALL' || filters.semester !== 'ALL' || filters.academicRisk !== 'ALL') && (
          <button
            onClick={resetFilters}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium underline px-1"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Right Area: Cloud Sync Indicator, Demo Role Selector, Demo Indicator, Notifications */}
      <div className="flex items-center gap-3">
        {/* Cloud Sync & Storage Indicator */}
        <button
          onClick={() => setShowMigrationModal(true)}
          className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border text-xs font-semibold transition-colors ${
            cloudStatus.isConnected && cloudStatus.cloudStudentCount > 0
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
              : cloudStatus.isConnected
              ? 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
          title={
            cloudStatus.isConnected
              ? `Connected to Supabase (${cloudStatus.cloudStudentCount} in cloud, ${students.length} local). Click to manage sync.`
              : `Local storage active (${students.length} students). Click to connect or migrate to Supabase.`
          }
        >
          {cloudStatus.isConnected && cloudStatus.cloudStudentCount > 0 ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <Cloud className="h-3 w-3 text-emerald-600" />
              <span>Cloud Synced ({cloudStatus.cloudStudentCount})</span>
            </>
          ) : cloudStatus.isConnected ? (
            <>
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              <Cloud className="h-3 w-3 text-blue-600" />
              <span>Sync to Cloud ({students.length})</span>
            </>
          ) : (
            <>
              <Database className="h-3 w-3 text-slate-500" />
              <span>Local Storage ({students.length})</span>
            </>
          )}
        </button>

        {/* DEMO MODE Pill & Info */}
        <button
          onClick={() => setShowDemoInfoModal(true)}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 border border-amber-200 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
          title="Click for Demo Mode & Security details"
        >
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
          DEMO MODE
          <Info className="h-3 w-3 text-amber-600" />
        </button>

        {/* SIMULATED DEMO ROLE SELECTOR */}
        <div className="relative" ref={roleRef}>
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <div className={`p-1 rounded ${activeRoleData.color}`}>
              <ActiveRoleIcon className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-900">{activeRoleData.title}</span>
                <span className="rounded bg-indigo-100 px-1 py-0.2 text-[9px] font-bold text-indigo-700 tracking-wider">
                  SIMULATED DEMO
                </span>
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">Simulated Role Switcher</div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Simulates perspective & permissions across campus teams.
                </p>
              </div>

              <div className="mt-1 space-y-1">
                {(Object.keys(roleLabels) as UserRole[]).map((r) => {
                  const item = roleLabels[r];
                  const Icon = item.icon;
                  const isSelected = activeRole === r;
                  return (
                    <button
                      key={r}
                      onClick={() => {
                        setActiveRole(r);
                        setShowRoleMenu(false);
                      }}
                      className={`flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                        isSelected ? 'bg-blue-50 text-blue-900 font-medium' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className={`mt-0.5 p-1.5 rounded ${item.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{item.title}</div>
                        <div className="text-[11px] text-slate-500">{item.desc}</div>
                      </div>
                      {isSelected && <span className="text-blue-600 font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 border-t border-slate-100 px-3 py-2 bg-slate-50 rounded-b-lg">
                <p className="text-[10px] text-slate-500 leading-tight">
                  ⚠️ Note: Role selection is for simulation and demonstration only; it does not replace backend production authentication.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Icon */}
        <button
          onClick={onOpenNotifications}
          className="relative rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus:outline-none"
          title="Notifications & Alerts"
        >
          <Bell className="h-4 w-4" />
          {totalAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
              {totalAlertCount > 9 ? '9+' : totalAlertCount}
            </span>
          )}
        </button>
      </div>

      {/* Demo Mode Info Modal */}
      {showDemoInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">CampusPulse AI — Demo Mode</h3>
                <p className="text-xs text-slate-500">Hackathon & Evaluation Architecture Notice</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>Client-side Persistence:</strong> All demo student records, custom scoring weight updates, CSV imports, and mentor action plans are actively calculated in your browser and persisted to <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">localStorage</code>.
              </p>
              <p>
                <strong>Explainable Risk Engine:</strong> Academic and Placement risk classifications are deterministic rule-based algorithms with transparent indicator explanations. No external AI API keys or third-party cloud services are invoked.
              </p>
              <p>
                <strong>Simulated Access Roles:</strong> Demo role switches simulate capabilities for Administrators (full access), Faculty/Mentors (academic support), and Placement Officers (corporate readiness).
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDemoInfoModal(false)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Understood & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Migration & Sync Modal */}
      <MigrationModal
        isOpen={showMigrationModal}
        onClose={() => setShowMigrationModal(false)}
        onMigrationComplete={() => refreshCloudStatus()}
      />
    </header>
  );
};
