import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db';
import { UserRole } from './src/types';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'attendance_platform_super_secret_2026';

// Parse JSON bodies
app.use(express.json());

// Extend express requests to include user information from JWT
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: UserRole;
  };
}

// Security Middlewares
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token is required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired session token' });
      return;
    }
    req.user = decoded as AuthenticatedRequest['user'];
    next();
  });
};

const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'Admin') {
    res.status(403).json({ error: 'Administrator clearance is required for this action' });
    return;
  }
  next();
};

// ==========================================
// 1. Authentication Routes
// ==========================================

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const user = db.getUserByUsername(username);
  if (!user || !user.password) {
    res.status(401).json({ error: 'Invalid credentials. Please verify your login details.' });
    return;
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    res.status(401).json({ error: 'Invalid credentials. Please verify your login details.' });
    return;
  }

  // Generate JWT Token
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  });
});

// Get self info (for page reloads / keeping session active)
app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// ==========================================
// 2. Play Rosters (Players) REST APIs
// ==========================================

// Get list of players
app.get('/api/players', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const playersList = db.getPlayers();
  res.json(playersList);
});

// Get single player
app.get('/api/players/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Player ID must be a valid number' });
    return;
  }

  const player = db.getPlayerById(id);
  if (!player) {
    res.status(404).json({ error: 'Player not found' });
    return;
  }

  res.json(player);
});

// Add player
app.post('/api/players', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { fullName, age, phoneNumber, teamName, registrationDate } = req.body;

  if (!fullName || !age || !phoneNumber || !teamName) {
    res.status(400).json({ error: 'Full Name, Age, Phone, and Team are required fields' });
    return;
  }

  const ageNum = parseInt(age, 10);
  if (isNaN(ageNum) || ageNum <= 0) {
    res.status(400).json({ error: 'Age must be a positive integer value' });
    return;
  }

  const newPlayer = db.createPlayer({
    fullName,
    age: ageNum,
    phoneNumber,
    teamName,
    registrationDate: registrationDate || new Date().toISOString().substring(0, 10),
  });

  res.status(201).json({ message: 'Player added successfully', player: newPlayer });
});

// Edit player info
app.put('/api/players/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Player ID must be a number' });
    return;
  }

  const { fullName, age, phoneNumber, teamName, registrationDate } = req.body;

  const updateData: any = {};
  if (fullName !== undefined) updateData.fullName = fullName;
  if (age !== undefined) {
    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge <= 0) {
      res.status(400).json({ error: 'Age must be a valid positive integer' });
      return;
    }
    updateData.age = parsedAge;
  }
  if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
  if (teamName !== undefined) updateData.teamName = teamName;
  if (registrationDate !== undefined) updateData.registrationDate = registrationDate;

  const updatedPlayer = db.updatePlayer(id, updateData);
  if (!updatedPlayer) {
    res.status(404).json({ error: 'Player not found' });
    return;
  }

  res.json({ message: 'Player updated successfully', player: updatedPlayer });
});

// Delete player
app.delete('/api/players/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Player ID must be a number' });
    return;
  }

  const deleted = db.deletePlayer(id);
  if (!deleted) {
    res.status(404).json({ error: 'Player not found' });
    return;
  }

  res.json({ message: 'Player and linked attendance logs deleted successfully' });
});

// ==========================================
// 3. Attendance Management REST APIs
// ==========================================

// Log Attendance (Present / Absent)
app.post('/api/attendance', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { playerId, status } = req.body;

  if (playerId === undefined || !status) {
    res.status(400).json({ error: 'Player ID and attendance status (Present/Absent) are required' });
    return;
  }

  if (status !== 'Present' && status !== 'Absent') {
    res.status(400).json({ error: 'Status must be either Present or Absent' });
    return;
  }

  const pId = parseInt(playerId, 10);
  const player = db.getPlayerById(pId);
  if (!player) {
    res.status(404).json({ error: 'Player record does not exist' });
    return;
  }

  // Generate current Date and Time automatically
  const now = new Date();
  const currentDate = now.toISOString().substring(0, 10); // YYYY-MM-DD
  const currentTime = now.toLocaleTimeString('en-US', { hour12: false }); // HH:MM:SS

  const record = db.recordAttendance(pId, status, currentDate, currentTime);

  res.status(200).json({
    message: `Player attendance marked as ${status}`,
    attendance: {
      ...record,
      playerName: player.fullName,
      teamName: player.teamName,
    },
  });
});

// Fetch detailed attendance history (all activities)
app.get('/api/attendance/history', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const attendanceRecords = db.getAttendance();
  const players = db.getPlayers();

  // Create lookup dictionary
  const playersMap = new Map(players.map((p) => [p.id, p]));

  const detailedHistory = attendanceRecords
    .map((record) => {
      const player = playersMap.get(record.playerId);
      return {
        id: record.id,
        playerId: record.playerId,
        playerName: player ? player.fullName : 'Deleted Player',
        teamName: player ? player.teamName : 'Unknown Team',
        status: record.status,
        date: record.date,
        time: record.time,
      };
    })
    // Sort reverse-chronologically (latest logs first)
    .sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.time.localeCompare(a.time);
    });

  res.json(detailedHistory);
});

// ==========================================
// 4. Admin Strategic Insights Dashboard
// ==========================================

app.get('/api/admin/stats', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const players = db.getPlayers();
  const attendanceRecords = db.getAttendance();

  const totalPlayers = players.length;

  // Determine design target date (selected parameter or default today)
  const queryDate = req.query.date as string;
  const targetDateStr = queryDate || new Date().toISOString().substring(0, 10);

  // Filter records matching target date
  const recordsToday = attendanceRecords.filter((a) => a.date === targetDateStr);
  const presentToday = recordsToday.filter((a) => a.status === 'Present').length;
  const absentToday = recordsToday.filter((a) => a.status === 'Absent').length;

  // Compute percentage attendance
  const markedTodayCount = presentToday + absentToday;
  const attendancePercentage = markedTodayCount > 0
    ? Math.round((presentToday / markedTodayCount) * 100)
    : 0;

  // Create lookup dictionary
  const playersMap = new Map(players.map((p) => [p.id, p]));

  // Recent attendance activity feeds (last 10 items)
  const recentActivities = attendanceRecords
    .map((record) => {
      const player = playersMap.get(record.playerId);
      return {
        id: record.id,
        playerId: record.playerId,
        playerName: player ? player.fullName : 'Deleted Player',
        teamName: player ? player.teamName : 'Unknown Team',
        status: record.status,
        date: record.date,
        time: record.time,
      };
    })
    .sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.time.localeCompare(a.time);
    })
    .slice(0, 10);

  // Generate historical analytics (Attendance statistics by day - last 7 distinct dates)
  // Get distinct dates with attendance
  const dates = Array.from(new Set(attendanceRecords.map((a) => a.date)))
    .sort((a, b) => a.localeCompare(b))
    .slice(-7); // Last 7 days that have records

  const dailyStats = dates.map((d) => {
    const dayRecords = attendanceRecords.filter((a) => a.date === d);
    const present = dayRecords.filter((a) => a.status === 'Present').length;
    const absent = dayRecords.filter((a) => a.status === 'Absent').length;
    return {
      date: d,
      present,
      absent,
    };
  });

  // Calculate Breakdown by Team for today (or total records if none exists for today)
  // To avoid unseeded days lacking visuals, if no items are marked today, group historical totals
  const teamsMap = new Map<string, { present: number; absent: number }>();
  
  // Set initial teams based on players to register them even if 0 marks
  players.forEach(p => {
    if (p.teamName && !teamsMap.has(p.teamName)) {
      teamsMap.set(p.teamName, { present: 0, absent: 0 });
    }
  });

  // Decide source: if today has logs use today's, else summarize all-time attendance for visual richness!
  const datasource = recordsToday.length > 0 ? recordsToday : attendanceRecords;
  datasource.forEach((a) => {
    const player = playersMap.get(a.playerId);
    if (player && player.teamName) {
      const current = teamsMap.get(player.teamName) || { present: 0, absent: 0 };
      if (a.status === 'Present') {
        current.present++;
      } else {
        current.absent++;
      }
      teamsMap.set(player.teamName, current);
    }
  });

  const teamStats = Array.from(teamsMap.entries()).map(([teamName, counts]) => ({
    teamName,
    present: counts.present,
    absent: counts.absent,
  }));

  res.json({
    totalPlayers,
    presentToday,
    absentToday,
    attendancePercentage,
    recentActivities,
    charts: {
      daily: dailyStats,
      team: teamStats,
    },
  });
});

// ==========================================
// 5. Serving Frontend App Assets
// ==========================================

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Use Vite middleware to handle static files and transpilation
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve index.html as single page app fallback
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Player Attendance Server] active on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Server boots failed:', err);
});
