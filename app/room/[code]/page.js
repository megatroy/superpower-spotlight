"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

const PHASES = ["lobby", "submit", "synthesizing", "guess", "report"];

function shuffle(arr, seed) {
  const copy = [...arr];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = s % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

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
  const seed = (playerName || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const otherPlayers = shuffle(room.players.filter((p) => p.name !== playerName), seed);

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
          <RawNotes powers={synth.rawPowers} />
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
      <RawNotes powers={data.rawPowers} />
    </div>
  );
}

function RawNotes({ powers }) {
  if (!powers || powers.length === 0) return null;
  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(240, 192, 64, 0.2)" }}>
      <h3 style={{ fontSize: "1.2rem", marginBottom: 8 }}>Raw Notes</h3>
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
        {powers.map((p, i) => (
          <li key={i} className="power-tag" style={{ display: "block", textAlign: "left" }}>
            &ldquo;{p}&rdquo;
          </li>
        ))}
      </ul>
    </div>
  );
}
