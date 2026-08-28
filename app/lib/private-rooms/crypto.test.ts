import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomBytes } from "./bytes";
import { decryptText, deriveVaultKey, encryptText, verifyPassphrase } from "./crypto";
import { resetPrivateRoomStoreForTests } from "./store";

after(() => {
  resetPrivateRoomStoreForTests();
});

test("encrypt and decrypt with the vault key", async () => {
  const salt = randomBytes(16);
  const key = await deriveVaultKey("room-key-for-tests", salt, 16);
  const packed = await encryptText(key, "낙서 본문");
  assert.notEqual(packed.ciphertext, "낙서 본문");
  assert.equal(await decryptText(key, packed.iv, packed.ciphertext), "낙서 본문");
});

test("wrong passphrase cannot open ciphertext", async () => {
  const salt = randomBytes(16);
  const key = await deriveVaultKey("correct-key-ok", salt, 16);
  const packed = await encryptText(key, "secret-note");
  const other = await deriveVaultKey("wrong-key-xxxx", salt, 16);
  await assert.rejects(() => decryptText(other, packed.iv, packed.ciphertext));
});

test("passphrase hash verifies in constant-length compare", async () => {
  const salt = randomBytes(16);
  const { hashPassphrase } = await import("./crypto");
  const hash = await hashPassphrase("same-pass-phrase", salt, 16);
  assert.equal(await verifyPassphrase("same-pass-phrase", salt, hash, 16), true);
  assert.equal(await verifyPassphrase("other-pass-phrase", salt, hash, 16), false);
});
