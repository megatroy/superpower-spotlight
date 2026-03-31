import { createRoom } from "@/lib/store";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const room = await createRoom(name.trim());
  const player = room.players[0];
  return NextResponse.json({ code: room.code, playerId: player.id });
}
