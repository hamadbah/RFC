import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, Player, Attendance } from '../types';

const DB_FILE_PATH = path.join(process.cwd(), 'database.json');

interface Schema {
  users: User[];
  players: Player[];
  attendance: Attendance[];
}

class RelationalDatabase {
  private data: Schema = { users: [], players: [], attendance: [] };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        this.data = { users: [], players: [], attendance: [] };
        this.seed();
        this.save();
      }
    } catch (error) {
      console.error('Failed to initialize database, using empty schemas:', error);
      this.data = { users: [], players: [], attendance: [] };
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to write database file:', error);
    }
  }

  private seed() {
    console.log('Seeding relational database tables with mock data...');
    
    // Seed users with bcrypt passwords
    const salt = bcrypt.genSaltSync(10);
    const adminPasswordHash = bcrypt.hashSync('admin123', salt);
    const employeePasswordHash = bcrypt.hashSync('employee123', salt);

    this.data.users = [
      { id: 1, username: 'admin', role: 'Admin', password: adminPasswordHash },
      { id: 2, username: 'employee', role: 'Employee', password: employeePasswordHash }
    ];

    // Seed players
    this.data.players = [
      { id: 1, fullName: 'Lionel Messi', age: 38, phoneNumber: '555-010-0910', teamName: 'Inter Miami FC', registrationDate: '2026-01-15' },
      { id: 2, fullName: 'Cristiano Ronaldo', age: 41, phoneNumber: '555-007-7707', teamName: 'Al-Nassr FC', registrationDate: '2026-02-10' },
      { id: 3, fullName: 'Kevin De Bruyne', age: 34, phoneNumber: '555-017-1717', teamName: 'Manchester City', registrationDate: '2026-03-01' },
      { id: 4, fullName: 'Kylian Mbappé', age: 27, phoneNumber: '555-009-0909', teamName: 'Real Madrid', registrationDate: '2026-03-12' },
      { id: 5, fullName: 'Erling Haaland', age: 25, phoneNumber: '555-009-1111', teamName: 'Manchester City', registrationDate: '2026-04-05' },
      { id: 6, fullName: 'Mohamed Salah', age: 33, phoneNumber: '555-011-1111', teamName: 'Liverpool FC', registrationDate: '2026-04-20' },
      { id: 7, fullName: 'Bukayo Saka', age: 24, phoneNumber: '555-007-0707', teamName: 'Arsenal FC', registrationDate: '2026-05-01' },
      { id: 8, fullName: 'Jude Bellingham', age: 22, phoneNumber: '555-005-0505', teamName: 'Real Madrid', registrationDate: '2026-05-10' }
    ];

    // Seed historic attendance for statistical graphs
    // We will seed data for May 24, May 25, May 26, and May 27
    const dates = ['2026-05-24', '2026-05-25', '2026-05-26', '2026-05-27'];
    
    // Hardcoded historical seed
    let attendanceId = 1;
    this.data.attendance = [
      // 2026-05-24
      { id: attendanceId++, playerId: 1, status: 'Present', date: '2026-05-24', time: '09:15:00' },
      { id: attendanceId++, playerId: 2, status: 'Present', date: '2026-05-24', time: '09:05:00' },
      { id: attendanceId++, playerId: 3, status: 'Absent', date: '2026-05-24', time: '09:30:00' },
      { id: attendanceId++, playerId: 4, status: 'Present', date: '2026-05-24', time: '09:12:00' },
      { id: attendanceId++, playerId: 5, status: 'Present', date: '2026-05-24', time: '09:00:00' },
      { id: attendanceId++, playerId: 6, status: 'Absent', date: '2026-05-24', time: '10:00:00' },
      { id: attendanceId++, playerId: 7, status: 'Present', date: '2026-05-24', time: '09:10:00' },
      { id: attendanceId++, playerId: 8, status: 'Present', date: '2026-05-24', time: '09:08:00' },

      // 2026-05-25
      { id: attendanceId++, playerId: 1, status: 'Present', date: '2026-05-25', time: '09:11:00' },
      { id: attendanceId++, playerId: 2, status: 'Absent', date: '2026-05-25', time: '10:15:00' },
      { id: attendanceId++, playerId: 3, status: 'Present', date: '2026-05-25', time: '09:14:00' },
      { id: attendanceId++, playerId: 4, status: 'Present', date: '2026-05-25', time: '09:10:00' },
      { id: attendanceId++, playerId: 5, status: 'Present', date: '2026-05-25', time: '08:58:00' },
      { id: attendanceId++, playerId: 6, status: 'Present', date: '2026-05-25', time: '09:05:00' },
      { id: attendanceId++, playerId: 7, status: 'Present', date: '2026-05-25', time: '09:12:00' },
      { id: attendanceId++, playerId: 8, status: 'Absent', date: '2026-05-25', time: '11:00:00' },

      // 2026-05-26
      { id: attendanceId++, playerId: 1, status: 'Present', date: '2026-05-26', time: '09:14:00' },
      { id: attendanceId++, playerId: 2, status: 'Present', date: '2026-05-26', time: '09:02:00' },
      { id: attendanceId++, playerId: 3, status: 'Present', date: '2026-05-26', time: '09:18:00' },
      { id: attendanceId++, playerId: 4, status: 'Absent', date: '2026-05-26', time: '09:45:00' },
      { id: attendanceId++, playerId: 5, status: 'Present', date: '2026-05-26', time: '08:55:00' },
      { id: attendanceId++, playerId: 6, status: 'Present', date: '2026-05-26', time: '09:04:00' },
      { id: attendanceId++, playerId: 7, status: 'Absent', date: '2026-05-26', time: '10:30:00' },
      { id: attendanceId++, playerId: 8, status: 'Present', date: '2026-05-26', time: '09:11:00' },

      // 2026-05-27 (Today, partial seed)
      { id: attendanceId++, playerId: 1, status: 'Present', date: '2026-05-27', time: '08:45:00' },
      { id: attendanceId++, playerId: 3, status: 'Present', date: '2026-05-27', time: '08:50:00' },
      { id: attendanceId++, playerId: 4, status: 'Present', date: '2026-05-27', time: '09:01:00' },
      { id: attendanceId++, playerId: 5, status: 'Present', date: '2026-05-27', time: '08:35:00' },
      { id: attendanceId++, playerId: 7, status: 'Absent', date: '2026-05-27', time: '09:12:00' }
    ];
  }

  // --- Users Operations ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserByUsername(username: string): User | undefined {
    return this.data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  // --- Players Operations ---
  public getPlayers(): Player[] {
    return this.data.players;
  }

  public getPlayerById(id: number): Player | undefined {
    return this.data.players.find((p) => p.id === id);
  }

  public createPlayer(playerData: Omit<Player, 'id'>): Player {
    const newId = this.data.players.reduce((max, p) => (p.id > max ? p.id : max), 0) + 1;
    const newPlayer: Player = {
      id: newId,
      fullName: playerData.fullName,
      age: playerData.age,
      phoneNumber: playerData.phoneNumber,
      teamName: playerData.teamName,
      registrationDate: playerData.registrationDate || new Date().toISOString().substring(0, 10)
    };
    this.data.players.push(newPlayer);
    this.save();
    return newPlayer;
  }

  public updatePlayer(id: number, playerData: Partial<Player>): Player | undefined {
    const index = this.data.players.findIndex((p) => p.id === id);
    if (index === -1) return undefined;
    
    this.data.players[index] = {
      ...this.data.players[index],
      ...playerData,
      id // Prevent altering ID
    };
    this.save();
    return this.data.players[index];
  }

  public deletePlayer(id: number): boolean {
    const index = this.data.players.findIndex((p) => p.id === id);
    if (index === -1) return false;
    
    // Exclude player
    this.data.players.splice(index, 1);
    
    // Cascade delete attendance records of this player
    this.data.attendance = this.data.attendance.filter(a => a.playerId !== id);
    
    this.save();
    return true;
  }

  // --- Attendance Operations ---
  public getAttendance(): Attendance[] {
    return this.data.attendance;
  }

  public getPlayerAttendance(playerId: number): Attendance[] {
    return this.data.attendance.filter((a) => a.playerId === playerId);
  }

  public recordAttendance(playerId: number, status: 'Present' | 'Absent', date: string, time: string): Attendance {
    // Check if attendance already exists for this player on this date
    const existingIndex = this.data.attendance.findIndex((a) => a.playerId === playerId && a.date === date);
    
    if (existingIndex !== -1) {
      // Update existing attendance record
      this.data.attendance[existingIndex].status = status;
      this.data.attendance[existingIndex].time = time;
      this.save();
      return this.data.attendance[existingIndex];
    } else {
      // Create new attendance record
      const newId = this.data.attendance.reduce((max, a) => (a.id > max ? a.id : max), 0) + 1;
      const newRecord: Attendance = {
        id: newId,
        playerId,
        status,
        date,
        time
      };
      this.data.attendance.push(newRecord);
      this.save();
      return newRecord;
    }
  }
}

export const db = new RelationalDatabase();
