import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { emptyVault, resetPrivateRoomStoreForTests, upsertNote, useMemoryStoreForTests } from "./store";
import { authenticateSeat, resetLoginAttemptsForTests, setupVault } from "./auth";

afterEach(() => {
  resetPrivateRoomStoreForTests();
  resetLoginAttemptsForTests();
});

test("memory vault keeps encrypted notes for both rooms", () => {
  useMemoryStoreForTests(emptyVault());
  const vault = emptyVault();
  const withNote = upsertNote(vault, {
    id: "n1",
    room: "nakseo",
    seat: "owner",
    kind: "note",
    createdAt: "2026-08-28T00:00:00.000Z",
    updatedAt: "2026-08-28T00:00:00.000Z",
    iv: "iv",
    ciphertext: "ct",
  });
  assert.equal(withNote.notes.length, 1);
  assert.equal(withNote.notes[0]?.room, "nakseo");
});

test("setup then login with owner or shared seat", async () => {
  useMemoryStoreForTests(emptyVault());
  await setupVault({ passphrase: "owner-key-ok" });
  const owner = await authenticateSeat("owner-key-ok", "owner");
  const partnerSeat = await authenticateSeat("owner-key-ok", "partner");
  assert.equal(owner?.seat, "owner");
  assert.equal(partnerSeat?.seat, "partner");
  assert.equal(await authenticateSeat("bad-key--", "owner"), null);
});

test("distinct partner key maps only to partner seat", async () => {
  useMemoryStoreForTests(emptyVault());
  await setupVault({ passphrase: "owner-key-ok", partnerPassphrase: "partner-key" });
  const partner = await authenticateSeat("partner-key", "owner");
  assert.equal(partner?.seat, "partner");
  assert.equal((await authenticateSeat("owner-key-ok", "partner"))?.seat, "partner");
});
