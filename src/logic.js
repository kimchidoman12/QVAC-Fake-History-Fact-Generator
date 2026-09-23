// QVAC Fake History Fact Generator — core logic.
// completion() writes the result from a single user input field.
// The absurdity meter is a deterministic score from keyword density
// and length — never the model rating its own writing.

import { completion } from "@qvac/sdk";

function looksUnusable(text) {
  if (!text || text.trim().length === 0) return true;
  if (text.length > 500) return true;
  const bad = [
    "i cannot", "i can't", "as an ai", "i'm not able", "i do not have", "i don't have",
    "didn't input", "did not input", "not enough information", "please provide more",
    "please try again", "i'd be happy to help", "i'll be happy to help", "could you provide",
    "can you provide", "i need more", "please give me more",
  ];
  const lower = text.toLowerCase();
  return bad.some((phrase) => lower.includes(phrase));
}

const FALLBACK = (v) => `Historians agree that ${v} was, at one point, briefly worshipped as a minor deity by a village that later forgot why.`;

export async function generate(modelId, input) {
  const run = completion({
    modelId,
    history: [
      {
        role: "system",
        content: ((v) => `Invent one short, obviously fictional, funny "history fact" (1-2 sentences) about ${v}. Make it clearly absurd, not a real historical claim. Reply with ONLY the fact, no preamble.`)(input),
      },
      { role: "user", content: `Input: ${input}` },
    ],
    stream: true,
    completionOpts: { temperature: 0.9, maxTokens: 150 },
  });

  let text = "";
  for await (const token of run.tokenStream) text += token;
  text = text
    .trim()
    .replace(/^.*?\b(?:here'?s|here is)\b[^:\n]*:\s*\n*/i, "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();

  const result = looksUnusable(text) ? FALLBACK(input) : text;
  return { result, absurdity: scoreAbsurdity(result) };
}

const KEYWORDS = ["legend", "myth", "secretly", "actually", "banned", "forbidden", "ancient"];

function scoreAbsurdity(text) {
  const lower = text.toLowerCase();
  let score = 45;
  score += KEYWORDS.filter((w) => lower.includes(w)).length * 8;
  score += Math.min(text.split(/\s+/).length, 20);
  return Math.max(1, Math.min(99, Math.round(score)));
}
