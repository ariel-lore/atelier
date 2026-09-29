import { spawnSync } from "node:child_process";
import { constants, copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(scriptDir, "..");

/**
 * Copy `.env.example` to `.env` only when `.env` is absent.
 * An existing file is never overwritten, including if it appears between the check and the copy.
 * @returns {"kept" | "created"}
 */
export function ensureEnvFile(rootDir) {
  const dest = path.join(rootDir, ".env");
  const src = path.join(rootDir, ".env.example");
  if (existsSync(dest)) {
    console.log("Using existing .env (left unchanged).");
    return "kept";
  }
  if (!existsSync(src)) {
    throw new Error(`Missing ${src}. Cannot create .env.`);
  }
  try {
    copyFileSync(src, dest, constants.COPYFILE_EXCL);
  } catch (err) {
    if (err && err.code === "EEXIST") {
      console.log("Using existing .env (left unchanged).");
      return "kept";
    }
    throw err;
  }
  console.log("Created .env from .env.example.");
  return "created";
}

function run(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) throw result.error;
  const status = result.status ?? 1;
  if (status !== 0) process.exit(status);
}

function invokedDirectly() {
  const entry = process.argv[1];
  if (!entry) return false;
  return path.resolve(entry) === fileURLToPath(import.meta.url);
}

if (invokedDirectly()) {
  ensureEnvFile(repoRoot);
  const prisma = path.join(repoRoot, "node_modules", "prisma", "build", "index.js");
  run([prisma, "migrate", "deploy"]);
  run([prisma, "generate"]);
  if (process.argv.includes("--seed")) {
    const tsx = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
    run([tsx, "prisma/seed.ts"]);
  }
}
