import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateEmojiSentence, looksLikeEmojiSentence } from "./emojiCode";

describe("emoji sentence", () => {
  it("reads like a short phrase and includes more than one emoji", () => {
    const code = generateEmojiSentence();
    assert.equal(looksLikeEmojiSentence(code), true);
    assert.equal(code.includes("beside"), true);
  });

  it("is not a fixed token", () => {
    const a = new Set<string>();
    for (let i = 0; i < 20; i++) a.add(generateEmojiSentence());
    assert.ok(a.size > 10);
  });
});
