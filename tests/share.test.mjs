import assert from "node:assert/strict";
import test from "node:test";

import { decodeState, encodeState } from "../app/share.js";

function simplify(state) {
  return {
    baseColor: state.baseColor,
    layers: state.layers.map(({ assetId, color }) => ({ assetId, color }))
  };
}

function toBase64Url(text) {
  return Buffer.from(text, "utf8")
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

test("encodeState keeps stable compact tokens for preset colors", () => {
  const payload = encodeState({
    baseColor: "#ffffff",
    layers: [
      { id: "x", assetId: "center_star", color: "#c1121f" },
      { id: "y", assetId: "triangle_t", color: "#118ab2" }
    ]
  });

  assert.equal(payload, "!0b4Oa");
  assert.deepEqual(simplify(decodeState(payload)), {
    baseColor: "#ffffff",
    layers: [
      { assetId: "center_star", color: "#c1121f" },
      { assetId: "triangle_t", color: "#118ab2" }
    ]
  });
});

test("encodeState round-trips arbitrary hex colors", () => {
  const payload = encodeState({
    baseColor: "#123456",
    layers: [{ id: "z", assetId: "triangle_tr", color: "#abcdef" }]
  });

  assert.equal(payload, "!~EjRWT~q83v");
  assert.deepEqual(simplify(decodeState(payload)), {
    baseColor: "#123456",
    layers: [{ assetId: "triangle_tr", color: "#abcdef" }]
  });
});

test("decodeState supports legacy base64url payloads", () => {
  const legacyPayload = toBase64Url(
    JSON.stringify({
      v: 1,
      b: "ffffff",
      l: [["center_star", "c1121f"]]
    })
  );

  assert.deepEqual(simplify(decodeState(legacyPayload)), {
    baseColor: "#ffffff",
    layers: [{ assetId: "center_star", color: "#c1121f" }]
  });
});
