import { Server, Socket } from 'socket.io';
import { Matchmaker } from './matchmaker';
import { store } from './store';
import { analyzeTextContent } from './moderation';
import { SupportedLanguage } from './types';

export function broadcastUserCounts(io: Server, matchmaker?: Matchmaker) {
  const stats = store.getStats();
  const totalOnline = io.sockets.sockets.size;
  const activeChatting = stats.activeRoomsCount * 2;
  const inQueue = matchmaker ? matchmaker.getTotalQueueCount() : 0;
  io.emit('user_count_update', {
    totalOnline,
    activeChatting,
    activeRooms: stats.activeRoomsCount,
    inQueue
  });
}

export function setupSignaling(io: Server, matchmaker: Matchmaker) {
  const notifyCounts = () => broadcastUserCounts(io, matchmaker);
  matchmaker.setOnCountUpdate(notifyCounts);

  // Periodic background heartbeat sync every 3 seconds
  setInterval(notifyCounts, 3000);

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);
    notifyCounts();

    // Register / Initial handshake
    socket.on('register', (data: { guestId: string; username: string; language: SupportedLanguage }) => {
      store.getOrCreateSession(socket.id, data.guestId, data.username, data.language);
      socket.emit('registered', { socketId: socket.id });
      notifyCounts();
    });

    // Enqueue for strict matching
    socket.on('join_queue', (data: {
      guestId: string;
      username: string;
      language: SupportedLanguage;
    }) => {
      matchmaker.enqueueUser(
        socket,
        data.guestId,
        data.username,
        data.language
      );
    });

    // Leave matchmaking queue
    socket.on('leave_queue', () => {
      matchmaker.dequeueUser(socket.id);
      socket.emit('queue_left');
      notifyCounts();
    });

    // WebRTC Signaling: Offer
    socket.on('signal_offer', (data: { roomId: string; to: string; sdp: any }) => {
      const targetSocket = io.sockets.sockets.get(data.to);
      if (targetSocket) {
        targetSocket.emit('signal_offer', {
          roomId: data.roomId,
          from: socket.id,
          sdp: data.sdp
        });
      }
    });

    // WebRTC Signaling: Answer
    socket.on('signal_answer', (data: { roomId: string; to: string; sdp: any }) => {
      const targetSocket = io.sockets.sockets.get(data.to);
      if (targetSocket) {
        targetSocket.emit('signal_answer', {
          roomId: data.roomId,
          from: socket.id,
          sdp: data.sdp
        });
      }
    });

    // WebRTC Signaling: ICE Candidate
    socket.on('signal_ice', (data: { roomId: string; to: string; candidate: any }) => {
      const targetSocket = io.sockets.sockets.get(data.to);
      if (targetSocket) {
        targetSocket.emit('signal_ice', {
          roomId: data.roomId,
          from: socket.id,
          candidate: data.candidate
        });
      }
    });

    // Real-Time Chat Message with Multilingual Moderation
    socket.on('chat_message', (data: { roomId: string; text: string }) => {
      const room = store.getRoom(data.roomId);
      if (!room) return;

      const senderSession = store.getSession(socket.id);
      const senderName = senderSession ? senderSession.username : 'User';

      // Run toxic language analysis
      const modResult = analyzeTextContent(data.text);

      if (modResult.isHarmful) {
        const strikeInfo = store.incrementStrike(socket.id);

        // Send private moderation warning to sender
        socket.emit('moderation_warning', {
          reason: modResult.reason,
          category: modResult.category,
          detectedTerms: modResult.detectedTerms,
          strikeCount: strikeInfo.strikeCount,
          isBanned: strikeInfo.isBanned,
          bannedUntil: strikeInfo.bannedUntil
        });

        // If high or critical toxicity, block sending the message entirely
        if (modResult.severity === 'high' || modResult.severity === 'critical') {
          return;
        }
      }

      const textToSend = modResult.sanitizedText || data.text;
      const messagePayload = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        senderId: socket.id,
        senderName: senderName,
        text: textToSend,
        timestamp: Date.now(),
        isFlagged: modResult.isHarmful
      };

      // Emit to both users in room
      io.to(room.peerA).emit('chat_message', messagePayload);
      if (room.peerB) {
        io.to(room.peerB).emit('chat_message', messagePayload);
      }
    });

    // Emoji Reactions
    socket.on('send_reaction', (data: { roomId: string; emoji: string }) => {
      const room = store.getRoom(data.roomId);
      if (!room) return;
      const otherSocketId = room.peerA === socket.id ? room.peerB : room.peerA;
      if (otherSocketId) {
        io.to(otherSocketId).emit('receive_reaction', {
          emoji: data.emoji,
          from: socket.id
        });
      }
    });

    // Screen Sharing State Change
    socket.on('screen_share_change', (data: { roomId: string; isSharing: boolean }) => {
      const room = store.getRoom(data.roomId);
      if (!room) return;
      const otherSocketId = room.peerA === socket.id ? room.peerB : room.peerA;
      if (otherSocketId) {
        io.to(otherSocketId).emit('remote_screen_share_change', {
          isSharing: data.isSharing,
          from: socket.id
        });
      }
    });

    // Audio Mute & Camera Toggle Relay (Synchronizes peer indicators cleanly)
    socket.on('media_state_change', (data: { roomId: string; isAudioMuted?: boolean; isVideoDisabled?: boolean }) => {
      const room = store.getRoom(data.roomId);
      if (!room) return;
      const otherSocketId = room.peerA === socket.id ? room.peerB : room.peerA;
      if (otherSocketId) {
        io.to(otherSocketId).emit('remote_media_state_change', {
          isAudioMuted: data.isAudioMuted,
          isVideoDisabled: data.isVideoDisabled,
          from: socket.id
        });
      }
    });

    // Skip / Next button clicked
    socket.on('next_partner', (data: { roomId?: string; requeue?: boolean }) => {
      const session = store.getSession(socket.id);
      const activeRoomId = data.roomId || (session ? session.currentRoomId : undefined);

      if (activeRoomId) {
        const room = store.removeRoom(activeRoomId);
        if (room) {
          const partnerId = room.peerA === socket.id ? room.peerB : room.peerA;
          if (partnerId) {
            io.to(partnerId).emit('partner_disconnected', {
              roomId: room.roomId,
              reason: 'Stranger skipped to the next match'
            });
          }
        }
      }

      if (session) {
        session.currentRoomId = undefined;
        session.partnerSocketId = undefined;
        session.state = 'idle';

        if (data.requeue) {
          matchmaker.enqueueUser(socket, session.guestId, session.username, session.language);
        }
      }
      notifyCounts();
    });

    // End call
    socket.on('end_call', (data: { roomId?: string }) => {
      const session = store.getSession(socket.id);
      const activeRoomId = data.roomId || (session ? session.currentRoomId : undefined);

      if (activeRoomId) {
        const room = store.removeRoom(activeRoomId);
        if (room) {
          const partnerId = room.peerA === socket.id ? room.peerB : room.peerA;
          if (partnerId) {
            io.to(partnerId).emit('partner_disconnected', {
              roomId: room.roomId,
              reason: 'Stranger ended the call'
            });
          }
        }
      }

      if (session) {
        session.currentRoomId = undefined;
        session.partnerSocketId = undefined;
        session.state = 'idle';
      }
      notifyCounts();
    });

    // Report user
    socket.on('report_user', async (data: {
      reportedSocketId: string;
      category: string;
      details?: string;
      language: string;
    }) => {
      const reporter = store.getSession(socket.id);
      const reported = store.getSession(data.reportedSocketId);

      await store.addReport({
        reporterSocketId: socket.id,
        reporterGuestId: reporter ? reporter.guestId : 'unknown',
        reportedSocketId: data.reportedSocketId,
        reportedGuestId: reported ? reported.guestId : data.reportedSocketId,
        category: data.category,
        details: data.details,
        language: data.language
      });

      // Auto block
      store.blockUser(socket.id, data.reportedSocketId);

      socket.emit('report_confirmed', {
        message: 'Thank you for keeping VibeConnect safe. User has been reported and blocked.'
      });
    });

    // Block user
    socket.on('block_user', (data: { blockedSocketId: string }) => {
      store.blockUser(socket.id, data.blockedSocketId);
      socket.emit('block_confirmed', { blockedSocketId: data.blockedSocketId });
    });

    // Speech transcription safety check
    socket.on('transcription_check', (data: { text: string; language: string }) => {
      const result = analyzeTextContent(data.text);
      if (result.isHarmful) {
        socket.emit('moderation_warning', {
          reason: `Potentially harmful spoken language detected: ${result.detectedTerms.join(', ')}`,
          category: result.category,
          severity: result.severity
        });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
      matchmaker.handleDisconnect(socket.id);
      notifyCounts();
      setTimeout(notifyCounts, 100);
    });
  });
}
