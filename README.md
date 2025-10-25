Pasteboard

A local-first, ephemeral pasteboard for quickly sharing text and files across devices on the same network. No accounts, no cloud — just a small, transparent tool.

Features
- Drop, paste, or type to add items (text, images, other files)
- Real-time sync via WebSockets to all connected clients
- One-click copy for text, and direct download links for files/images
- Reset action to clear all items and schedule deletion of uploaded files
- Ephemeral by design: items live in server memory and vanish on restart

Tech stack
- Frontend: React + Vite + TypeScript, Tailwind via CDN
- Backend: Express + Multer (uploads) + ws (WebSocket)

Project structure
- App.tsx — UI state, WebSocket client, and REST upload integration
- components/ — Header, ItemCard, PasteboardInput, Icons
- server.js — Express + WebSocket server; in‑memory items; file serving and deletion
- types.ts — Item types and data model
- vite.config.ts — Dev server at 0.0.0.0:3000

Requirements
- Node.js ≥ 18
- pnpm installed globally (pnpm ≥ 8 recommended)

Setup and running (pnpm)
1) Install deps
   pnpm install
2) Start backend (port 3001)
   pnpm start:backend
3) Start frontend (port 3000)
   pnpm start:frontend
4) Open the app
   http://localhost:3000
   Or from another device on your LAN: http://<your-machine-ip>:3000

Note: A combined script exists (start) using concurrently, but it references npm:* and may not work as-is. Prefer running backend and frontend in two terminals with pnpm, or update the start script to use "pnpm run start:backend" and "pnpm run start:frontend".

How it works
- Uploads: POST /upload (multipart/form-data, field "file") returns { downloadUrl }
- Files are stored under /uploads and served statically by the backend
- WebSocket messages:
  INIT { items, serverIp }
  ADD_ITEM { id, type, content, downloadUrl?, fileType? }
  DELETE_ITEM { id }
  RESET_ITEMS

Security and data model
- No authentication; anyone on the same network can connect
- CORS is enabled; intended for local/LAN usage — do not expose publicly
- Items are stored in memory; uploaded files are kept on disk until deleted
- Reset deletes in-memory items and schedules deletion of all uploaded files

Notes
- AI/Gemini services have been removed; services/geminiService.ts is a stub
- Tailwind is loaded via CDN for simplicity

Potential improvements (optional)
- Add build/preview scripts (e.g., "build": "vite build", "preview": "vite preview")
- Fix start script to use pnpm run and add named prefixes in concurrently
- Persist storage (e.g., SQLite) or retention policy if desired