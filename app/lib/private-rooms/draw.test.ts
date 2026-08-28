import assert from "node:assert/strict";
import { test } from "node:test";
import { drawOne, parseDrawLines } from "./draw";

test("parseDrawLines drops blanks", () => {
  assert.deepEqual(parseDrawLines("  a\n\n b \n"), ["a", "b"]);
});

test("drawOne picks one of the given options", () => {
  const options = ["왼쪽", "오른쪽", "멈춤"];
  const seen = new Set<string>();
  for (let i = 0; i < 20; i += 1) {
    seen.add(drawOne(options));
  }
  for (const item of seen) {
    assert.equal(options.includes(item), true);
  }
  assert.throws(() => drawOne([]), /NO_DRAW_OPTIONS/);
});
