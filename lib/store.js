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
