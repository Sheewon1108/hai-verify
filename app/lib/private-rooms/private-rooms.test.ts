import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { decryptJson, encryptJson, hashPassphrase, randomBytes, timingSafeEqual, unbiasedIndex } from "./crypto.ts";
import { configuredSeats, needsSetup, setupSeats, verifySeatPassphrase } from "./seats.ts";
import { signSession, verifySession } from "./session.ts";
import {
  addEntry,
  addSlip,
  deleteEntry,
  drawSlip,
  listEntries,
  replaceState,
} from "./store.ts";
import { PRIVATE_ROOM_TRACE_LIMITS } from "./traces.ts";
import { emptyPrivateRoomsState } from "./types.ts";

const dir = mkdtempSync(path.join(tmpdir(), "private-rooms-"));

describe("private-rooms", { concurrency: 1 }, () => {
before(() => {
  process.env.PRIVATE_ROOMS_DIR = dir;
  process.env.PRIVATE_ROOMS_SESSION_SECRET = "test-session-secret-value";
  process.env.PRIVATE_ROOMS_STORE_SECRET = "test-store-secret-value";
  delete process.env.PRIVATE_ROOMS_OWNER_PASS;
  delete process.env.PRIVATE_ROOMS_EM_PASS;
});

after(() => {
  rmSync(dir, { recursive: true, force: true });
});

test("encrypt/decrypt roundtrip and wrong key fails", async () => {
  const packed = await encryptJson("alpha-secret", { hello: "낙서" });
  const out = await decryptJson<{ hello: string }>("alpha-secret", packed);
  assert.equal(out.hello, "낙서");
  await assert.rejects(() => decryptJson("wrong-secret", packed));
});

test("session sign/verify and expiry", async () => {
  const token = await signSession("sess", "owner", 1_000);
  const ok = await verifySession("sess", token, 2_000);
  assert.equal(ok?.seat, "owner");
  const expired = await verifySession("sess", token, 1_000 + 13 * 60 * 60 * 1000);
  assert.equal(expired, null);
  const bad = await verifySession("other", token, 2_000);
  assert.equal(bad, null);
});

test("two-seat setup and passphrase check", async () => {
  assert.equal(await needsSetup(), true);
  const created = await setupSeats("owner-pass-12", "em-pass-word");
  assert.equal(created.ok, true);
  assert.deepEqual(await configuredSeats(), ["owner", "em"]);
  assert.equal(await verifySeatPassphrase("owner", "owner-pass-12"), "owner");
  assert.equal(await verifySeatPassphrase("em", "em-pass-word"), "em");
  assert.equal(await verifySeatPassphrase("owner", "nope-nope-nope"), null);
  assert.equal(await verifySeatPassphrase("visitor", "owner-pass-12"), null);
  const again = await setupSeats("owner-pass-12", "em-pass-word");
  assert.equal(again.ok, false);
});

test("diary and bokbulbok stay separate; draw uses slips", async () => {
  await replaceState(emptyPrivateRoomsState());
  await addEntry("diary", "오늘 낙서", "owner");
  await addEntry("bokbulbok", "복불복 메모", "em");
  const diary = await listEntries("diary");
  const notes = await listEntries("bokbulbok");
  assert.equal(diary.length, 1);
  assert.equal(diary[0].body, "오늘 낙서");
  assert.equal(notes[0].body, "복불복 메모");
  await addSlip("사과", "owner");
  await addSlip("배", "em");
  const draw = await drawSlip("owner", () => 0);
  assert.ok(["사과", "배"].includes(draw.text));
  assert.equal(await deleteEntry("diary", diary[0].id), true);
  assert.equal((await listEntries("diary")).length, 0);
});

test("passphrase hash is salted; timingSafeEqual length-safe", async () => {
  const salt = randomBytes(16);
  const a = await hashPassphrase("same-pass-10", salt);
  const b = await hashPassphrase("same-pass-10", salt);
  assert.equal(a, b);
  assert.equal(timingSafeEqual("abc", "ab"), false);
  assert.equal(timingSafeEqual("abc", "abc"), true);
});

test("unbiasedIndex stays in range", () => {
  for (let i = 0; i < 40; i++) {
    const n = unbiasedIndex(3);
    assert.ok(n >= 0 && n < 3);
  }
});

test("trace catalog splits effort vs impossible", () => {
  const possible = PRIVATE_ROOM_TRACE_LIMITS.filter((item) => item.possible);
  const impossible = PRIVATE_ROOM_TRACE_LIMITS.filter((item) => !item.possible);
  assert.ok(possible.length >= 4);
  assert.ok(impossible.length >= 4);
  assert.ok(possible.some((item) => item.id === "no-google-sms"));
  assert.ok(impossible.some((item) => item.id === "zero-trace"));
});
});
