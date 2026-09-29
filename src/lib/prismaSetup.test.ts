import assert from "node:assert/strict";
import test from "node:test";
import type { PrismaClient } from "@prisma/client";
import { assertHighlightClient, PrismaSetupError, rethrowSetupError } from "./prismaSetup";

test("assertHighlightClient explains a missing Highlight delegate", () => {
  assert.throws(() => assertHighlightClient({} as PrismaClient), PrismaSetupError);
});

test("rethrowSetupError names a missing Highlight table", () => {
  assert.throws(() => rethrowSetupError({ code: "P2021" }), (err: unknown) => {
    assert.ok(err instanceof PrismaSetupError);
    assert.match(err.message, /Highlight table/);
    return true;
  });
});
