import assert from "node:assert/strict";
import { test } from "node:test";
import { TRACE_ITEMS, tracesByKind } from "./traces";

test("trace catalog splits reduced vs impossible", () => {
  const reduced = tracesByKind("reduced");
  const impossible = tracesByKind("impossible");
  assert.ok(reduced.length >= 4);
  assert.ok(impossible.length >= 5);
  assert.equal(reduced.length + impossible.length, TRACE_ITEMS.length);
  assert.ok(TRACE_ITEMS.some((item) => item.id === "no-gmail-index"));
  assert.ok(TRACE_ITEMS.some((item) => item.id === "chat-paste"));
  assert.ok(TRACE_ITEMS.some((item) => item.id === "two-seats"));
});
