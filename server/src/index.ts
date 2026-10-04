import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { Matchmaker } from './matchmaker';
import { setupSignaling } from './signaling';
import { store } from './store';
import { analyzeTextContent } from './moderation';
import { SUPPORTED_LANGUAGES } from './types';

dotenv.config();

const app = express();
const server = http.createServer(app);

// CORS configuration for local dev and production domains
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  process.env.CLIENT_ORIGIN || '*'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow any origin in dev or when origin is undefined (mobile apps, curl, etc.)
    callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// Initialize Socket.io with robust timeouts and WebRTC signaling capabilities
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 20000,
  pingInterval: 10000,
  transports: ['websocket', 'polling']
});

// Initialize Strict Language Matchmaker
const matchmaker = new Matchmaker(io);

// Setup Socket signaling and real-time moderation
setupSignaling(io, matchmaker);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    appName: 'VibeConnect',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// WebRTC ICE / TURN servers configuration endpoint
app.get('/api/ice-servers', (_req: Request, res: Response) => {
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' }
  ];
  res.json({ iceServers });
});

// Real-time matchmaking statistics
app.get('/api/stats', (_req: Request, res: Response) => {
  const baseStats = store.getStats();
  res.json({
    stats: {
      ...baseStats,
      totalOnline: io.sockets.sockets.size,
      activeChatting: baseStats.activeRoomsCount * 2,
      inQueue: matchmaker.getTotalQueueCount()
    },
    queueBreakdown: matchmaker.getQueueStats()
  });
});

// Supported languages list
app.get('/api/languages', (_req: Request, res: Response) => {
  res.json({ languages: SUPPORTED_LANGUAGES });
});

// Moderation test API for testing toxic filters
app.post('/api/moderation/test', (req: Request, res: Response) => {
  const { text } = req.body;
  const analysis = analyzeTextContent(text || '');
  res.json({ input: text, analysis });
});

// Reports overview endpoint (admin / auditing)
app.get('/api/reports', (_req: Request, res: Response) => {
  res.json({ reports: store.getReports() });
});

const PORT = process.env.PORT || 5001;

server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(`🚀 VibeConnect Server running on port ${PORT}`);
  console.log(`📡 WebRTC Signaling & Strict Language Matchmaker active`);
  console.log(`🛡️  Multilingual Moderation Engine initialized`);
  console.log(`=========================================`);
});
