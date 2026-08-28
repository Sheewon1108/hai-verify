import assert from "node:assert/strict";
import { test } from "node:test";
import { readSession, signSession } from "./session";

test("signed session roundtrip", async () => {
  const token = await signSession("session-secret", "owner", 1_000, 60);
  const payload = await readSession("session-secret", token, 1_500);
  assert.deepEqual(payload, { seat: "owner", iat: 1_000, exp: 61_000 });
});

test("expired or forged session is rejected", async () => {
  const token = await signSession("session-secret", "partner", 1_000, 1);
  assert.equal(await readSession("session-secret", token, 3_000), null);
  assert.equal(await readSession("other-secret", token, 1_100), null);
  assert.equal(await readSession("session-secret", `${token}x`, 1_100), null);
  assert.equal(await readSession("session-secret", undefined, 1_100), null);
});
