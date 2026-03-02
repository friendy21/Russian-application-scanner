import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { StatusBar } from './components/Layout/StatusBar';
import { BottomNav } from './components/Layout/BottomNav';
import { ToastContainer } from './components/UI/Toast';
import { ScanPackPage } from './pages/ScanPackPage';
import { VerifyPage } from './pages/VerifyPage';
import { RecordsPage } from './pages/RecordsPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const { darkMode, currentTab } = useAppStore();

  // Apply dark mode class to root html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 dark:bg-slate-950">
      {/* Persistent top status bar */}
      <StatusBar />

      {/* Page content — scrollable, leaves room for bottom nav */}
      <main className="flex-1 overflow-y-auto pb-20">
        {currentTab === 'pack' && <ScanPackPage />}
        {currentTab === 'verify' && <VerifyPage />}
        {currentTab === 'records' && <RecordsPage />}
        {currentTab === 'settings' && <SettingsPage />}
      </main>

      {/* Bottom tab navigation */}
      <BottomNav />

      {/* Global toast notifications */}
      <ToastContainer />
    </div>
  );
}
