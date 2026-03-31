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
