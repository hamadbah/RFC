import React, { useState } from 'react';
import { 
  Users, 
  CalendarCheck, 
  LayoutDashboard, 
  UserPlus, 
  LogOut, 
  Activity, 
  Menu, 
  X,
  User as UserIcon,
  ShieldAlert
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  userRole: UserRole;
  userName: string;
  onLogout: () => void;
}

export default function Sidebar({ 
  currentView, 
  onNavigate, 
  userRole, 
  userName, 
  onLogout 
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navigationItems = [
    { 
      id: 'dashboard', 
      label: 'Admin Dashboard', 
      icon: LayoutDashboard, 
      roles: ['Admin'] 
    },
    { 
      id: 'players', 
      label: 'Players Roster', 
      icon: Users, 
      roles: ['Admin', 'Employee'] 
    },
    { 
      id: 'attendance', 
      label: 'Mark Attendance', 
      icon: CalendarCheck, 
      roles: ['Admin', 'Employee'] 
    },
    { 
      id: 'player-form', 
      label: 'Register Player', 
      icon: UserPlus, 
      roles: ['Admin', 'Employee'] 
    },
  ];

  const filteredItems = navigationItems.filter(item => item.roles.includes(userRole));

  const handleMobileNav = (viewId: string) => {
    onNavigate(viewId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Top Banner on Mobile Viewports */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 text-white px-5 py-4 border-b border-slate-800 shadow-md">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none transition cursor-pointer"
          aria-label="Toggle navigation drawer"
          id="mobile-drawer-toggle"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-sky-500" />
          <span className="font-extrabold tracking-tight text-white">ArenaManager</span>
        </div>

        <button
          onClick={onLogout}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 focus:outline-none transition cursor-pointer"
          aria-label="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Drawer Back Shield Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer Panel: Positioned styled static on desktop but sliding on mobile */}
      <aside 
        id="app-sidebar"
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shadow-2xl transition-transform duration-300 transform md:transform-none 
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand visual header on desktop */}
        <div className="hidden md:flex items-center space-x-3 px-6 py-7 border-b border-slate-800/60">
          <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 shadow-inner">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-white tracking-tight text-base leading-none">ArenaManager</span>
            <span className="text-[10px] text-zinc-500 tracking-wider uppercase mt-1">Live Attendance</span>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {filteredItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleMobileNav(item.id)}
                className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl text-left text-sm font-medium transition duration-200 cursor-pointer group
                  ${isActive 
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/10' 
                    : 'hover:bg-slate-850 hover:text-white text-slate-400'}`}
              >
                <IconComponent className={`h-5 w-5 shrink-0 transition-colors 
                  ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} 
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Profile Card Bottom Guard */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 divide-y divide-slate-850">
          <div className="flex items-center space-x-3 pb-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300 border border-slate-700 select-none">
              <UserIcon className="h-5 w-5 text-slate-400" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{userName}</p>
              <div className="flex items-center space-x-1 mt-0.5">
                {userRole === 'Admin' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-400/10 text-sky-400 border border-sky-400/20 uppercase tracking-widest">
                    Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-750 text-slate-300 border border-slate-700 uppercase tracking-widest">
                    Employee
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-3">
            <button
              id="sidebar-logout-btn"
              onClick={onLogout}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition cursor-pointer group"
            >
              <span className="group-hover:translate-x-0.5 transition-transform">Terminate Session</span>
              <LogOut className="h-4 w-4 shrink-0 opacity-70 group-hover:opacity-100" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
