import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { allowLoginAttempt, resetLoginAttemptsForTests } from "./auth";
import { LOGIN_MAX_ATTEMPTS } from "./types";

afterEach(() => {
  resetLoginAttemptsForTests();
});

test("login attempts lock after the window limit", () => {
  const now = 1_000;
  for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i += 1) {
    assert.equal(allowLoginAttempt("10.0.0.1", now), true);
  }
  assert.equal(allowLoginAttempt("10.0.0.1", now + 10), false);
  assert.equal(allowLoginAttempt("10.0.0.1", now + 11 * 60 * 1000), true);
});
