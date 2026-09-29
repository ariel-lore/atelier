import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { ensureEnvFile } from "./ensure-db.mjs";

test("does not overwrite an existing .env", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "atelier-env-"));
  try {
    writeFileSync(path.join(dir, ".env.example"), 'DATABASE_URL="file:./example.db"\n');
    const original = 'DATABASE_URL="file:./mine.db"\nKEEP=1\n';
    writeFileSync(path.join(dir, ".env"), original);
    assert.equal(ensureEnvFile(dir), "kept");
    assert.equal(readFileSync(path.join(dir, ".env"), "utf8"), original);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("copies .env.example when .env is missing and leaves a later edit in place", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "atelier-env-"));
  try {
    const example = 'DATABASE_URL="file:./dev.db"\n';
    writeFileSync(path.join(dir, ".env.example"), example);
    assert.equal(ensureEnvFile(dir), "created");
    assert.equal(readFileSync(path.join(dir, ".env"), "utf8"), example);
    const edited = `${example}MARKER=1\n`;
    writeFileSync(path.join(dir, ".env"), edited);
    assert.equal(ensureEnvFile(dir), "kept");
    assert.equal(readFileSync(path.join(dir, ".env"), "utf8"), edited);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
