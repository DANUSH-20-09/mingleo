import { Server, Socket } from 'socket.io';
import { store } from './store';
import { SupportedLanguage } from './types';

interface QueueEntry {
  socketId: string;
  guestId: string;
  username: string;
  language: SupportedLanguage;
  joinedAt: number;
  wantsSimulation?: boolean;
}

export class Matchmaker {
  private io: Server;
  // STRICT QUEUES: Map of language -> array of waiting users
  private languageQueues: Map<SupportedLanguage, QueueEntry[]> = new Map();
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(io: Server) {
    this.io = io;
    this.startMatchingLoop();
  }

  public enqueueUser(
    socket: Socket,
    guestId: string,
    username: string,
    language: SupportedLanguage,
    wantsSimulation: boolean = false
  ): void {
    const session = store.getOrCreateSession(socket.id, guestId, username, language);

    // Check if user is currently banned or timed out
    if (session.isBannedUntil && session.isBannedUntil > Date.now()) {
      const remainingSec = Math.ceil((session.isBannedUntil - Date.now()) / 1000);
      socket.emit('match_error', {
        message: `Account temporarily suspended due to community guidelines violation. Try again in ${remainingSec}s.`
      });
      return;
    }

    // Leave any previous queue
    this.dequeueUser(socket.id);

    session.language = language;
    session.state = 'in_queue';
    session.joinedQueueAt = Date.now();

    const entry: QueueEntry = {
      socketId: socket.id,
      guestId: session.guestId,
      username: session.username,
      language: language,
      joinedAt: Date.now(),
      wantsSimulation
    };

    if (!this.languageQueues.has(language)) {
      this.languageQueues.set(language, []);
    }

    const queue = this.languageQueues.get(language)!;
    queue.push(entry);

    console.log(
      `[Matchmaker] User ${username} (${socket.id}) queued for STRICT [${language}] matching. Queue size: ${queue.length}`
    );

    socket.emit('queue_joined', {
      language,
      queueSize: queue.length
    });

    // Try an immediate match cycle
    this.processQueueForLanguage(language);
  }

  public dequeueUser(socketId: string): void {
    for (const [lang, queue] of this.languageQueues.entries()) {
      const index = queue.findIndex(entry => entry.socketId === socketId);
      if (index !== -1) {
        queue.splice(index, 1);
        console.log(`[Matchmaker] Removed ${socketId} from [${lang}] queue.`);
      }
    }
    const session = store.getSession(socketId);
    if (session && session.state === 'in_queue') {
      session.state = 'idle';
      session.joinedQueueAt = undefined;
    }
  }

  public handleDisconnect(socketId: string): void {
    this.dequeueUser(socketId);
    const session = store.getSession(socketId);
    if (session && session.currentRoomId) {
      const room = store.removeRoom(session.currentRoomId);
      if (room) {
        const otherSocketId = room.peerA === socketId ? room.peerB : room.peerA;
        this.io.to(otherSocketId).emit('partner_disconnected', {
          roomId: room.roomId,
          reason: 'Partner left the session'
        });
      }
    }
    store.removeSession(socketId);
  }

  private startMatchingLoop(): void {
    if (this.processingInterval) clearInterval(this.processingInterval);
    this.processingInterval = setInterval(() => {
      this.processAllQueues();
    }, 1500);
  }

  private processAllQueues(): void {
    for (const lang of this.languageQueues.keys()) {
      this.processQueueForLanguage(lang);
    }
  }

  /**
   * STRICT matching algorithm:
   * Only matches users from within the exact same language queue.
   */
  private processQueueForLanguage(language: SupportedLanguage): void {
    const queue = this.languageQueues.get(language);
    if (!queue || queue.length === 0) return;

    // Filter out invalid/disconnected sockets
    const validEntries: QueueEntry[] = [];
    for (const entry of queue) {
      const socket = this.io.sockets.sockets.get(entry.socketId);
      const session = store.getSession(entry.socketId);
      if (socket && socket.connected && session && session.state === 'in_queue') {
        validEntries.push(entry);
      }
    }
    this.languageQueues.set(language, validEntries);

    if (validEntries.length < 2) {
      return;
    }

    // Try pairing first user with the best eligible partner in the same queue
    let i = 0;
    while (i < validEntries.length - 1) {
      const userA = validEntries[i];
      const sessionA = store.getSession(userA.socketId);
      if (!sessionA) {
        i++;
        continue;
      }

      let matchedIndex = -1;

      // Find an eligible partner userB
      for (let j = i + 1; j < validEntries.length; j++) {
        const userB = validEntries[j];
        const sessionB = store.getSession(userB.socketId);
        if (!sessionB) continue;

        // Check 1: Must be different sockets
        if (userA.socketId === userB.socketId || userA.guestId === userB.guestId) continue;

        // Check 2: Blocked check
        if (store.isBlocked(userA.socketId, userB.socketId)) continue;

        // Check 3: Strict Language Verification (server-side guaranteed)
        if (userA.language !== userB.language || userA.language !== language) continue;

        // Check 4: Anti-rematch preference (if other choices exist)
        const isRecent = sessionA.recentPartners.includes(userB.socketId) || sessionB.recentPartners.includes(userA.socketId);
        if (isRecent && validEntries.length > 2) {
          // Keep searching for a non-recent candidate if possible
          continue;
        }

        matchedIndex = j;
        break;
      }

      // If strict anti-rematch skipped candidates and we have pairs available, fallback to recent if necessary
      if (matchedIndex === -1 && validEntries.length >= 2) {
        for (let j = i + 1; j < validEntries.length; j++) {
          const userB = validEntries[j];
          if (
            userA.socketId !== userB.socketId &&
            userA.guestId !== userB.guestId &&
            userA.language === userB.language &&
            !store.isBlocked(userA.socketId, userB.socketId)
          ) {
            matchedIndex = j;
            break;
          }
        }
      }

      if (matchedIndex !== -1) {
        const userB = validEntries[matchedIndex];
        
        // Remove both from queue
        validEntries.splice(matchedIndex, 1);
        validEntries.splice(i, 1);

        this.connectPair(userA, userB, language);
      } else {
        i++;
      }
    }

    this.languageQueues.set(language, validEntries);
  }

  private connectPair(userA: QueueEntry, userB: QueueEntry, language: SupportedLanguage): void {
    const socketA = this.io.sockets.sockets.get(userA.socketId);
    const socketB = this.io.sockets.sockets.get(userB.socketId);

    if (!socketA || !socketB) {
      console.warn('[Matchmaker] One of the sockets vanished before connection.');
      return;
    }

    const room = store.createRoom(userA.socketId, userB.socketId, language, false);

    console.log(
      `[Matchmaker] MATCH CREATED! Room: ${room.roomId} | Language: ${language} | PeerA: ${userA.username} <-> PeerB: ${userB.username}`
    );

    // Socket A will be WebRTC Initiator (sends offer)
    socketA.emit('matched', {
      roomId: room.roomId,
      peerSocketId: userB.socketId,
      peerName: userB.username,
      isInitiator: true,
      language: language,
      isSimulated: false
    });

    // Socket B will await offer and send answer
    socketB.emit('matched', {
      roomId: room.roomId,
      peerSocketId: userA.socketId,
      peerName: userA.username,
      isInitiator: false,
      language: language,
      isSimulated: false
    });
  }



  public getQueueStats() {
    const stats: Record<string, number> = {};
    for (const [lang, queue] of this.languageQueues.entries()) {
      if (queue.length > 0) {
        stats[lang] = queue.length;
      }
    }
    return stats;
  }
}
