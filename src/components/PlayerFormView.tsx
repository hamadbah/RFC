import React, { useState, useEffect } from 'react';
import { User, Phone, Trophy, Calendar, Info, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Player } from '../types';

interface PlayerFormViewProps {
  authToken: string;
  editingPlayerId: number | null; // Null representing Add Player, number representing Edit
  onNavigateBack: () => void;
  showNotification: (msg: string, type: 'success' | 'error') => void;
}

export default function PlayerFormView({
  authToken,
  editingPlayerId,
  onNavigateBack,
  showNotification
}: PlayerFormViewProps) {
  const isEditMode = editingPlayerId !== null;

  // Form states
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [teamName, setTeamName] = useState('');
  const [registrationDate, setRegistrationDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode && editingPlayerId) {
      const loadPlayerDetails = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/players/${editingPlayerId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          if (!res.ok) {
            throw new Error('Failed to retrieve player information');
          }
          const player: Player = await res.json();
          
          // Populate fields
          setFullName(player.fullName);
          setAge(player.age.toString());
          setPhoneNumber(player.phoneNumber);
          setTeamName(player.teamName);
          setRegistrationDate(player.registrationDate);
        } catch (err: any) {
          showNotification(err.message || 'Error occurred fetching player data.', 'error');
          onNavigateBack();
        } finally {
          setLoading(false);
        }
      };
      loadPlayerDetails();
    } else {
      // Set default registration date to today YYYY-MM-DD
      setRegistrationDate(new Date().toISOString().substring(0, 10));
    }
  }, [editingPlayerId, isEditMode, authToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!fullName.trim()) {
      showNotification('Full name of athlete is required.', 'error');
      return;
    }

    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum <= 0) {
      showNotification('Age must be a valid positive number.', 'error');
      return;
    }

    if (!phoneNumber.trim()) {
      showNotification('Contact phone number is required.', 'error');
      return;
    }

    if (!teamName.trim()) {
      showNotification('Team assignment name is required.', 'error');
      return;
    }

    setSubmitting(true);

    const payload = {
      fullName: fullName.trim(),
      age: ageNum,
      phoneNumber: phoneNumber.trim(),
      teamName: teamName.trim(),
      registrationDate: registrationDate || new Date().toISOString().substring(0, 10)
    };

    try {
      const url = isEditMode ? `/api/players/${editingPlayerId}` : '/api/players';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Athlete registry operations failed');
      }

      showNotification(
        isEditMode ? 'Athlete profile updated successfully.' : 'New Athlete registered in squad directory.',
        'success'
      );
      
      onNavigateBack();
    } catch (err: any) {
      showNotification(err.message || 'Error occurred saving player records.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-sky-600 animate-spin" />
        <p className="mt-3 text-sm font-semibold text-slate-500">Querying player master file...</p>
      </div>
    );
  }

  return (
    <div id="player-form-container" className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-12">
      
      {/* Back button link */}
      <div>
        <button
          id="btn-form-back"
          onClick={onNavigateBack}
          className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Players Directory</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
        {/* Title Brand Banner */}
        <div className="bg-slate-900 px-6 py-8 text-white">
          <h1 className="text-xl font-extrabold sm:text-2xl">
            {isEditMode ? 'Modify Athlete Profile' : 'Register New Squad Athlete'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isEditMode 
              ? 'Update current records and database assignments for this registered player.' 
              : 'Add contact details and profile parameters for physical training, lineups, and check-ins.'}
          </p>
        </div>

        {/* Form elements */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            {/* Full Name */}
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Full Athlete Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User className="h-4.5 w-4.5" />
                </span>
                <input
                  id="form-full-name"
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-440 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition text-sm"
                  placeholder="e.g. Lionel Messi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Age (Years)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Info className="h-4.5 w-4.5" />
                </span>
                <input
                  id="form-age"
                  type="number"
                  required
                  min="3"
                  max="120"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-440 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition text-sm"
                  placeholder="e.g. 24"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Roster Contact Phone
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Phone className="h-4.5 w-4.5" />
                </span>
                <input
                  id="form-phone"
                  type="tel"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-440 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition text-sm"
                  placeholder="e.g. 555-010-0910"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>

            {/* Team Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Squad Team Assignment
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 pointer-events-none z-10">
                  <Trophy className="h-4.5 w-4.5" />
                </span>
                <select
                  id="form-team-name"
                  required
                  className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition text-sm cursor-pointer appearance-none"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                >
                  <option value="">Select Team</option>
                  <option value="RFC">RFC</option>
                  {teamName && teamName !== 'RFC' && (
                    <option value={teamName}>{teamName}</option>
                  )}
                </select>
                <span className="absolute right-3.5 text-[9px] text-slate-400 pointer-events-none">
                  ▼
                </span>
              </div>
            </div>

            {/* Registration Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Scheduled Registration Date
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Calendar className="h-4.5 w-4.5" />
                </span>
                <input
                  id="form-reg-date"
                  type="date"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition text-sm"
                  value={registrationDate}
                  onChange={(e) => setRegistrationDate(e.target.value)}
                />
              </div>
            </div>

          </div>

          {/* Form actions */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              id="form-cancel"
              onClick={onNavigateBack}
              className="px-5 py-2.5 bg-slate-100 font-semibold text-slate-650 rounded-xl hover:bg-slate-200 hover:text-slate-800 transition text-sm cursor-pointer"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              id="form-submit-btn"
              disabled={submitting}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition shadow-md shadow-sky-600/10 disabled:opacity-50 text-sm cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Committing Profile...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{isEditMode ? 'Commit Profiles' : 'Register Athlete'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
