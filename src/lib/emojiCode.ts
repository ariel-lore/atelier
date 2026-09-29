import { randomInt } from "crypto";

const ADJECTIVES = [
  "soft", "quiet", "golden", "linen", "coastal", "slow", "warm", "pale",
  "gentle", "amber", "misty", "small", "late", "early", "calm", "silver",
  "honey", "faint", "still", "bright", "dusty", "clear", "low", "wild",
  "tender", "plain", "loose", "cool", "sunny", "rainy", "tiny", "open",
];

const NOUNS = [
  "peaches", "notebook", "window", "studio", "trail", "kettle", "linen",
  "harbor", "sketch", "market", "seawall", "espresso", "lamp", "tide",
  "folder", "porch", "orchard", "ferry", "blanket", "pencil", "saucer",
  "garden", "attic", "camera", "pocket", "letter", "ceramic", "shadow",
  "meadow", "bridge", "kitchen", "Sunday",
];

const VERBS = [
  "waiting", "keeping", "folding", "leaving", "finding", "holding",
  "sketching", "carrying", "noting", "brewing", "watching", "setting",
  "gathering", "opening", "resting", "tracing",
];

const PLACES = [
  "the studio", "the window", "the trail", "the kitchen", "the seawall",
  "the porch", "the harbor", "the desk", "the garden", "the ferry",
  "the market", "the attic",
];

const TIMES = [
  "before thursday", "after rain", "at golden hour", "before coffee",
  "on sunday", "near dusk", "just after dawn", "this evening",
];

const EMOJIS = [
  "🌙", "🌿", "☕️", "🍑", "🌊", "✨", "🍋", "📷", "🪟", "🕯️",
  "📒", "🌤️", "🪨", "🍵", "🌼", "🍂", "🕊️", "🍯", "📻", "🧺",
];

function pick<T>(items: readonly T[]): T {
  return items[randomInt(items.length)];
}

/**
 * A casual emoji phrase with a large combination space.
 * 32*32*20*16*12*8 * 20^2 ≈ 2.5e12 possibilities (~41 bits), and it reads
 * like a caption rather than a token.
 *
 * Example: "quiet peaches 🍑 waiting 🌙 beside the studio before coffee"
 */
export function generateEmojiSentence(): string {
  const adj = pick(ADJECTIVES);
  const noun = pick(NOUNS);
  const verb = pick(VERBS);
  const place = pick(PLACES);
  const time = pick(TIMES);
  const e1 = pick(EMOJIS);
  const e2 = pick(EMOJIS);
  return `${adj} ${noun} ${e1} ${verb} ${e2} beside ${place} ${time}`;
}

export function looksLikeEmojiSentence(code: string): boolean {
  const emoji = /\p{Extended_Pictographic}/u;
  const matches = code.match(new RegExp(emoji, "gu")) ?? [];
  return code.length >= 12 && code.length <= 160 && matches.length >= 2 && code.includes(" ");
}
