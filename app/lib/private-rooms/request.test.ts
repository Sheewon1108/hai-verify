import assert from "node:assert/strict";
import { test } from "node:test";
import { isPrivateLoopback } from "./request";

test("loopback host is allowed, tunnel headers are not", () => {
  assert.equal(
    isPrivateLoopback(new Request("http://127.0.0.1:3000/private", { headers: { host: "127.0.0.1:3000" } })),
    true,
  );
  assert.equal(
    isPrivateLoopback(
      new Request("http://127.0.0.1:3000/private", {
        headers: { host: "127.0.0.1:3000", "x-localtunnel-agent-ips": "1.2.3.4" },
      }),
    ),
    false,
  );
  assert.equal(
    isPrivateLoopback(new Request("https://example.test/private", { headers: { host: "example.test" } })),
    false,
  );
});
