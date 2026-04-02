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
  const allPlayerNames = room.players.map((p) => p.name);

  for (let i = 0; i < room.players.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 1000));
    const player = room.players[i];
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
        rawPowers: [],
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
          max_tokens: 1500,
          messages: [{ role: "user", content: buildSynthesisPrompt(player.name, powers, allPlayerNames, i) }],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(`Claude API error for ${player.name}: ${res.status}`, JSON.stringify(data));
        throw new Error(`API ${res.status}: ${data.error?.message || "Unknown error"}`);
      }

      const text = data.content?.[0]?.text || "";
      // Escape unescaped control chars inside JSON string values
      const clean = text
        .replace(/```json|```/g, "")
        .trim()
        .replace(/"(?:[^"\\]|\\.)*"/g, (match) =>
          match.replace(/[\x00-\x1f]/g, (ch) => {
            const map = { '\n': '\\n', '\r': '\\r', '\t': '\\t' };
            return map[ch] || '';
          })
        );
      const parsed = JSON.parse(clean);
      parsed.rawPowers = powers;
      synthesis[player.name] = parsed;
    } catch (err) {
      console.error(`Synthesis failed for ${player.name}:`, err.message || err);
      synthesis[player.name] = {
        haiku: "Cosmic static hums\nThe oracle needs a nap\nTry again later",
        horoscope: {
          reading: "The stars are buffering. Your Q2 is too powerful to summarize.",
          lucky_color: "error-message red",
          lucky_item: "a rubber duck for debugging",
          lucky_food: "cold pizza at 2am",
        },
        rawPowers: powers,
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
