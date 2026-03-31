import { advanceReveal } from "@/lib/store";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { code } = await req.json();
  const room = await advanceReveal(code);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  return NextResponse.json({ ok: true, phase: room.phase });
}
