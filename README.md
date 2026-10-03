# VibeConnect 🚀
### Premium Omegle-Style Random Video Chat with Strict Language Matching & Multilingual AI Moderation

VibeConnect is a modern, fully functional real-time random video chat application built with **React, TypeScript, Tailwind CSS, Framer Motion, Node.js, Socket.IO, and WebRTC**.

---

## ✨ Key Features

1. **Strict Language-Based Matchmaking**
   - **Supported Languages:** Telugu, English, Hindi, Tamil, Kannada, Malayalam, Bengali, Marathi, Urdu, Spanish, French, German, Japanese, and Global (Any).
   - **Strict Matching Rule:** If a user chooses **Telugu**, they are matched **ONLY** with another user who chose Telugu. Validated strictly on the server-side queue engine.
   - **Anti-Rematch Intelligence:** Avoids pairing the same two users repeatedly when other candidates are available.

2. **Real-Time WebRTC Video & Audio**
   - Peer-to-peer audio & video streaming with STUN/TURN fallback.
   - Picture-in-Picture (PiP) floating/draggable local video preview with mirror flip.
   - Audio enhancements: Echo Cancellation, Noise Suppression, Automatic Gain Control (AGC).
   - Real-time speaking soundwaves & glowing audio activity rings.
   - Fullscreen and responsive layout optimized for mobile, tablet, and desktop.

3. **Multilingual Toxic Language Detection & Safety Moderation**
   - Detects profanity, harassment, sexual solicitations, and violent threats.
   - **Comprehensive Language Support:**
     - **Telugu:** Telugu script (`లంజ`, `దెంగ`, `పూకు`, `గుద్ద`, etc.) & Transliterated Romanized Telugu (`lanja`, `denga`, `puku`, `gudda`, `boku`, `modda`, `munda`, etc.).
     - **Hindi:** Devanagari & Hinglish (`chutiya`, `bhosdike`, `madarchod`, `randi`, `gaand`, etc.).
     - **Tamil:** Tamil script & Tanglish (`thevidiya`, `ootha`, `poolu`, `punda`, `thayoli`, etc.).
     - **English:** Profanity, sexual harassment, hate speech, and threat patterns.
   - **Strike System:**
     - Strike 1: Private in-app warning banner.
     - Strike 2: 60-second cooldown timeout.
     - Strike 3: 10-minute temporary suspension.
   - **User Safety Actions:** 1-tap Report with categories (Harassment, Sexual misconduct, Abusive language, Threats, Spam), Block, and Skip.

4. **Pre-Chat Setup & Device Lounge**
   - Explicit permission gate before accessing camera/microphone.
   - Real-time live microphone test volume visualizer (Web Audio API).
   - Dynamic device selection (switch front/back cameras, external USB microphones).
   - Age 18+ and Community Safety Guidelines verification.

5. **Dev Mode & Solo Interactive Simulation**
   - Includes a development mode interactive simulated partner stream (synthesized canvas companion + Web Audio tone) so solo testers/reviewers can test all WebRTC controls, skip, chat, reactions, and toxic moderation without needing 2 devices!

---

## 🏗️ Architecture Overview

```
meet them/
├── package.json              # Monorepo orchestration scripts
├── server/                   # Node.js + Express + Socket.IO + WebRTC Signaling
│   ├── src/
│   │   ├── index.ts          # Express API server & Socket.IO server
│   │   ├── matchmaker.ts     # Strict language queue manager & anti-rematch engine
│   │   ├── signaling.ts      # WebRTC SDP offer/answer & ICE candidate router
│   │   ├── moderation.ts     # Multilingual toxic language analyzer
│   │   ├── store.ts          # In-memory store + optional Supabase client
│   │   └── types.ts          # Shared TypeScript interfaces
├── client/                   # Vite + React 18 + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── context/
│   │   │   ├── SocketContext.tsx  # Matchmaking, messaging & socket lifecycle
│   │   │   └── SafetyContext.tsx  # Moderation strikes, blocks & guidelines
│   │   ├── hooks/
│   │   │   ├── useWebRTC.ts          # RTCPeerConnection & media tracks manager
│   │   │   └── useAudioVisualizer.ts # Web Audio API volume & frequency visualizer
│   │   ├── utils/
│   │   │   ├── soundEffects.ts       # Procedural audio chime synthesizer
│   │   │   ├── mediaStream.ts        # getUserMedia & device enumerator
│   │   │   └── speechSafety.ts       # Web Speech API safety listener
│   │   └── components/
│   │       ├── Navbar.tsx
│   │       ├── LandingPage.tsx
│   │       ├── PreChatSetup.tsx
│   │       ├── SearchingScreen.tsx
│   │       ├── VideoChatScreen.tsx
│   │       ├── VideoPlayer.tsx
│   │       ├── TextChatOverlay.tsx
│   │       ├── ReactionBursts.tsx
│   │       ├── ReportModal.tsx
│   │       ├── BlockModal.tsx
│   │       ├── SettingsModal.tsx
│   │       ├── CommunityGuidelinesModal.tsx
│   │       └── AboutPrivacyModal.tsx
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# From the root directory:
npm run install:all
```

### 2. Start Development Server (Frontend + Backend Concurrently)
```bash
npm run dev
```

- **Frontend Client:** [http://localhost:5173](http://localhost:5173)
- **Backend Server:** [http://localhost:5001](http://localhost:5001)

---

## 🛠️ Testing Strict Matchmaking

1. Open two separate browser windows (or one regular window and one Incognito window) at `http://localhost:5173`.
2. In Window 1: Select **Telugu** and click **Start Video Chat**.
3. In Window 2: Select **Telugu** and click **Start Video Chat**.
4. Both users will be paired strictly together!
5. Try selecting **Hindi** in Window 1 and **Telugu** in Window 2: the matchmaker will keep each in their respective strict queues and will **never** cross-match them.
6. **Solo Testing Mode:** On the Searching screen, click **"Simulated Partner (Dev)"** to instantly connect to a virtual companion stream.

---

## 🔒 Privacy & Safety Compliance

- **Zero Video/Audio Recording:** Peer-to-peer WebRTC connections are direct and never recorded.
- **Guest Sessions:** Anonymous IDs are generated locally; no emails or phone numbers required.
- **Transliterated Telugu & Multilingual Safety:** Abusive slangs in romanized script are caught in real-time.
