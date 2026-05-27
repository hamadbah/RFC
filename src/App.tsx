import React, { useState, useEffect } from 'react';
import { ShieldCheck, LogOut, BellRing, Info, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { User, UserRole, AuthResponse } from './types';

// Importing modular view components
import LoginView from './components/LoginView';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import PlayersListView from './components/PlayersListView';
import PlayerFormView from './components/PlayerFormView';
import AttendanceView from './components/AttendanceView';

export default function App() {
  // Authentication states
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; role: UserRole } | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  // Router navigation states
  // Available screens: 'dashboard' | 'players' | 'player-form' | 'attendance'
  const [currentView, setCurrentView] = useState<string>('players');
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [preSelectedPlayerId, setPreSelectedPlayerId] = useState<number | null>(null);

  // Notification Banner states
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Notifications display helper
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
  };

  // Close notification
  const handleDismissNotification = () => {
    setNotification(null);
  };

  // Auto-dismiss banner after 4 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Session recovery verification on load
  useEffect(() => {
    const recoverSession = async () => {
      const savedToken = localStorage.getItem('auth_token');
      const savedUserStr = localStorage.getItem('auth_user');

      if (savedToken && savedUserStr) {
        try {
          // Send me endpoint verification
          const res = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${savedToken}`
            }
          });

          if (res.ok) {
            const data = await res.json();
            setAuthToken(savedToken);
            setCurrentUser(data.user);
            
            // Set dynamic starting tab depending on access levels
            if (data.user.role === 'Admin') {
              setCurrentView('dashboard');
            } else {
              setCurrentView('players');
            }
          } else {
            // Token expired or invalid, clear context
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
        } catch (error) {
          console.error('Session token authorization failed:', error);
          // Network issue or offline mode, fall back to offline storage
          try {
            const decodedUser = JSON.parse(savedUserStr);
            setAuthToken(savedToken);
            setCurrentUser(decodedUser);
            setCurrentView(decodedUser.role === 'Admin' ? 'dashboard' : 'players');
          } catch {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
        }
      }
      setBootstrapping(false);
    };

    recoverSession();
  }, []);

  // Login Complete Callback
  const handleLoginSuccess = (authData: AuthResponse) => {
    setAuthToken(authData.token);
    setCurrentUser(authData.user);
    
    // Auto-navigate to dashboard for Admin, players roster for Employees
    if (authData.user.role === 'Admin') {
      setCurrentView('dashboard');
    } else {
      setCurrentView('players');
    }
    
    showNotification(`Welcome back, ${authData.user.username}! Session authorized successfully.`, 'success');
  };

  // Logout method
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setAuthToken(null);
    setCurrentUser(null);
    setCurrentView('players');
    showNotification('Session terminated. Relational token keys cleared.', 'success');
  };

  // Router triggers
  const handleNavigateToRegister = () => {
    setEditingPlayerId(null);
    setCurrentView('player-form');
  };

  const handleNavigateToEdit = (playerId: number) => {
    setEditingPlayerId(playerId);
    setCurrentView('player-form');
  };

  const handleNavigateToMarkAttendance = (playerId?: number) => {
    if (playerId) {
      setPreSelectedPlayerId(playerId);
    } else {
      setPreSelectedPlayerId(null);
    }
    setCurrentView('attendance');
  };

  // Safe navigation guard for state changes
  const handleSidebarNavigate = (viewId: string) => {
    // Prevent non-admins from going to dashboard tab
    if (viewId === 'dashboard' && currentUser?.role !== 'Admin') {
      setCurrentView('players');
      return;
    }
    
    // Clear sub-page parameters
    setEditingPlayerId(null);
    if (viewId !== 'attendance') {
      setPreSelectedPlayerId(null);
    }
    
    setCurrentView(viewId);
  };

  // Bootstrapping splash state
  if (bootstrapping) {
    return (
      <div id="loader-splash" className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="h-12 w-12 rounded-full border-4 border-slate-700 border-t-sky-500 animate-spin"></div>
        <h2 className="mt-6 text-xl font-bold tracking-tight text-white font-sans">Arena Roster Platform</h2>
        <p className="text-xs text-slate-500 mt-1 font-mono">Authenticating security contexts...</p>
      </div>
    );
  }

  // Login view guard
  if (!authToken || !currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div id="app-root-frame" className="min-h-screen flex flex-col md:flex-row bg-slate-50 relative">
      
      {/* Sidebar navigation layer */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleSidebarNavigate}
        userRole={currentUser.role}
        userName={currentUser.username}
        onLogout={handleLogout}
      />

      {/* Main Content Pane */}
      <main id="app-workspace-vessel" className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full overflow-x-hidden md:py-10">
        
        {/* Floating Notification Toast */}
        {notification && (
          <div 
            id="floating-notification-toast"
            className={`fixed top-4 right-4 z-50 max-w-sm w-full p-4 rounded-xl border shadow-xl flex items-start space-x-3 text-sm animate-slideDown leading-snug
              ${notification.type === 'success' 
                ? 'bg-sky-50 border-sky-200 text-sky-850' 
                : 'bg-red-50 border-red-200 text-red-900'}`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            )}
            
            <div className="flex-1 pr-4">
              <p className="font-bold">{notification.type === 'success' ? 'Authorized Event' : 'System Error'}</p>
              <p className="mt-0.5 opacity-90 text-xs">{notification.message}</p>
            </div>

            <button 
              onClick={handleDismissNotification}
              className={`p-1 rounded-lg hover:bg-black/5 transition cursor-pointer shrink-0
                ${notification.type === 'success' ? 'text-sky-700' : 'text-red-700'}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* View Switcher Engine */}
        <div className="min-h-[70vh]">
          {currentView === 'dashboard' && currentUser.role === 'Admin' && (
            <DashboardView
              authToken={authToken}
              onNavigateToPlayers={() => setCurrentView('players')}
              onNavigateToAttendance={() => handleNavigateToMarkAttendance()}
              showNotification={showNotification}
            />
          )}

          {currentView === 'players' && (
            <PlayersListView
              authToken={authToken}
              userRole={currentUser.role}
              onNavigateToRegister={handleNavigateToRegister}
              onNavigateToEdit={handleNavigateToEdit}
              onNavigateToMarkAttendance={(id) => handleNavigateToMarkAttendance(id)}
              showNotification={showNotification}
            />
          )}

          {currentView === 'player-form' && (
            <PlayerFormView
              authToken={authToken}
              editingPlayerId={editingPlayerId}
              onNavigateBack={() => setCurrentView('players')}
              showNotification={showNotification}
            />
          )}

          {currentView === 'attendance' && (
            <AttendanceView
              authToken={authToken}
              userRole={currentUser.role}
              preSelectedPlayerId={preSelectedPlayerId}
              onClearPreSelected={() => setPreSelectedPlayerId(null)}
              showNotification={showNotification}
            />
          )}
        </div>
      </main>
    </div>
  );
}
