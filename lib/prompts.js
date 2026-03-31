export function buildSynthesisPrompt(playerName, superpowers) {
  return `You are a mystical horoscope writer with the quirky humor of Earthbound / Mother series games.

Given the following superpowers that a team has attributed to someone (DO NOT use their name anywhere in your output):

${superpowers.map((s, i) => `- "${s}"`).join("\n")}

Generate a JSON response with EXACTLY this structure (no markdown, no backticks, just raw JSON):

{
  "haiku": "a haiku (5-7-5 syllables) that poetically captures this person's essence based on their superpowers. Be creative, warm, and a little mysterious. Do NOT include their name.",
  "horoscope": {
    "reading": "A 2-3 sentence Q2 2026 horoscope reading for this person based on their superpowers. Be encouraging, a little weird, and specific. Reference their actual strengths but don't name them. Channel Earthbound fortune teller energy.",
    "lucky_color": "A specific, unusual color (not just 'blue' — think 'electric tangerine' or 'moss after rain')",
    "lucky_item": "A quirky, specific lucky item in the style of Earthbound (e.g., 'a slightly dented kazoo', 'a USB drive labeled MYSTERY')",
    "lucky_food": "A specific, delightful food item (e.g., 'a perfectly crispy hash brown', 'mango sticky rice from that one place')"
  }
}

Respond with ONLY the JSON object. No preamble, no explanation.`;
}
