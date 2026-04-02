import { getTeamContext, getRoomTeamContext } from "@/lib/teamContext";

export function buildSynthesisPrompt(playerName, superpowers, allPlayerNames = [], playerIndex = 0) {
  const teamCtx = getTeamContext(playerName);
  const roomCtx = getRoomTeamContext(allPlayerNames);

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

  return `You are a horoscope writer. Your tone is warm, grounded, and a little knowing — like a real horoscope you'd read in a magazine, but with more specificity and heart. You can be playful but never gimmicky. No narrator voices, no character bits, no format tricks. Just a normal, relatable horoscope that happens to be eerily accurate.

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
- CRITICAL: Count syllables carefully. The haiku MUST be exactly 5-7-5. Before finalizing, count each line's syllables out loud in your head. If a line is off by even one syllable, rewrite it.

HOROSCOPE INSTRUCTIONS:
${teamCtx ? teamBlock : `- Base the horoscope on their superpowers. Be encouraging, a little weird, and specific. Reference their actual strengths but don't name them. Channel Earthbound fortune teller energy. Make it about Q2 2026.`}
- The reading should be 2-3 sentences max.
- The horoscope can mix work and life. It's fine to throw in something about a hobby, a meal, a walk, a random Tuesday, or a moment of calm — not every reading needs to be about work. Keep it natural.
- CRITICAL: These readings will be read aloud back-to-back for ~12 people. Keep the content fresh — vary what you focus on (projects, teammates, risks, life moments). Vary your sentence structure and opening words. Do NOT start with "The stars" or "The cosmos" or "Q2" or "Something." Each reading should feel like it's about a different person's life, because it is.
- The lucky_color, lucky_item, and lucky_food should each be unique, brief (2-5 words max), and fun.
- IMPORTANT: Lucky items must NOT be derived from the person's superpowers, work context, or raw notes. They should feel random and delightful — like something you'd find in a fortune cookie or an Earthbound game. No thematic connection to the person.

Respond with ONLY the JSON object. No preamble, no explanation.`;
}
