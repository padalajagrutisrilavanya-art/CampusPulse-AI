/**
 * CampusPulse AI — Smart Student Success & Campus Analytics Platform
 * Main App Entry with Router & Layout
 */

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/common/Sidebar';
import { Navbar } from './components/common/Navbar';
import { NotificationsDrawer } from './components/common/NotificationsDrawer';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { StudentDirectoryPage } from './pages/StudentDirectoryPage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { AtRiskPage } from './pages/AtRiskPage';
import { PlacementPage } from './pages/PlacementPage';
import { SegmentationPage } from './pages/SegmentationPage';
import { DataIntegrationPage } from './pages/DataIntegrationPage';
import { InterventionsPage } from './pages/InterventionsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { DemoLoginPage } from './pages/DemoLoginPage';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const location = useLocation();

  // If on /login, render without dashboard shell
  if (location.pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900 antialiased">
      {/* Deep Navy Collapsible Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <Navbar onOpenNotifications={() => setIsNotificationsOpen(true)} />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {/* Slide-over Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/students" element={<StudentDirectoryPage />} />
            <Route path="/students/:id" element={<StudentProfilePage />} />
            <Route path="/at-risk" element={<AtRiskPage />} />
            <Route path="/placement" element={<PlacementPage />} />
            <Route path="/segmentation" element={<SegmentationPage />} />
            <Route path="/data-integration" element={<DataIntegrationPage />} />
            <Route path="/interventions" element={<InterventionsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/login" element={<DemoLoginPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AppProvider>
  );
}
