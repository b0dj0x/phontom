# PHANTOM b0dj0x — Zero-Trace P2P Encrypted Chat

**PHANTOM b0dj0x** is a browser-based, end-to-end encrypted peer-to-peer chat application with no servers, no logs, and no metadata. Every message is encrypted with AES-256-GCM using ECDH P-256 key exchange — keys exist only in memory and vanish when you close the tab.

> **Live demo**: [https://b0dj0x.github.io/phontom](https://b0dj0x.github.io/phontom)

---

## Features

- **Serverless P2P** — Direct WebRTC connection between peers. No relay servers, no message history, no data leaks.
- **End-to-End Encryption** — ECDH P-256 key exchange + AES-256-GCM via Web Crypto API. Your messages are encrypted before they leave your device.
- **Manual SDP Exchange** — Share offer/answer strings through any side channel (messenger, email, pastebin) or scan QR codes for instant pairing.
- **QR Code Pairing** — Generate and scan QR codes for the SDP offer/answer — no typing required.
- **Ephemeral by Design** — All data lives in browser memory. Closing the tab destroys everything. Optional per-message TTL (self-destruct after 10s, 30s, 1m, 5m).
- **Hacker / Cyberpunk UI** — Neon cyan and violet, monospace typography, scanlines overlay, animated border glows, blinking cursor.
- **No Account Required** — No sign-up, no email, no tracking. Just open the app and go.
- **Mobile Friendly** — Responsive design with camera-based QR scanning for mobile pairing.
- **Typing Indicator** — See when your peer is typing (encrypted in transit).
- **Graceful Disconnect** — Clean disconnection handling with status indicators.

## How It Works

```
Peer A                    Peer B
   |                         |
   |-- Create Room --------->|  (generates ECDH key pair + SDP offer)
   |                         |
   |<-- Share Offer (QR) ----|  (copy or scan)
   |                         |
   |-- Join Room ----------->|  (generates ECDH key pair + SDP answer)
   |                         |
   |<-- Share Answer (QR) ---|  (copy or scan)
   |                         |
   |-- Connect ------------->|  (ECDH key exchange completes)
   |                         |
   |<-- Encrypted Chat ----->|  (AES-256-GCM messages)
   |                         |
```

### Security Model

1. **Key Generation** — Each peer generates an ECDH P-256 key pair using `crypto.subtle.generateKey`.
2. **Key Exchange** — Public keys are exchanged over the WebRTC data channel (encrypted by DTLS).
3. **Shared Secret** — Both peers derive the same 256-bit shared key using ECDH.
4. **Message Encryption** — Every message is encrypted with AES-256-GCM (random 12-byte IV per message).
5. **Zero Persistence** — Keys are never stored, never logged, never transmitted to any server.

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
git clone https://github.com/b0dj0x/phontom.git
cd phontom
npm install
```

### Development

```bash
npm run dev
```

Opens at `https://localhost:3000/` (HTTPS required for Web Crypto API on some browsers).

> **Note**: The dev server uses a self-signed SSL certificate (via `@vitejs/plugin-basic-ssl`). Your browser will show a "not secure" warning — this is expected for local development.

### Build for Production

```bash
npm run build
```

Output goes to `dist/`. Serve with any static file server (e.g., `npx serve dist`).

### Phone Access

Access the app on your phone over the same network:

```
https://<your-local-ip>:3000/
```

Accept the self-signed certificate warning. The camera and encryption APIs require HTTPS.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS v4 + shadcn/ui (Nova) |
| P2P | Native WebRTC (`RTCPeerConnection` + `RTCDataChannel`) |
| Encryption | Web Crypto API (ECDH P-256 + AES-256-GCM) |
| QR Code | `jsQR` (scanning) + `qrcode` (generation) |
| Animations | Framer Motion |
| Font | Geist (variable) |

## Project Structure

```
src/
├── App.tsx                 # App shell with status routing
├── main.tsx                # Entry point
├── index.css               # Global styles, scanlines, animations
├── types.ts                # TypeScript types
├── components/
│   ├── Landing.tsx         # Home/create/join screens with QR
│   ├── ChatRoom.tsx        # Encrypted chat UI
│   ├── QrScanner.tsx       # Camera QR scanner
│   └── ui/                 # shadcn/ui components
├── hooks/
│   └── useSecureChat.ts    # Core hook: WebRTC, encryption, state
└── utils/
    └── crypto.ts           # ECDH + AES-GCM helpers
```

## Roadmap

- [ ] File transfer over data channel (encrypted)
- [ ] Dark/light theme toggle
- [ ] PWA support (offline-first)
- [ ] LAN discovery via mDNS
- [ ] Noise/cover traffic for metadata protection

## Why "PHANTOM"?

Zero trace. Zero logs. Zero servers. Like a phantom — here one moment, gone the next. Messages are encrypted end-to-end, never stored, and leave no trace behind.

## License

MIT
