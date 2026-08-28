import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  emptyDiaryPayload,
  isPrivateRoomRequestAllowed,
  isSafeLookupId,
  mergeDiaryPayloads,
  parseEncryptedRoomBlob,
  PRIVATE_ROOM_PROTOCOL,
  type DiaryPayload,
} from "./private-room";
import {
  decryptDiaryPayload,
  encryptDiaryPayload,
  unlockRoomKey,
} from "./private-room-crypto";

function entry(
  id: string,
  updatedAt: string,
  body = "글",
): DiaryPayload["entries"][number] {
  return {
    id,
    kind: "bok",
    seat: "owner",
    body,
    createdAt: "2026-08-28T00:00:00.000Z",
    updatedAt,
  };
}

describe("private room lookup id", () => {
  it("accepts only 64 lowercase hex chars", () => {
    assert.equal(isSafeLookupId("a".repeat(64)), true);
    assert.equal(isSafeLookupId("A".repeat(64)), false);
    assert.equal(isSafeLookupId("z".repeat(64)), false);
    assert.equal(isSafeLookupId("ab"), false);
  });
});

describe("diary merge", () => {
  it("keeps the newer body for the same id", () => {
    const older: DiaryPayload = {
      protocol: PRIVATE_ROOM_PROTOCOL,
      seats: ["owner", "partner"],
      entries: [entry("entry-one", "2026-08-28T01:00:00.000Z", "old")],
    };
    const newer: DiaryPayload = {
      protocol: PRIVATE_ROOM_PROTOCOL,
      seats: ["owner", "partner"],
      entries: [entry("entry-one", "2026-08-28T02:00:00.000Z", "new")],
    };
    const merged = mergeDiaryPayloads(older, newer);
    assert.equal(merged.entries.length, 1);
    assert.equal(merged.entries[0]?.body, "new");
  });
});

describe("encrypted blob guard", () => {
  it("rejects plaintext-looking objects", () => {
    assert.throws(() => parseEncryptedRoomBlob({ entries: [] }));
    assert.throws(() => parseEncryptedRoomBlob({ v: 1, protocol: "nope", iv: "a", ct: "b" }));
  });
});

describe("room request allow list", () => {
  it("allows loopback and same-origin only", () => {
    const loopback = new Request("http://127.0.0.1:3001/api/room/sync?id=x", {
      headers: { host: "127.0.0.1:3001" },
    });
    assert.equal(isPrivateRoomRequestAllowed(loopback), true);

    const sameOrigin = new Request("https://hai-ic.com/api/room/sync?id=x", {
      headers: {
        host: "hai-ic.com",
        "sec-fetch-site": "same-origin",
      },
    });
    assert.equal(isPrivateRoomRequestAllowed(sameOrigin), true);

    const outsider = new Request("https://hai-ic.com/api/room/sync?id=x", {
      headers: {
        host: "hai-ic.com",
        origin: "https://evil.example",
      },
    });
    assert.equal(isPrivateRoomRequestAllowed(outsider), false);
  });
});

describe("web crypto locker", () => {
  it("same key unlocks the same diary on a second derive", async () => {
    const first = await unlockRoomKey("pair-room-key-for-tests");
    const second = await unlockRoomKey("pair-room-key-for-tests");
    assert.equal(first.lookupId, second.lookupId);
    assert.match(first.lookupId, /^[a-f0-9]{64}$/);

    const payload = emptyDiaryPayload();
    payload.entries.push(entry("entry-e1", "2026-08-28T03:00:00.000Z", "복불복"));
    const blob = await encryptDiaryPayload(first.key, payload);
    const opened = await decryptDiaryPayload(second.key, blob);
    assert.equal(opened.entries[0]?.body, "복불복");
  });

  it("a different key cannot open the blob", async () => {
    const writer = await unlockRoomKey("pair-room-key-for-tests");
    const other = await unlockRoomKey("different-room-key-xx");
    const blob = await encryptDiaryPayload(writer.key, emptyDiaryPayload());
    await assert.rejects(() => decryptDiaryPayload(other.key, blob));
  });

  it("rejects a short room key", async () => {
    await assert.rejects(() => unlockRoomKey("short"), /ROOM_KEY_TOO_SHORT/);
  });
});
