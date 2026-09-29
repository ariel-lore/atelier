import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canSeePrivateProfileField, canView } from "./privacy";

const owner = { id: "owner", role: "OWNER", circleIds: [] as string[] };
const family = { id: "alex", role: "MEMBER", circleIds: ["family"] };
const close = { id: "sam", role: "MEMBER", circleIds: ["close"] };
const both = { id: "both", role: "MEMBER", circleIds: ["family", "close"] };
const stranger = { id: "jo", role: "MEMBER", circleIds: [] as string[] };

const publicPost = { authorId: "owner", audience: "PUBLIC", circleIds: [] as string[] };
const familyPost = { authorId: "owner", audience: "CIRCLES", circleIds: ["family"] };
const closePost = { authorId: "owner", audience: "CIRCLES", circleIds: ["close"] };
const eitherPost = { authorId: "owner", audience: "CIRCLES", circleIds: ["family", "close"] };
const privatePost = { authorId: "owner", audience: "PRIVATE", circleIds: [] as string[] };

describe("canView", () => {
  it("shows public posts to everyone", () => {
    assert.equal(canView(null, publicPost), true);
    assert.equal(canView(stranger, publicPost), true);
  });

  it("hides circle and private posts from logged-out visitors", () => {
    assert.equal(canView(null, familyPost), false);
    assert.equal(canView(null, closePost), false);
    assert.equal(canView(null, privatePost), false);
  });

  it("lets a family member see family posts and nothing from other circles", () => {
    assert.equal(canView(family, publicPost), true);
    assert.equal(canView(family, familyPost), true);
    assert.equal(canView(family, closePost), false);
    assert.equal(canView(family, privatePost), false);
  });

  it("lets close friends see only their circle", () => {
    assert.equal(canView(close, closePost), true);
    assert.equal(canView(close, familyPost), false);
    assert.equal(canView(close, privatePost), false);
  });

  it("treats multi-circle posts as visible to any listed circle", () => {
    assert.equal(canView(family, eitherPost), true);
    assert.equal(canView(close, eitherPost), true);
    assert.equal(canView(stranger, eitherPost), false);
  });

  it("lets someone in both circles see both", () => {
    assert.equal(canView(both, familyPost), true);
    assert.equal(canView(both, closePost), true);
  });

  it("lets the owner see private posts", () => {
    assert.equal(canView(owner, privatePost), true);
    assert.equal(canView(owner, closePost), true);
  });

  it("does not treat an empty circle list as public", () => {
    assert.equal(canView(family, { authorId: "owner", audience: "CIRCLES", circleIds: [] }), false);
  });
});

describe("profile field visibility", () => {
  it("shows public fields to visitors and hides private ones", () => {
    assert.equal(canSeePrivateProfileField(null, "owner", true), true);
    assert.equal(canSeePrivateProfileField(null, "owner", false), false);
    assert.equal(canSeePrivateProfileField(family, "owner", false), false);
    assert.equal(canSeePrivateProfileField(owner, "owner", false), true);
  });
});
