import React, { useEffect, useState } from 'react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Percent, 
  Activity, 
  RefreshCw,
  TrendingUp,
  Award
} from 'lucide-react';
import { DashboardStats } from '../types';

interface DashboardViewProps {
  authToken: string;
  onNavigateToPlayers: () => void;
  onNavigateToAttendance: () => void;
  showNotification: (msg: string, type: 'success' | 'error') => void;
}

export default function DashboardView({ 
  authToken, 
  onNavigateToPlayers, 
  onNavigateToAttendance,
  showNotification
}: DashboardViewProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().substring(0, 10));

  const fetchStats = async (isRef = false, queryDate?: string) => {
    if (isRef) setRefreshing(true);
    else setLoading(true);

    const targetDate = queryDate !== undefined ? queryDate : selectedDate;

    try {
      const url = targetDate ? `/api/admin/stats?date=${targetDate}` : '/api/admin/stats';
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        }
      });
      if (!res.ok) {
        throw new Error('Could not download admin insights data');
      }
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      showNotification(err.message || 'Error occurred fetching dashboard statistics.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    fetchStats(false, newDate);
  };

  const handleResetToToday = () => {
    const today = new Date().toISOString().substring(0, 10);
    setSelectedDate(today);
    fetchStats(false, today);
  };

  useEffect(() => {
    fetchStats();
  }, [authToken]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-sky-600 animate-spin"></div>
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-500">Retrieving tactical dashboard metrics...</p>
      </div>
    );
  }

  // Fallback if data issues
  const data = stats || {
    totalPlayers: 0,
    presentToday: 0,
    absentToday: 0,
    attendancePercentage: 0,
    recentActivities: [],
    charts: { daily: [], team: [] }
  };

  const markedToday = data.presentToday + data.absentToday;
  const unmarkedToday = Math.max(0, data.totalPlayers - markedToday);

  // Compute maximum val for historical chart scaling
  const maxDocCount = data.charts.daily.reduce((max, d) => {
    const total = d.present + d.absent;
    return total > max ? total : max;
  }, 4); // Default minimum scale of 4 for small list safety

  return (
    <div id="dashboard-view" className="space-y-8 animate-fadeIn">
      
      {/* Header and Control */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Strategic Board</h1>
          <p className="text-sm text-slate-500 mt-1">Analytics, daily attendance metrics, and player performance.</p>
        </div>
        
        {/* Date Filter Controls */}
        <div id="dashboard-date-controls" className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Target Date:</span>
            <input
              id="dashboard-date-picker"
              type="date"
              className="text-xs font-bold text-slate-700 bg-transparent border-0 focus:outline-none focus:ring-0 cursor-pointer p-0"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
            />
          </div>

          <button
            id="reset-today-btn"
            onClick={handleResetToToday}
            className="flex items-center space-x-1 px-3 py-1.5 bg-sky-50 border border-sky-100 rounded-xl text-xs font-bold text-sky-700 hover:bg-sky-100 transition shadow-xs cursor-pointer"
          >
            Show Today
          </button>

          <button
            id="refresh-stats-btn"
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-6 shadow-sm disabled:opacity-50 cursor-pointer text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-sky-600' : ''}`} />
            <span>{refreshing ? 'Synchronizing...' : 'Sync Live'}</span>
          </button>
        </div>
      </div>

      {/* Grid: 4 Metric Cards */}
      <div id="tactical-metrics-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Total Players */}
        <div 
          id="metric-total-players"
          onClick={onNavigateToPlayers}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer relative overflow-hidden group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Total Squad</span>
              <p className="text-3xl font-extrabold text-slate-800">{data.totalPlayers}</p>
            </div>
            <div className="p-3 bg-slate-50 text-slate-600 rounded-xl group-hover:bg-sky-50 group-hover:text-sky-600 transition">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-500">
            <span className="text-sky-600 font-bold mr-1">Roster List</span>
            <span>registered players</span>
          </div>
        </div>

        {/* Card 2: Present Today */}
        <div 
          id="metric-present-today"
          onClick={onNavigateToAttendance}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer relative overflow-hidden group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                {selectedDate === new Date().toISOString().substring(0, 10) ? 'Present Today' : 'Present / Date'}
              </span>
              <p className="text-3xl font-extrabold text-sky-600">{data.presentToday}</p>
            </div>
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl transition">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-500">
            <span className="font-semibold text-slate-700 mr-1.5">{markedToday} Checked</span>
            <span>on {selectedDate}</span>
          </div>
        </div>

        {/* Card 3: Absent Today */}
        <div 
          id="metric-absent-today"
          onClick={onNavigateToAttendance}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer relative overflow-hidden group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                {selectedDate === new Date().toISOString().substring(0, 10) ? 'Absent Today' : 'Absent / Date'}
              </span>
              <p className="text-3xl font-extrabold text-red-500">{data.absentToday}</p>
            </div>
            <div className="p-3 bg-red-50 text-red-500 rounded-xl transition">
              <XCircle className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-500">
            {unmarkedToday > 0 ? (
              <span className="text-amber-600 font-semibold">{unmarkedToday} players awaiting check-in</span>
            ) : (
              <span className="text-slate-400 font-semibold">All squad players logged for this date</span>
            )}
          </div>
        </div>

        {/* Card 4: Attendance Percentage */}
        <div 
          id="metric-attendance-pct"
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Attendance Pct</span>
              <p className="text-3xl font-extrabold text-slate-800">{data.attendancePercentage}%</p>
            </div>
            <div className="p-3 bg-slate-50 text-slate-700 rounded-xl">
              <Percent className="h-6 w-6 text-indigo-500" />
            </div>
          </div>
          <div className="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${data.attendancePercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div id="analytics-charts-grid" className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart A: Daily Session Trends (Interactive SVG) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-sky-600" />
              <h2 className="text-lg font-bold text-slate-800">Daily Attendance Trends</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Player turnout comparison across active training days.</p>
          </div>

          {data.charts.daily.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-450 border border-dashed border-slate-150 rounded-xl my-4">
              <span className="text-xs">No training dates recorded yet.</span>
            </div>
          ) : (
            <div className="my-6">
              {/* Custom High-Fidelity SVG Bar Chart */}
              <div className="relative">
                <div className="flex h-56 items-end justify-between px-2 pt-4 pb-2 border-b border-slate-100">
                  {data.charts.daily.map((day, dIdx) => {
                    const totalForDay = day.present + day.absent;
                    // Proportional Heights based on maxDocCount
                    const presentPct = Math.round((day.present / maxDocCount) * 100);
                    const absentPct = Math.round((day.absent / maxDocCount) * 100);

                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center mx-2 group relative">
                        {/* Hover Tooltip tooltip */}
                        <div className="absolute bottom-full mb-2 bg-slate-850 text-white text-[10px] font-mono p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-20 whitespace-nowrap min-w-[120px] text-center">
                          <p className="font-bold border-b border-slate-700 pb-0.5 mb-1 text-slate-300">{day.date}</p>
                          <p className="text-green-400">Present: {day.present}</p>
                          <p className="text-red-400">Absent: {day.absent}</p>
                        </div>

                        {/* Visual Bar pairing */}
                        <div className="w-full flex items-end justify-center space-x-1.5 h-44">
                          {/* Present Column */}
                          <div 
                            className="w-3 rounded-t-sm bg-sky-500 hover:bg-sky-600 transition-all duration-300 relative group/bar"
                            style={{ height: `${Math.max(4, presentPct)}%` }}
                          >
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[9px] font-mono font-bold text-sky-700 hidden group-hover/bar:block">{day.present}</span>
                          </div>
                          {/* Absent Column */}
                          <div 
                            className="w-3 rounded-t-sm bg-red-400 hover:bg-red-500 transition-all duration-300 relative group/bar"
                            style={{ height: `${Math.max(4, absentPct)}%` }}
                          >
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[9px] font-mono font-bold text-red-700 hidden group-hover/bar:block">{day.absent}</span>
                          </div>
                        </div>

                        {/* Bottom Label (formatted month day) */}
                        <span className="text-[10px] font-semibold text-slate-500 mt-2 rotate-12 origin-top-left sm:rotate-0">
                          {day.date.substring(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legends */}
              <div className="flex items-center justify-center space-x-6 mt-4 pt-1">
                <div className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-sky-500"></span>
                  <span className="text-xs font-medium text-slate-500">Players Present</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-red-400"></span>
                  <span className="text-xs font-medium text-slate-500">Players Absent</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chart B: Team Attendance Analysis */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-800">Team Attendance Analytics</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Breakdown of checked presence and absences grouped by individual sub-teams.</p>
          </div>

          {data.charts.team.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-450 border border-dashed border-slate-150 rounded-xl my-4">
              <span className="text-xs">Register teams and log player records to see team insights.</span>
            </div>
          ) : (
            <div className="my-6 space-y-4">
              {data.charts.team.map((team) => {
                const totalMarks = team.present + team.absent;
                const teamPct = totalMarks > 0 ? Math.round((team.present / totalMarks) * 100) : 0;

                return (
                  <div key={team.teamName} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">{team.teamName}</span>
                      <span className="font-mono font-bold text-slate-500">
                        {team.present} Present / {team.absent} Absent ({teamPct}%)
                      </span>
                    </div>

                    {/* Team segmented progress meter */}
                    <div className="w-full bg-slate-100 h-3.5 rounded-lg overflow-hidden flex">
                      {team.present > 0 && (
                        <div 
                          className="bg-sky-500 h-full hover:opacity-90 transition duration-150 relative group"
                          style={{ width: `${totalMarks > 0 ? (team.present / totalMarks) * 100 : 0}%` }}
                        >
                          <div className="absolute hidden group-hover:block bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1 py-0.5 rounded whitespace-nowrap">
                            {team.present} present
                          </div>
                        </div>
                      )}
                      {team.absent > 0 && (
                        <div 
                          className="bg-red-400 h-full hover:opacity-90 transition duration-150 relative group"
                          style={{ width: `${totalMarks > 0 ? (team.absent / totalMarks) * 100 : 0}%` }}
                        >
                          <div className="absolute hidden group-hover:block bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1 py-0.5 rounded whitespace-nowrap">
                            {team.absent} absent
                          </div>
                        </div>
                      )}
                      {totalMarks === 0 && (
                        <div className="w-full bg-slate-100 h-full flex items-center justify-center">
                          <span className="text-[10px] text-slate-400 italic">No attendance records logged</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activities Section */}
      <div id="recent-activities-table-card" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-850">Recent Activities Log</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">Chronological feed of player check-ins.</p>
        </div>

        {data.recentActivities.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No player training attendance events logged yet.
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Player</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Team</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Scheduled Date</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Logging Time</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm index-recent-activities">
                {data.recentActivities.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50/55 transition group">
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{act.playerName}</td>
                    <td className="py-3.5 px-4 text-slate-500">{act.teamName}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">{act.date}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">{act.time}</td>
                    <td className="py-3.5 px-4 text-right">
                      {act.status === 'Present' ? (
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold leading-none bg-sky-100 text-sky-800 border border-sky-200">
                          Present
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold leading-none bg-red-100 text-red-800 border border-red-200">
                          Absent
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
