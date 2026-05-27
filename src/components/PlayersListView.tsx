import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  CalendarCheck, 
  UserPlus, 
  Phone, 
  Calendar, 
  Briefcase, 
  UserRound,
  Trash
} from 'lucide-react';
import { Player, UserRole } from '../types';

interface PlayersListViewProps {
  authToken: string;
  userRole: UserRole;
  onNavigateToRegister: () => void;
  onNavigateToEdit: (playerId: number) => void;
  onNavigateToMarkAttendance: (playerId?: number) => void;
  showNotification: (msg: string, type: 'success' | 'error') => void;
}

export default function PlayersListView({
  authToken,
  userRole,
  onNavigateToRegister,
  onNavigateToEdit,
  onNavigateToMarkAttendance,
  showNotification
}: PlayersListViewProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('All Teams');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/players', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (!res.ok) {
        throw new Error(' Roster synchronize failed');
      }
      const data = await res.json();
      setPlayers(data);
    } catch (err: any) {
      showNotification(err.message || 'Could not load player directory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, [authToken]);

  const handleDeletePlayer = async (id: number) => {
    try {
      const res = await fetch(`/api/players/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Player record deletion failed');
      }

      showNotification('Player and linked attendance histories dropped successfully.', 'success');
      setDeleteConfirmId(null);
      
      // Filter out deleted player immediately or reload roster
      setPlayers(players.filter(p => p.id !== id));
    } catch (err: any) {
      showNotification(err.message || 'Error occurred while dropping player.', 'error');
    }
  };

  // Get list of distinct teams for filtering dropdown
  const distinctTeams = ['All Teams', ...Array.from(new Set(players.map(p => p.teamName).filter(Boolean)))];

  // Perform client side search and filter
  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          player.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          player.phoneNumber.includes(searchQuery);
                          
    const matchesTeam = teamFilter === 'All Teams' || player.teamName === teamFilter;
    
    return matchesSearch && matchesTeam;
  });

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-sky-600 animate-spin"></div>
        <p className="mt-3 text-sm font-semibold text-slate-500">Retrieving operational player directory...</p>
      </div>
    );
  }

  return (
    <div id="players-list-container" className="space-y-6 animate-fadeIn">
      
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Players Roster</h1>
          <p className="text-sm text-slate-500 mt-0.5">Directory list of all registered squad athletes and team assignments.</p>
        </div>
        <button
          id="btn-register-player-top"
          onClick={onNavigateToRegister}
          className="self-start sm:self-center flex items-center space-x-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-750 text-white text-sm font-semibold rounded-xl transition shadow-md shadow-sky-600/10 cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>Register Athlete</span>
        </button>
      </div>

      {/* filter bar controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            id="players-search-input"
            type="text"
            className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition"
            placeholder="Search roster by Athlete name, team, or contact number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter */}
        <div className="md:w-64 relative flex items-center">
          <span className="absolute left-3.5 text-slate-400 pointer-events-none">
            <Filter className="h-4 w-4" />
          </span>
          <select
            id="team-filter-select"
            className="w-full pl-9 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition cursor-pointer appearance-none"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
          >
            {distinctTeams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Roster Output list */}
      {filteredPlayers.length === 0 ? (
        <div className="bg-white py-16 text-center border border-slate-100 rounded-2xl shadow-sm">
          <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <UserRound className="h-6 w-6" />
          </div>
          <p className="text-base font-semibold text-slate-700">No athletes match criteria</p>
          <p className="text-xs text-slate-400 mt-1">Refine your search term or add a new athlete to the training database.</p>
        </div>
      ) : (
        <div id="players-cards-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlayers.map((player) => (
            <div 
              key={player.id} 
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition duration-200 group flex flex-col justify-between"
            >
              {/* Card top */}
              <div>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-sky-700 transition leading-snug">{player.fullName}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      ID: #{player.id}
                    </span>
                  </div>
                  
                  {/* Badge displaying team name */}
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                    {player.teamName || 'Independent'}
                  </span>
                </div>

                {/* Info List */}
                <div className="mt-5 space-y-2.5 text-sm text-slate-600">
                  <div className="flex items-center space-x-2.5">
                    <UserRound className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>Age: <strong className="text-slate-700">{player.age} Years</strong></span>
                  </div>
                  
                  <div className="flex items-center space-x-2.5">
                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="font-mono text-xs">{player.phoneNumber || 'Unregistered Phone'}</span>
                  </div>

                  <div className="flex items-center space-x-2.5">
                    <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="text-xs">Joined: <strong className="text-slate-700">{player.registrationDate}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between gap-2">
                
                {/* Log attendance quick link */}
                <button
                  id={`btn-attendance-p-${player.id}`}
                  onClick={() => onNavigateToMarkAttendance(player.id)}
                  className="flex items-center space-x-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100/70 px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  <CalendarCheck className="h-3.5 w-3.5" />
                  <span>Check Attendance</span>
                </button>

                <div className="flex items-center space-x-1">
                  
                  {/* Edit Player info trigger */}
                  <button
                    id={`btn-edit-p-${player.id}`}
                    onClick={() => onNavigateToEdit(player.id)}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                    title="Edit Player Info"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>

                  {/* Drop Player trigger */}
                  {deleteConfirmId === player.id ? (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleDeletePlayer(player.id)}
                        className="px-2.5 py-1.5 bg-red-600 text-white text-[11px] font-bold rounded-lg hover:bg-red-700 transition cursor-pointer"
                      >
                        Confirm Roll
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-1.5 bg-slate-100 text-slate-650 text-[11px] font-medium rounded-lg hover:bg-slate-200 transition cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      id={`btn-delete-p-${player.id}`}
                      onClick={() => setDeleteConfirmId(player.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer font-semibold"
                      title="De-register Player"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  )}

                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
