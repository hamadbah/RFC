import React, { useState } from 'react';
import { Shield, Key, Eye, EyeOff, User, Activity } from 'lucide-react';
import { AuthResponse } from '../types';

interface LoginViewProps {
  onLoginSuccess: (authData: AuthResponse) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please provide both administrative credentials.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Identity authentication failed');
      }

      // Store in localStorage for reload persistence
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));

      onLoginSuccess(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong during login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (role: 'Admin' | 'Employee') => {
    if (role === 'Admin') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('employee');
      setPassword('employee123');
    }
    setErrorMessage(null);
  };

  return (
    <div id="login-container" className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-100 shadow-xl transition-all duration-300 hover:shadow-2xl">
        
        {/* Visual Brand */}
        <div className="text-center">
          <div className="mx-auto h-14 w-14 flex items-center justify-center rounded-2xl bg-sky-100 text-sky-600 shadow-inner">
            <Activity className="h-8 w-8 animate-pulse" />
          </div>
          <h2 className="mt-5 text-3xl font-extrabold text-slate-900 tracking-tight">
            Arena Logins
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Player Attendance & Strategic Rosters
          </p>
        </div>

        {errorMessage && (
          <div id="login-error" className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-sm text-red-700">
            <p className="font-medium">Verification Denied</p>
            <p className="opacity-90">{errorMessage}</p>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Username ID
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <User className="h-5 w-5" />
              </span>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                placeholder="Type 'admin' or 'employee'..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Access Signature
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Key className="h-5 w-5" />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-xl text-white font-semibold bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:opacity-50 transition cursor-pointer flex items-center justify-center shadow-lg shadow-sky-500/10"
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Authorizing Security...</span>
              </span>
            ) : (
              <span>Confirm Credentials</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
