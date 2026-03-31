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
