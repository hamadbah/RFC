/**
 * Shared Type Definitions for the Player Attendance Manager
 */

export type UserRole = 'Admin' | 'Employee';

export interface User {
  id: number;
  username: string;
  role: UserRole;
  password?: string; // Stored securely as bcrypt hash in DB, optional on front-end
}

export interface Player {
  id: number;
  fullName: string;
  age: number;
  phoneNumber: string;
  teamName: string;
  registrationDate: string; // YYYY-MM-DD
}

export interface Attendance {
  id: number;
  playerId: number;
  status: 'Present' | 'Absent';
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
}

// Admin Dashboard stats type
export interface DashboardStats {
  totalPlayers: number;
  presentToday: number;
  absentToday: number;
  attendancePercentage: number;
  recentActivities: {
    id: number;
    playerId: number;
    playerName: string;
    teamName: string;
    status: 'Present' | 'Absent';
    date: string;
    time: string;
  }[];
  charts: {
    daily: {
      date: string;
      present: number;
      absent: number;
    }[];
    vteam: {
      teamName: string;
      present: number;
      absent: number;
    }[];
  };
}

// Authentication Response
export interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    role: UserRole;
  };
}
