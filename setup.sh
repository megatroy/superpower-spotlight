#!/bin/bash
set -e

PROJECT="superpower-spotlight"

echo "✦ Creating Superpower Spotlight ✦"
echo ""

mkdir -p "$PROJECT"/{app/room/\[code\],app/api/{rooms,join,submit,synthesize,reveal,poll},lib}
cd "$PROJECT"

# ── package.json ──
cat > package.json << 'EOF'
{
  "name": "superpower-spotlight",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@upstash/redis": "^1.34.0",
    "next": "^14.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
EOF

# ── next.config.js ──
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
};
module.exports = nextConfig;
EOF

# ── .env.local ──
cat > .env.local << 'EOF'
ANTHROPIC_API_KEY=sk-ant-PASTE-YOUR-KEY-HERE
UPSTASH_REDIS_REST_URL=https://PASTE-YOUR-UPSTASH-URL-HERE
UPSTASH_REDIS_REST_TOKEN=PASTE-YOUR-UPSTASH-TOKEN-HERE
EOF

# ── .gitignore ──
cat > .gitignore << 'EOF'
node_modules
.next
.env.local
EOF

# ── Dockerfile ──
cat > Dockerfile << 'DOCKEREOF'
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
DOCKEREOF

# ── lib/store.js ──
cat > lib/store.js << 'STOREEOF'
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const TTL = 4 * 60 * 60;

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function roomKey(code) {
  return `room:${code.toUpperCase()}`;
}

async function saveRoom(room) {
  await redis.set(roomKey(room.code), JSON.stringify(room), { ex: TTL });
  return room;
}

export async function getRoom(code) {
  if (!code) return null;
  const data = await redis.get(roomKey(code));
  if (!data) return null;
  return typeof data === "string" ? JSON.parse(data) : data;
}

export async function createRoom(facilitatorName) {
  let code = genCode();
  let attempts = 0;
  while ((await redis.exists(roomKey(code))) && attempts < 10) {
    code = genCode();
    attempts++;
  }

  const room = {
    code,
    phase: "lobby",
    facilitator: facilitatorName,
    players: [{ name: facilitatorName, id: crypto.randomUUID() }],
    submissions: {},
    synthesis: {},
    revealIndex: -1,
    revealShowAnswer: false,
    createdAt: Date.now(),
  };

  await saveRoom(room);
  return room;
}

export async function joinRoom(code, playerName) {
  const room = await getRoom(code);
  if (!room) return { error: "Room not found" };
  if (room.phase !== "lobby") return { error: "Room already started" };
  if (room.players.find((p) => p.name.toLowerCase() === playerName.toLowerCase())) {
    return { error: "Name already taken" };
  }
  const player = { name: playerName, id: crypto.randomUUID() };
  room.players.push(player);
  await saveRoom(room);
  return { room, player };
}

export async function submitSuperpowers(code, fromPlayerId, entries) {
  const room = await getRoom(code);
  if (!room) return { error: "Room not found" };
  if (room.phase !== "submit") return { error: "Not in submission phase" };
  room.submissions[fromPlayerId] = {
    ...(room.submissions[fromPlayerId] || {}),
    ...entries,
  };
  await saveRoom(room);
  return { ok: true };
}

export async function setPhase(code, phase) {
  const room = await getRoom(code);
  if (!room) return null;
  room.phase = phase;
  await saveRoom(room);
  return room;
}

export async function setSynthesis(code, synthesis) {
  const room = await getRoom(code);
  if (!room) return null;
  room.synthesis = synthesis;
  await saveRoom(room);
  return room;
}

export async function updateRoom(code, updateFn) {
  const room = await getRoom(code);
  if (!room) return null;
  updateFn(room);
  await saveRoom(room);
  return room;
}

export async function advanceReveal(code) {
  const room = await getRoom(code);
  if (!room) return null;

  if (!room.revealShowAnswer) {
    room.revealShowAnswer = true;
  } else {
    room.revealIndex += 1;
    room.revealShowAnswer = false;
  }

  if (room.revealIndex >= room.players.length) {
    room.phase = "report";
  }

  await saveRoom(room);
  return room;
}

export function getSuperpowersForPlayer(room, playerName) {
  const powers = [];
  for (const [fromId, entries] of Object.entries(room.submissions)) {
    if (entries[playerName]) {
      powers.push(entries[playerName]);
    }
  }
  return powers;
}

export async function getRoomState(code, playerId) {
  const room = await getRoom(code);
  if (!room) return null;

  return {
    code: room.code,
    phase: room.phase,
    facilitator: room.facilitator,
    players: room.players.map((p) => ({ name: p.name })),
    playerCount: room.players.length,
    submissionCount: Object.keys(room.submissions).length,
    revealIndex: room.revealIndex,
    revealShowAnswer: room.revealShowAnswer,
    ...(room.phase === "guess" || room.phase === "report"
      ? { synthesis: room.synthesis }
      : {}),
    isFacilitator:
      room.players.find((p) => p.id === playerId)?.name === room.facilitator,
  };
}
STOREEOF

# ── lib/prompts.js ──
cat > lib/prompts.js << 'PROMPTEOF'
export function buildSynthesisPrompt(playerName, superpowers) {
  return `You are a mystical horoscope writer with the quirky humor of Earthbound / Mother series games.

Given the following superpowers that a team has attributed to someone (DO NOT use their name anywhere in your output):

${superpowers.map((s, i) => `- "${s}"`).join("\n")}

Generate a JSON response with EXACTLY this structure (no markdown, no backticks, just raw JSON):

{
  "haiku": "a haiku (5-7-5 syllables) that poetically captures this person's essence based on their superpowers. Be creative, warm, and a little mysterious. Do NOT include their name.",
  "horoscope": {
    "reading": "A 2-3 sentence Q2 2026 horoscope reading for this person based on their superpowers. Be encouraging, a little weird, and specific. Reference their actual strengths but don't name them. Channel Earthbound fortune teller energy.",
    "lucky_color": "A specific, unusual color (not just 'blue' — think 'electric tangerine' or 'moss after rain')",
    "lucky_item": "A quirky, specific lucky item in the style of Earthbound (e.g., 'a slightly dented kazoo', 'a USB drive labeled MYSTERY')",
    "lucky_food": "A specific, delightful food item (e.g., 'a perfectly crispy hash brown', 'mango sticky rice from that one place')"
  }
}

Respond with ONLY the JSON object. No preamble, no explanation.`;
}
PROMPTEOF

# ── app/layout.js ──
cat > app/layout.js << 'EOF'
import "./globals.css";

export const metadata = {
  title: "Superpower Spotlight ✦",
  description: "Discover your team's superpowers",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
EOF

# ── app/globals.css ──
cat > app/globals.css << 'CSSEOF'
@import url('https://fonts.googleapis.com/css2?family=VT323&family=DM+Sans:wght@400;500;700&display=swap');

:root {
  --bg: #1a0a2e;
  --bg-card: #2d1b4e;
  --bg-card-alt: #3d2b5e;
  --border: #f0c040;
  --border-glow: #f0c04066;
  --text: #f0e6ff;
  --text-dim: #a090c0;
  --accent: #f0c040;
  --accent2: #ff6b9d;
  --accent3: #40e0d0;
  --accent4: #90ee90;
  --danger: #ff4040;
  --font-display: 'VT323', monospace;
  --font-body: 'DM Sans', sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-body);
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  background-image:
    radial-gradient(ellipse at 20% 50%, #2d1b6e33 0%, transparent 50%),
    radial-gradient(ellipse at 80% 50%, #4a1b5e33 0%, transparent 50%);
}

.container {
  max-width: 640px;
  margin: 0 auto;
  padding: 24px 16px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.eb-box {
  background: var(--bg-card);
  border: 3px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  box-shadow:
    0 0 15px var(--border-glow),
    inset 0 1px 0 rgba(255,255,255,0.05);
  position: relative;
}

.eb-box::before {
  content: '';
  position: absolute;
  inset: 4px;
  border: 1px solid rgba(240, 192, 64, 0.15);
  border-radius: 8px;
  pointer-events: none;
}

.eb-box + .eb-box { margin-top: 16px; }

h1, h2, h3 {
  font-family: var(--font-display);
  color: var(--accent);
  letter-spacing: 1px;
}

h1 { font-size: 2.5rem; text-align: center; }
h2 { font-size: 1.8rem; }
h3 { font-size: 1.4rem; }

.subtitle {
  color: var(--text-dim);
  text-align: center;
  margin-top: 4px;
  font-size: 0.95rem;
}

.btn {
  font-family: var(--font-display);
  font-size: 1.3rem;
  padding: 12px 28px;
  border: 2px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--accent);
  cursor: pointer;
  transition: all 0.15s;
  letter-spacing: 1px;
}

.btn:hover {
  background: var(--border);
  color: var(--bg);
  box-shadow: 0 0 20px var(--border-glow);
}

.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-primary { background: var(--accent); color: var(--bg); }
.btn-primary:hover { background: #ffd060; border-color: #ffd060; }
.btn-accent { border-color: var(--accent2); color: var(--accent2); }
.btn-accent:hover { background: var(--accent2); color: var(--bg); }

.input {
  font-family: var(--font-body);
  font-size: 1rem;
  padding: 12px 16px;
  background: rgba(0,0,0,0.3);
  border: 2px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  width: 100%;
  outline: none;
  transition: border-color 0.15s;
}

.input:focus {
  border-color: var(--accent3);
  box-shadow: 0 0 10px rgba(64, 224, 208, 0.2);
}

.input::placeholder { color: var(--text-dim); }
.input-row { display: flex; gap: 12px; margin-top: 12px; }
.input-row .input { flex: 1; }

.room-code {
  font-family: var(--font-display);
  font-size: 3rem;
  text-align: center;
  color: var(--accent);
  letter-spacing: 8px;
  text-shadow: 0 0 20px var(--border-glow);
}

.player-list {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.player-chip {
  font-family: var(--font-display);
  font-size: 1.1rem;
  padding: 6px 14px;
  background: var(--bg-card-alt);
  border: 1px solid var(--border);
  border-radius: 20px;
  color: var(--accent);
}

.haiku {
  font-family: var(--font-display);
  font-size: 1.6rem;
  line-height: 2;
  text-align: center;
  color: var(--accent3);
  padding: 20px;
  white-space: pre-line;
}

.horoscope-card { text-align: center; padding: 16px; }

.horoscope-reading {
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 20px;
  font-style: italic;
}

.lucky-items {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

.lucky-item {
  background: rgba(0,0,0,0.2);
  border-radius: 8px;
  padding: 12px 8px;
}

.lucky-label {
  font-family: var(--font-display);
  font-size: 0.9rem;
  color: var(--text-dim);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.lucky-value {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--accent2);
}

.submit-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.submit-row { display: flex; gap: 12px; align-items: center; }

.submit-name {
  font-family: var(--font-display);
  font-size: 1.2rem;
  color: var(--accent);
  min-width: 100px;
  text-align: right;
}

.submit-row .input { flex: 1; }

.phase-bar {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 16px 0;
}

.phase-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--bg-card-alt);
  border: 1px solid var(--border);
  transition: all 0.3s;
}

.phase-dot.active {
  background: var(--accent);
  box-shadow: 0 0 10px var(--border-glow);
}

.phase-dot.complete {
  background: var(--accent4);
  border-color: var(--accent4);
}

.timer {
  font-family: var(--font-display);
  font-size: 2rem;
  text-align: center;
  color: var(--accent2);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.fade-in { animation: fadeIn 0.5s ease; }
.pulse { animation: pulse 1.5s ease infinite; }

.guess-prompt {
  font-family: var(--font-display);
  font-size: 1.4rem;
  text-align: center;
  color: var(--accent2);
  margin: 12px 0;
}

.reveal-name {
  font-family: var(--font-display);
  font-size: 2.2rem;
  text-align: center;
  color: var(--accent);
  text-shadow: 0 0 20px var(--border-glow);
  margin: 12px 0;
}

.powers-list {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin: 12px 0;
}

.power-tag {
  font-size: 0.85rem;
  padding: 4px 12px;
  background: rgba(240, 192, 64, 0.1);
  border: 1px solid rgba(240, 192, 64, 0.3);
  border-radius: 20px;
  color: var(--accent);
}

@media (max-width: 480px) {
  h1 { font-size: 2rem; }
  .room-code { font-size: 2.4rem; }
  .lucky-items { grid-template-columns: 1fr; }
  .submit-row { flex-direction: column; align-items: stretch; }
  .submit-name { text-align: left; min-width: unset; }
}
CSSEOF

# ── app/page.js ──
cat > app/page.js << 'PAGEEOF'
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      sessionStorage.setItem("playerId", data.playerId);
      sessionStorage.setItem("playerName", name.trim());
      router.push(`/room/${data.code}`);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!name.trim() || !code.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase(), name: name.trim() }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      sessionStorage.setItem("playerId", data.playerId);
      sessionStorage.setItem("playerName", name.trim());
      router.push(`/room/${data.code}`);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ justifyContent: "center", gap: 24 }}>
      <div style={{ textAlign: "center" }}>
        <h1>✦ Superpower Spotlight ✦</h1>
        <p className="subtitle">Discover your team&apos;s hidden powers</p>
      </div>

      {!mode && (
        <div className="eb-box fade-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button className="btn btn-primary" onClick={() => setMode("create")}>
            Create a Room
          </button>
          <button className="btn" onClick={() => setMode("join")}>
            Join a Room
          </button>
        </div>
      )}

      {mode === "create" && (
        <div className="eb-box fade-in">
          <h3>Create a Room</h3>
          <p className="subtitle" style={{ textAlign: "left", marginBottom: 12 }}>
            You&apos;ll be the facilitator.
          </p>
          <input
            className="input"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
          {error && <p style={{ color: "var(--danger)", marginTop: 8, fontSize: "0.9rem" }}>{error}</p>}
          <div className="input-row">
            <button className="btn" onClick={() => { setMode(null); setError(""); }}>Back</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={!name.trim() || loading}>
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      )}

      {mode === "join" && (
        <div className="eb-box fade-in">
          <h3>Join a Room</h3>
          <input
            className="input"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <input
            className="input"
            style={{ marginTop: 12, fontFamily: "var(--font-display)", fontSize: "1.4rem", textAlign: "center", letterSpacing: 4, textTransform: "uppercase" }}
            placeholder="Room code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            maxLength={4}
          />
          {error && <p style={{ color: "var(--danger)", marginTop: 8, fontSize: "0.9rem" }}>{error}</p>}
          <div className="input-row">
            <button className="btn" onClick={() => { setMode(null); setError(""); }}>Back</button>
            <button className="btn btn-primary" onClick={handleJoin} disabled={!name.trim() || !code.trim() || loading}>
              {loading ? "Joining..." : "Join"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
PAGEEOF

# ── app/room/[code]/page.js ──
cat > "app/room/[code]/page.js" << 'ROOMEOF'
"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

const PHASES = ["lobby", "submit", "synthesizing", "guess", "report"];

export default function RoomPage() {
  const { code } = useParams();
  const [room, setRoom] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState(null);
  const [entries, setEntries] = useState({});
  const [submitTimer, setSubmitTimer] = useState(null);
  const [error, setError] = useState("");
  const timerRef = useRef(null);

  useEffect(() => {
    setPlayerId(sessionStorage.getItem("playerId"));
    setPlayerName(sessionStorage.getItem("playerName"));
  }, []);

  useEffect(() => {
    if (!playerId) return;
    let active = true;
    async function poll() {
      try {
        const res = await fetch(`/api/poll?code=${code}&playerId=${playerId}`);
        if (res.ok && active) {
          const data = await res.json();
          setRoom(data);
        }
      } catch {}
      if (active) setTimeout(poll, 2000);
    }
    poll();
    return () => { active = false; };
  }, [code, playerId]);

  useEffect(() => {
    if (room?.phase === "submit" && submitTimer === null) {
      setSubmitTimer(180);
    }
    if (room?.phase !== "submit") {
      setSubmitTimer(null);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [room?.phase]);

  useEffect(() => {
    if (submitTimer === null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSubmitTimer((t) => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [submitTimer !== null]);

  async function startSubmissions() {
    await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, playerId, entries: {}, startPhase: true }),
    });
  }

  async function handleSubmit() {
    setError("");
    const nonEmpty = {};
    for (const [name, power] of Object.entries(entries)) {
      if (power.trim()) nonEmpty[name] = power.trim();
    }
    if (Object.keys(nonEmpty).length === 0) {
      setError("Write at least one superpower!");
      return;
    }
    try {
      await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, playerId, entries: nonEmpty }),
      });
      setEntries({});
      setError("Submitted! You can keep adding more until time's up.");
    } catch {
      setError("Submit failed. Try again.");
    }
  }

  async function triggerSynthesis() {
    await fetch("/api/synthesize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
  }

  async function advanceReveal() {
    await fetch("/api/reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
  }

  if (!playerId || !room) {
    return (
      <div className="container" style={{ justifyContent: "center", alignItems: "center" }}>
        <p className="pulse" style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "var(--accent)" }}>
          Connecting to the cosmos...
        </p>
      </div>
    );
  }

  const phaseIdx = PHASES.indexOf(room.phase);
  const isFacilitator = room.isFacilitator;
  const otherPlayers = room.players.filter((p) => p.name !== playerName);

  return (
    <div className="container">
      <div className="phase-bar">
        {PHASES.map((p, i) => (
          <div key={p} className={`phase-dot ${i === phaseIdx ? "active" : i < phaseIdx ? "complete" : ""}`} />
        ))}
      </div>

      {room.phase === "lobby" && (
        <div className="fade-in">
          <div className="eb-box" style={{ textAlign: "center" }}>
            <p className="subtitle">Room Code</p>
            <div className="room-code">{room.code}</div>
            <p className="subtitle" style={{ marginTop: 8 }}>Share this code with your team</p>
          </div>
          <div className="eb-box">
            <h3>Players ({room.playerCount})</h3>
            <ul className="player-list">
              {room.players.map((p) => (
                <li key={p.name} className="player-chip">
                  {p.name} {p.name === room.facilitator ? "★" : ""}
                </li>
              ))}
            </ul>
          </div>
          {isFacilitator && (
            <div className="eb-box" style={{ textAlign: "center" }}>
              <p style={{ marginBottom: 12, color: "var(--text-dim)" }}>
                Once everyone&apos;s in, start the round.
              </p>
              <button className="btn btn-primary" onClick={startSubmissions} disabled={room.playerCount < 2}>
                ✦ Start Superpower Round ✦
              </button>
            </div>
          )}
          {!isFacilitator && (
            <div className="eb-box" style={{ textAlign: "center" }}>
              <p className="pulse" style={{ color: "var(--text-dim)" }}>
                Waiting for {room.facilitator} to start...
              </p>
            </div>
          )}
        </div>
      )}

      {room.phase === "submit" && (
        <div className="fade-in">
          <div className="eb-box" style={{ textAlign: "center" }}>
            <h2>⚡ Superpower Round ⚡</h2>
            <p className="subtitle">What superpower does each teammate have?</p>
            {submitTimer !== null && (
              <div className="timer" style={{ marginTop: 8 }}>
                {Math.floor(submitTimer / 60)}:{String(submitTimer % 60).padStart(2, "0")}
              </div>
            )}
          </div>
          <div className="eb-box">
            <div className="submit-grid">
              {otherPlayers.map((p) => (
                <div key={p.name} className="submit-row">
                  <span className="submit-name">{p.name}</span>
                  <input
                    className="input"
                    placeholder="Their superpower..."
                    value={entries[p.name] || ""}
                    onChange={(e) => setEntries({ ...entries, [p.name]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            {error && (
              <p style={{
                color: error.startsWith("Submitted") ? "var(--accent4)" : "var(--danger)",
                marginTop: 12, fontSize: "0.9rem", textAlign: "center"
              }}>{error}</p>
            )}
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button className="btn btn-primary" onClick={handleSubmit}>
                Submit Superpowers
              </button>
            </div>
          </div>
          {isFacilitator && (
            <div className="eb-box" style={{ textAlign: "center" }}>
              <p style={{ color: "var(--text-dim)", marginBottom: 12 }}>
                {room.submissionCount} of {room.playerCount} have submitted
              </p>
              <button className="btn btn-accent" onClick={triggerSynthesis}>
                ✦ Close & Synthesize ✦
              </button>
            </div>
          )}
        </div>
      )}

      {room.phase === "synthesizing" && (
        <div className="fade-in" style={{ textAlign: "center", marginTop: 60 }}>
          <div className="eb-box">
            <h2>🔮 The Oracle is Thinking...</h2>
            <p className="pulse subtitle" style={{ marginTop: 12 }}>
              Consulting the cosmic forces to reveal your team&apos;s superpowers...
            </p>
          </div>
        </div>
      )}

      {room.phase === "guess" && room.synthesis && (
        <div className="fade-in">
          <GuessPhase room={room} isFacilitator={isFacilitator} onAdvance={advanceReveal} />
        </div>
      )}

      {room.phase === "report" && room.synthesis && (
        <div className="fade-in">
          <div className="eb-box" style={{ textAlign: "center" }}>
            <h2>✦ Full Dossiers ✦</h2>
            <p className="subtitle">Everyone&apos;s superpower profiles, revealed.</p>
          </div>
          {room.players.map((p) => {
            const s = room.synthesis[p.name];
            if (!s) return null;
            return <ReportCard key={p.name} name={p.name} data={s} />;
          })}
        </div>
      )}
    </div>
  );
}

function GuessPhase({ room, isFacilitator, onAdvance }) {
  const idx = room.revealIndex;
  const showAnswer = room.revealShowAnswer;
  const players = room.players;
  const playerNames = players.map((p) => p.name);
  const currentName = playerNames[idx];
  const synth = room.synthesis[currentName];

  if (!synth) return null;

  return (
    <>
      <div className="eb-box" style={{ textAlign: "center" }}>
        <p className="subtitle">Person {idx + 1} of {players.length}</p>
        <div className="guess-prompt">Who is this?</div>
      </div>
      <div className="eb-box">
        <div className="haiku">{synth.haiku}</div>
      </div>
      {showAnswer && (
        <>
          <div className="eb-box fade-in" style={{ textAlign: "center" }}>
            <div className="reveal-name">✦ {currentName} ✦</div>
          </div>
          <div className="eb-box fade-in">
            <div className="horoscope-card">
              <h3 style={{ marginBottom: 12 }}>Q2 2026 Horoscope</h3>
              <p className="horoscope-reading">{synth.horoscope.reading}</p>
              <div className="lucky-items">
                <div className="lucky-item">
                  <div className="lucky-label">Lucky Color</div>
                  <div className="lucky-value">{synth.horoscope.lucky_color}</div>
                </div>
                <div className="lucky-item">
                  <div className="lucky-label">Lucky Item</div>
                  <div className="lucky-value">{synth.horoscope.lucky_item}</div>
                </div>
                <div className="lucky-item">
                  <div className="lucky-label">Lucky Food</div>
                  <div className="lucky-value">{synth.horoscope.lucky_food}</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {isFacilitator && (
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button className="btn btn-primary" onClick={onAdvance}>
            {!showAnswer ? "✦ Reveal Answer ✦" : idx + 1 < players.length ? "✦ Next Person ✦" : "✦ Show Full Report ✦"}
          </button>
        </div>
      )}
      {!isFacilitator && !showAnswer && (
        <div className="eb-box" style={{ textAlign: "center" }}>
          <p className="pulse" style={{ color: "var(--text-dim)" }}>
            Discuss with your team — who could this be?
          </p>
        </div>
      )}
    </>
  );
}

function ReportCard({ name, data }) {
  return (
    <div className="eb-box fade-in" style={{ marginTop: 16 }}>
      <div className="reveal-name">{name}</div>
      <div className="haiku" style={{ fontSize: "1.3rem" }}>{data.haiku}</div>
      <div className="horoscope-card">
        <h3 style={{ marginBottom: 8 }}>Q2 2026 Horoscope</h3>
        <p className="horoscope-reading">{data.horoscope.reading}</p>
        <div className="lucky-items">
          <div className="lucky-item">
            <div className="lucky-label">Lucky Color</div>
            <div className="lucky-value">{data.horoscope.lucky_color}</div>
          </div>
          <div className="lucky-item">
            <div className="lucky-label">Lucky Item</div>
            <div className="lucky-value">{data.horoscope.lucky_item}</div>
          </div>
          <div className="lucky-item">
            <div className="lucky-label">Lucky Food</div>
            <div className="lucky-value">{data.horoscope.lucky_food}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
ROOMEOF

# ── API Routes ──

cat > app/api/rooms/route.js << 'EOF'
import { createRoom } from "@/lib/store";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const room = await createRoom(name.trim());
  const player = room.players[0];
  return NextResponse.json({ code: room.code, playerId: player.id });
}
EOF

cat > app/api/join/route.js << 'EOF'
import { joinRoom } from "@/lib/store";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { code, name } = await req.json();
  if (!code?.trim() || !name?.trim()) {
    return NextResponse.json({ error: "Code and name required" }, { status: 400 });
  }
  const result = await joinRoom(code.trim(), name.trim());
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ code: result.room.code, playerId: result.player.id });
}
EOF

cat > app/api/submit/route.js << 'EOF'
import { submitSuperpowers, setPhase } from "@/lib/store";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { code, playerId, entries, startPhase } = await req.json();
  if (startPhase) {
    await setPhase(code, "submit");
    return NextResponse.json({ ok: true });
  }
  const result = await submitSuperpowers(code, playerId, entries);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
EOF

cat > app/api/synthesize/route.js << 'SYNTHEOF'
import { getRoom, getSuperpowersForPlayer, updateRoom } from "@/lib/store";
import { buildSynthesisPrompt } from "@/lib/prompts";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { code } = await req.json();
  const room = await getRoom(code);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  // Set synthesizing phase
  await updateRoom(code, (r) => { r.phase = "synthesizing"; });

  const synthesis = {};

  for (const player of room.players) {
    const powers = getSuperpowersForPlayer(room, player.name);
    if (powers.length === 0) {
      synthesis[player.name] = {
        haiku: "A quiet mystery\nNo words yet given to share\nPotential awaits",
        horoscope: {
          reading: "The stars sense untapped potential. Q2 holds surprises for those who listen.",
          lucky_color: "invisible indigo",
          lucky_item: "an unopened envelope",
          lucky_food: "a fortune cookie with a blank fortune",
        },
      };
      continue;
    }

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: buildSynthesisPrompt(player.name, powers) }],
        }),
      });

      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      synthesis[player.name] = JSON.parse(clean);
    } catch (err) {
      console.error(`Synthesis failed for ${player.name}:`, err);
      synthesis[player.name] = {
        haiku: "Cosmic static hums\nThe oracle needs a nap\nTry again later",
        horoscope: {
          reading: "The stars are buffering. Your Q2 is too powerful to summarize.",
          lucky_color: "error-message red",
          lucky_item: "a rubber duck for debugging",
          lucky_food: "cold pizza at 2am",
        },
      };
    }
  }

  // Write everything in one atomic update
  await updateRoom(code, (r) => {
    r.synthesis = synthesis;
    r.phase = "guess";
    r.revealIndex = 0;
    r.revealShowAnswer = false;
  });

  return NextResponse.json({ ok: true });
}
SYNTHEOF

cat > app/api/reveal/route.js << 'EOF'
import { advanceReveal } from "@/lib/store";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { code } = await req.json();
  const room = await advanceReveal(code);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  return NextResponse.json({ ok: true, phase: room.phase });
}
EOF

cat > app/api/poll/route.js << 'EOF'
import { getRoomState } from "@/lib/store";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const playerId = searchParams.get("playerId");
  const state = await getRoomState(code, playerId);
  if (!state) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  return NextResponse.json(state);
}
EOF

# ── Create empty public dir (Next.js expects it) ──
mkdir -p public

# ── Done! ──
echo ""
echo "✦ Superpower Spotlight created! ✦"
echo ""
echo "Next steps:"
echo ""
echo "  cd $PROJECT"
echo "  npm install"
echo ""
echo "  # Edit .env.local with your keys:"
echo "  #   ANTHROPIC_API_KEY=sk-ant-..."
echo "  #   UPSTASH_REDIS_REST_URL=https://..."
echo "  #   UPSTASH_REDIS_REST_TOKEN=..."
echo ""
echo "  npm run dev"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Deploy to Railway:"
echo "  1. Push to GitHub"
echo "  2. railway.app → New Project → Deploy from GitHub"
echo "  3. Add env vars in Railway dashboard"
echo "  4. Railway auto-detects the Dockerfile"
echo ""
echo "  Deploy to Vercel:"
echo "  1. Push to GitHub"
echo "  2. vercel.com → Import → select repo"
echo "  3. Add env vars in Vercel dashboard"
echo "  4. Deploy!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
