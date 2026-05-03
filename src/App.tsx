/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode, useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import IOSLayout from './layouts/IOSLayout';
import { BankProvider, useBank } from './shared/BankContext';
import { SocketProvider } from './shared/SocketContext';
import { AdminPanel } from './components/AdminPanel';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { InstallScreen } from './components/InstallScreen';
import { Toaster } from 'sonner';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-white flex flex-col items-center justify-center p-8 text-center text-gray-900">
          <h1 className="text-xl font-bold mb-2 text-gray-900">Something went wrong</h1>
          <p className="text-gray-500 text-sm mb-8">{this.state.error?.toString()}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-[#ED0711] text-white font-bold rounded-xl"
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { isAdminPanelVisible, theme, user, globalSettings, logout } = useBank();
  const [showInstaller, setShowInstaller] = useState(() => {
    // Check if running as standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    const hasSeenInstaller = sessionStorage.getItem('hasSeenInstaller');
    return !isStandalone && !hasSeenInstaller;
  });

  // Auto-logout after inactivity (5 minutes)
  useEffect(() => {
    if (!user) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
      }, 5 * 60 * 1000); // 5 minutes
    };

    // Initialize timer
    resetTimer();

    // Listen to events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer, true));

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer, true));
    };
  }, [user, logout]);
  
  const isMaintenance = globalSettings?.general?.maintenanceMode || user?.settings?.maintenanceMode;
  const isAdmin = user?.username?.toUpperCase() === 'PROJECTSARAH';

  if (showInstaller) {
    return <InstallScreen onComplete={() => {
      sessionStorage.setItem('hasSeenInstaller', 'true');
      setShowInstaller(false);
    }} />;
  }

  // Show maintenance ONLY IF a non-admin user is logged in
  if (isMaintenance && user && !isAdmin) {
    return (
      <div className="h-screen w-screen bg-white flex flex-col items-center justify-center p-8 text-center text-gray-900">
        <div className="w-16 h-16 bg-[#ED0711]/10 rounded-2xl flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-[#ED0711]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-4 text-[#ED0711]">System Maintenance</h1>
        <p className="text-gray-600 mb-8 max-w-xs">We are currently performing scheduled maintenance. Please contact support if you need immediate assistance or try logging in again later.</p>
        
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button 
            onClick={() => {
              logout();
              setTimeout(() => window.location.reload(), 100);
            }}
            className="w-full py-4 bg-[#ED0711] text-white font-bold rounded-2xl shadow-lg shadow-[#ED0711]/20 active:scale-[0.98] transition-all"
          >
            Log Out & Re-login
          </button>
          <a 
            href="mailto:support@scotiabank.com"
            className="w-full py-4 bg-gray-100 text-gray-900 font-bold rounded-2xl active:scale-[0.98] transition-all"
          >
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full w-full ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="flex-1 w-full h-full relative overflow-hidden">
        <IOSLayout />
      </div>
      {isAdminPanelVisible && <AdminPanel />}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <div className="fixed inset-0 bg-white overflow-hidden">
        <BankProvider>
          <SocketProvider onCommand={() => {}}>
            <AppContent />
            <PWAInstallPrompt />
            <Toaster position="top-center" />
          </SocketProvider>
        </BankProvider>
      </div>
    </ErrorBoundary>
  );
}




