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
