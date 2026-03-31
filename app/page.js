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
