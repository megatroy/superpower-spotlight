import { getTeamContext, getRoomTeamContext } from "@/lib/teamContext";

// Different tonal angles to keep 12 back-to-back readings feeling fresh
const TONE_ANGLES = [
  "Write this like a fortune cookie that went to grad school. Dry wit, surprising specificity.",
  "Channel a wise but slightly unhinged Earthbound NPC who's seen the future and is weirdly calm about it.",
  "Write this like a nature documentary narrator observing a rare creature in its habitat. Reverent but amused.",
  "Write this like a cryptic message found inside an old video game cartridge. Mysterious, warm, a little glitchy.",
  "Write this like a horoscope from a newspaper that only exists in a dream. Oddly specific, gently surreal.",
  "Write this like advice from a sentient vending machine that dispenses wisdom instead of snacks.",
  "Write this like a telegram from the future. Urgent but optimistic. Slightly breathless.",
  "Write this like a coach's halftime pep talk, but the coach is a wizard and the game is interdimensional.",
  "Write this like a field report from a benevolent alien studying human potential. Clinical but affectionate.",
  "Write this like the closing monologue of an anime episode. Reflective, building toward something big.",
  "Write this like a letter from a time traveler who already knows how the quarter ends. Cryptically encouraging.",
  "Write this like a weather forecast for someone's soul. Partly cloudy with a chance of breakthroughs.",
  "Write this like a review of this person's Q2 written by a food critic. Unexpected metaphors, strong opinions.",
  "Write this like a ship captain's log entry about a crew member who's about to save the voyage.",
  "Write this like a museum placard describing a legendary artifact — except the artifact is this person's energy.",
];

export function buildSynthesisPrompt(playerName, superpowers, allPlayerNames = [], playerIndex = 0) {
  const teamCtx = getTeamContext(playerName);
  const roomCtx = getRoomTeamContext(allPlayerNames);
  const tone = TONE_ANGLES[playerIndex % TONE_ANGLES.length];

  // Build the team context block for the horoscope
  let teamBlock = "";
  if (teamCtx) {
    const teammatesInRoom = roomCtx
      .filter((m) => m.name.toLowerCase() !== playerName.trim().split(/\s+/)[0].toLowerCase())
      .map((m) => `${m.name} (${m.team}, ${m.role})`)
      .join(", ");

    if (teamCtx.crossTeam) {
      teamBlock = `
IMPORTANT CONTEXT FOR THE HOROSCOPE (use this to make it personal and specific — but keep it fun and mystical):
This person works across teams as ${teamCtx.role}.
Here's what the teams around them are up to in Q2 2026:
${teamCtx.projects.map((p) => `- ${p}`).join("\n")}
Challenges across the org: ${teamCtx.risks.join("; ")}.
Their role: ${teamCtx.narrative}
People they work closely with: ${teamCtx.teammates.join(", ")}.
${teammatesInRoom ? `Other people in this room from the org: ${teammatesInRoom}.` : ""}

Use this context to make the horoscope feel personal — reference the TEAMS and their big themes rather than specific project names or deliverables. Frame team dynamics and cross-team energy in a mystical way. Name-drop a teammate or two naturally. The person should read this and think "wow, that captures the vibe of what's happening around me."
`;
    } else {
      teamBlock = `
IMPORTANT CONTEXT FOR THE HOROSCOPE (use this to make it personal and specific — but keep it fun and mystical):
This person works on the ${teamCtx.team} team as ${teamCtx.role}.
Their key Q2 2026 projects: ${teamCtx.projects.join("; ")}.
Key risks they're navigating: ${teamCtx.risks.join("; ")}.
Team narrative: ${teamCtx.narrative}
Their teammates: ${teamCtx.teammates.join(", ")}.
${teammatesInRoom ? `Other people in this room from the org: ${teammatesInRoom}.` : ""}

Use this context to make the horoscope feel deeply personal — reference specific projects, risks, or dynamics in a playful, mystical way. Mention a project as if the stars foretold it, or frame a risk as a cosmic challenge to overcome. Name-drop a teammate or two naturally. Be specific, not generic. The person should read this and think "wow, that's actually about MY work."
`;
    }
  }

  return `You are a mystical horoscope writer with the quirky humor of Earthbound / Mother series games.

TONE FOR THIS READING: ${tone}

Given the following superpowers that a team has attributed to someone (DO NOT use their name anywhere in your output):

${superpowers.map((s) => `- "${s}"`).join("\n")}

Generate a JSON response with EXACTLY this structure (no markdown, no backticks, just raw JSON):

{
  "haiku": "a haiku (5-7-5 syllables) that poetically captures this person's essence based on their superpowers. Be creative, warm, and a little mysterious. Do NOT include their name.",
  "horoscope": {
    "reading": "A 2-3 sentence Q2 2026 horoscope reading. See instructions below.",
    "lucky_color": "Brief, unusual color (2-4 words, e.g., 'electric tangerine', 'moss after rain', 'static gray')",
    "lucky_item": "Brief, quirky Earthbound item (2-5 words, e.g., 'dented kazoo', 'mystery USB drive', 'slightly warm penny')",
    "lucky_food": "Brief, fun food (1-3 words, e.g., 'curly fries', 'cold pizza', 'hamburger hot pocket')"
  }
}

HAIKU INSTRUCTIONS:
- Base the haiku ONLY on the superpowers their teammates attributed to them above.
- Be poetic, warm, and a little mysterious. Do NOT include their name.

HOROSCOPE INSTRUCTIONS:
${teamCtx ? teamBlock : `- Base the horoscope on their superpowers. Be encouraging, a little weird, and specific. Reference their actual strengths but don't name them. Channel Earthbound fortune teller energy. Make it about Q2 2026.`}
- The reading should be 2-3 sentences max.
- The horoscope can mix work and life. It's fine to throw in something about a hobby, a meal, a walk, a random Tuesday, or a moment of calm — not every reading needs to be about work. Keep it natural.
- CRITICAL: These readings will be read aloud back-to-back for ~12 people. Each one MUST feel distinct. Vary your sentence structure, opening words, rhythm, and imagery. Do NOT start with "The stars" or "The cosmos" or "Q2." Surprise us.
- The lucky_color, lucky_item, and lucky_food should each be unique, brief (2-5 words max), and fun.

Respond with ONLY the JSON object. No preamble, no explanation.`;
}
