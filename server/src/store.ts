import { ReportRecord, UserSession, ActiveRoom } from './types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class AppStore {
  private sessions: Map<string, UserSession> = new Map(); // socketId -> session
  private rooms: Map<string, ActiveRoom> = new Map(); // roomId -> room
  private reports: ReportRecord[] = [];
  private totalMatchesCount: number = 0;
  private supabase: SupabaseClient | null = null;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        console.log('[Store] Supabase client initialized for persistence.');
      } catch (err) {
        console.warn('[Store] Supabase init failed, using in-memory store:', err);
      }
    } else {
      console.log('[Store] Running with fast in-memory store (Supabase optional).');
    }
  }

  // Session management
  public getOrCreateSession(socketId: string, guestId: string, username?: string, language?: any): UserSession {
    let session = this.sessions.get(socketId);
    if (!session) {
      session = {
        socketId,
        guestId: guestId || `guest_${Math.random().toString(36).substring(2, 9)}`,
        username: username || `Viber_${Math.floor(1000 + Math.random() * 9000)}`,
        language: language || 'global',
        state: 'idle',
        recentPartners: [],
        blockedUsers: new Set<string>(),
        strikeCount: 0
      };
      this.sessions.set(socketId, session);
    }
    return session;
  }

  public getSession(socketId: string): UserSession | undefined {
    return this.sessions.get(socketId);
  }

  public removeSession(socketId: string): void {
    this.sessions.delete(socketId);
  }

  // Room management
  public createRoom(peerA: string, peerB: string, language: any, isSimulated: boolean = false): ActiveRoom {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const room: ActiveRoom = {
      roomId,
      peerA,
      peerB,
      language,
      startedAt: Date.now(),
      isSimulated
    };
    this.rooms.set(roomId, room);
    this.totalMatchesCount++;

    const sessA = this.sessions.get(peerA);
    const sessB = this.sessions.get(peerB);

    if (sessA) {
      sessA.state = 'in_call';
      sessA.currentRoomId = roomId;
      sessA.partnerSocketId = peerB;
      sessA.recentPartners.unshift(peerB);
      if (sessA.recentPartners.length > 8) sessA.recentPartners.pop();
    }

    if (sessB) {
      sessB.state = 'in_call';
      sessB.currentRoomId = roomId;
      sessB.partnerSocketId = peerA;
      sessB.recentPartners.unshift(peerA);
      if (sessB.recentPartners.length > 8) sessB.recentPartners.pop();
    }

    return room;
  }

  public getRoom(roomId: string): ActiveRoom | undefined {
    return this.rooms.get(roomId);
  }

  public removeRoom(roomId: string): ActiveRoom | undefined {
    const room = this.rooms.get(roomId);
    if (room) {
      const sessA = this.sessions.get(room.peerA);
      const sessB = this.sessions.get(room.peerB);
      if (sessA && sessA.currentRoomId === roomId) {
        sessA.currentRoomId = undefined;
        sessA.partnerSocketId = undefined;
        sessA.state = 'idle';
      }
      if (sessB && sessB.currentRoomId === roomId) {
        sessB.currentRoomId = undefined;
        sessB.partnerSocketId = undefined;
        sessB.state = 'idle';
      }
      this.rooms.delete(roomId);
    }
    return room;
  }

  // Reports
  public async addReport(report: Omit<ReportRecord, 'id' | 'timestamp'>): Promise<ReportRecord> {
    const record: ReportRecord = {
      ...report,
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now()
    };
    this.reports.push(record);
    console.log(`[Store] New Report submitted: ${record.category} against ${record.reportedGuestId}`);

    if (this.supabase) {
      try {
        await this.supabase.from('reports').insert([record]);
      } catch (err) {
        console.error('[Store] Failed to write report to Supabase:', err);
      }
    }
    return record;
  }

  public getReports(): ReportRecord[] {
    return this.reports;
  }

  // Block management
  public blockUser(reporterSocketId: string, targetIdentifier: string): void {
    const reporter = this.sessions.get(reporterSocketId);
    if (reporter) {
      reporter.blockedUsers.add(targetIdentifier);
    }
  }

  public isBlocked(userASocketId: string, userBSocketId: string): boolean {
    const sessA = this.sessions.get(userASocketId);
    const sessB = this.sessions.get(userBSocketId);
    if (!sessA || !sessB) return false;

    if (sessA.blockedUsers.has(sessB.socketId) || sessA.blockedUsers.has(sessB.guestId)) return true;
    if (sessB.blockedUsers.has(sessA.socketId) || sessB.blockedUsers.has(sessA.guestId)) return true;
    return false;
  }

  // Moderation strikes
  public incrementStrike(socketId: string): { strikeCount: number; isBanned: boolean; bannedUntil?: number } {
    const session = this.sessions.get(socketId);
    if (!session) return { strikeCount: 0, isBanned: false };

    session.strikeCount += 1;
    let isBanned = false;
    let bannedUntil: number | undefined;

    if (session.strikeCount >= 3) {
      // 10 minutes ban
      bannedUntil = Date.now() + 10 * 60 * 1000;
      session.isBannedUntil = bannedUntil;
      isBanned = true;
    } else if (session.strikeCount >= 2) {
      // 1 minute cooldown
      bannedUntil = Date.now() + 60 * 1000;
      session.isBannedUntil = bannedUntil;
      isBanned = true;
    }

    return {
      strikeCount: session.strikeCount,
      isBanned,
      bannedUntil
    };
  }

  // Stats
  public getStats() {
    return {
      activeSessionsCount: this.sessions.size,
      activeRoomsCount: this.rooms.size,
      totalMatchesCount: this.totalMatchesCount,
      totalReportsCount: this.reports.length
    };
  }
}

export const store = new AppStore();
