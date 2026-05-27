import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Check, 
  X, 
  Search, 
  Filter, 
  History, 
  Calendar,
  Clock,
  Loader2,
  CalendarCheck2
} from 'lucide-react';
import { Player, UserRole } from '../types';

interface AttendanceViewProps {
  authToken: string;
  userRole: UserRole;
  preSelectedPlayerId: number | null; // Null, or ID of player focused from the roster roster
  showNotification: (msg: string, type: 'success' | 'error') => void;
  onClearPreSelected?: () => void;
}

interface HistoricalAttendanceLog {
  id: number;
  playerId: number;
  playerName: string;
  teamName: string;
  status: 'Present' | 'Absent';
  date: string;
  time: string;
}

export default function AttendanceView({
  authToken,
  userRole,
  preSelectedPlayerId,
  showNotification,
  onClearPreSelected
}: AttendanceViewProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [history, setHistory] = useState<HistoricalAttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<number | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('All Teams');

  // Today's date string matching backend (YYYY-MM-DD)
  const todayStr = new Date().toISOString().substring(0, 10);

  const fetchRosterAndHistory = async () => {
    setLoading(true);
    try {
      const authHeader = { 'Authorization': `Bearer ${authToken}` };
      
      // Fetch players and attendance history in parallel
      const [playersRes, historyRes] = await Promise.all([
        fetch('/api/players', { headers: authHeader }),
        fetch('/api/attendance/history', { headers: authHeader })
      ]);

      if (!playersRes.ok || !historyRes.ok) {
        throw new Error('Error synchronizing database rosters');
      }

      const playersList = await playersRes.json();
      const historyList = await historyRes.json();

      setPlayers(playersList);
      setHistory(historyList);

      // Scroll/set focus if preSelectedPlayerId is specified
      if (preSelectedPlayerId) {
        const found = playersList.find((p: Player) => p.id === preSelectedPlayerId);
        if (found) {
          setSearchQuery(found.fullName);
        }
      }
    } catch (err: any) {
      showNotification(err.message || 'Could not load attendance registries.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRosterAndHistory();
  }, [authToken, preSelectedPlayerId]);

  // Mark attendance method
  const handleMarkAttendance = async (playerId: number, status: 'Present' | 'Absent') => {
    setMarkingId(playerId);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ playerId, status })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Attendance logging failed');
      }

      showNotification(`Attendance saved: ${data.attendance.playerName} is marked ${status}.`, 'success');
      
      // Refresh history records immediately
      const historyRes = await fetch('/api/attendance/history', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (historyRes.ok) {
        const updatedHistory = await historyRes.json();
        setHistory(updatedHistory);
      }
    } catch (err: any) {
      showNotification(err.message || 'Could not record attendance.', 'error');
    } finally {
      setMarkingId(null);
    }
  };

  // Helper: map a player's ID to their status marked today (if any)
  const getTodayStatus = (playerId: number) => {
    const todayLog = history.find(h => h.playerId === playerId && h.date === todayStr);
    return todayLog ? todayLog.status : null;
  };

  // List of teams for filtering
  const distinctTeams = ['All Teams', ...Array.from(new Set(players.map(p => p.teamName).filter(Boolean)))];

  // Perform core filtering on players to display
  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          player.teamName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeam = teamFilter === 'All Teams' || player.teamName === teamFilter;
    return matchesSearch && matchesTeam;
  });

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-sky-600 animate-spin" />
        <p className="mt-3 text-sm font-semibold text-slate-500">Connecting attendance feeds...</p>
      </div>
    );
  }

  return (
    <div id="attendance-management-view" className="space-y-8 animate-fadeIn">
      
      {/* Header card with metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Attendance Center</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time check-in panel for registration, sessions, and logs.</p>
        </div>
        
        {/* Today status log info */}
        <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 border border-slate-200 rounded-xl shadow-xs self-start sm:self-center">
          <Calendar className="h-4 w-4 text-sky-600" />
          <span className="text-xs font-bold font-mono text-slate-600">{todayStr}</span>
        </div>
      </div>

      {preSelectedPlayerId && (
        <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl flex items-center justify-between text-xs text-sky-800">
          <span className="font-semibold">
            Roster search filter applied for requested Athlete ID #{preSelectedPlayerId}.
          </span>
          <button
            onClick={() => {
              setSearchQuery('');
              if (onClearPreSelected) onClearPreSelected();
            }}
            className="font-bold underline text-sky-700 hover:text-sky-900 cursor-pointer ml-3 bg-transparent border-0"
          >
            Clear Focus Filter
          </button>
        </div>
      )}

      {/* Main Grid: Left Column Roster attendance marks, Right Column Logs history list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Player lists with checklist toggles */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <CalendarCheck2 className="h-5 w-5 text-sky-600" />
              <h2 className="text-lg font-bold text-slate-800">Direct Roll Call</h2>
            </div>
            <span className="text-[10px] text-zinc-400 font-semibold tracking-wide uppercase">
              Click Status to Log Instantly
            </span>
          </div>

          {/* Roster list filter options */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="search-attendance-input"
                type="text"
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition"
                placeholder="Search players by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="sm:w-44 select-container">
              <select
                id="filter-attendance-team"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-750 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
              >
                {distinctTeams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Player Grid Rows */}
          {filteredPlayers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No matching athletes on roster filter.
            </div>
          ) : (
            <div id="attendance-roster-list" className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
              {filteredPlayers.map((player) => {
                const checkedToday = getTodayStatus(player.id);
                const isMarkingThis = markingId === player.id;

                return (
                  <div key={player.id} className="py-3.5 flex items-center justify-between gap-4 group">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate group-hover:text-sky-700 transition">
                        {player.fullName}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{player.teamName || 'Independent'}</p>
                    </div>

                    {/* Status marker / Button combinations */}
                    <div className="flex items-center space-x-2">
                      {isMarkingThis ? (
                        <div className="h-7 w-20 flex items-center justify-center">
                          <Loader2 className="h-4 w-4 text-sky-600 animate-spin" />
                        </div>
                      ) : (
                        <>
                          {/* Present Button */}
                          <button
                            id={`btn-present-pld-${player.id}`}
                            onClick={() => handleMarkAttendance(player.id, 'Present')}
                            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer
                              ${checkedToday === 'Present'
                                ? 'bg-sky-600 border-sky-600 text-white shadow-sm'
                                : 'bg-slate-50 border-slate-200 text-slate-550 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700'}`}
                          >
                            <Check className="h-3.5 w-3.5 shrink-0" />
                            <span>Present</span>
                          </button>

                          {/* Absent Button */}
                          <button
                            id={`btn-absent-pld-${player.id}`}
                            onClick={() => handleMarkAttendance(player.id, 'Absent')}
                            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer
                              ${checkedToday === 'Absent'
                                ? 'bg-red-500 border-red-500 text-white shadow-sm'
                                : 'bg-slate-50 border-slate-200 text-slate-550 hover:bg-red-50 hover:border-red-350 hover:text-red-600'}`}
                          >
                            <X className="h-3.5 w-3.5 shrink-0" />
                            <span>Absent</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Attendance History Lists Log */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
          <div className="border-b border-slate-100 pb-4 mb-4 flex items-center space-x-2">
            <History className="h-5 w-5 text-indigo-500 animate-pulse" />
            <h2 className="text-lg font-bold text-slate-800">Attendance History Logs</h2>
          </div>

          {history.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400 text-sm">
              <Calendar className="h-8 w-8 text-slate-200 mb-2" />
              <span>No history record sheets exist yet.</span>
            </div>
          ) : (
            <div id="attendance-history-scroll" className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {history.map((record) => (
                <div 
                  key={record.id} 
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex flex-col justify-between gap-2.5 hover:border-slate-200 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-850 text-sm leading-tight">{record.playerName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{record.teamName}</p>
                    </div>

                    {record.status === 'Present' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                        Present
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                        Absent
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200/50 pt-2">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span className="font-mono">{record.date}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span className="font-mono">{record.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
