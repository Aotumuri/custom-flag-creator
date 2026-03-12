import assert from "node:assert/strict";
import test from "node:test";

import { decodeState, encodeState } from "../app/share.js";

function simplify(state) {
  return {
    baseColor: state.baseColor,
    layers: state.layers.map(({ assetId, color, offsetX, offsetY, scale, rotation }) => ({
      assetId,
      color,
      offsetX,
      offsetY,
      scale,
      rotation
    }))
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
      {
        assetId: "center_star",
        color: "#c1121f",
        offsetX: 0,
        offsetY: 0,
        scale: 100,
        rotation: 0
      },
      {
        assetId: "triangle_t",
        color: "#118ab2",
        offsetX: 0,
        offsetY: 0,
        scale: 100,
        rotation: 0
      }
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
    layers: [
      {
        assetId: "triangle_tr",
        color: "#abcdef",
        offsetX: 0,
        offsetY: 0,
        scale: 100,
        rotation: 0
      }
    ]
  });
});

test("encodeState keeps transform controls in compact tokens", () => {
  const payload = encodeState({
    baseColor: "#ffffff",
    layers: [
      {
        id: "x",
        assetId: "center_star",
        color: "#c1121f",
        offsetX: 8,
        offsetY: -6,
        scale: 140,
        rotation: 18
      }
    ]
  });

  assert.equal(payload, "!0b4_Tmtko");
  assert.deepEqual(simplify(decodeState(payload)), {
    baseColor: "#ffffff",
    layers: [
      {
        assetId: "center_star",
        color: "#c1121f",
        offsetX: 8,
        offsetY: -6,
        scale: 140,
        rotation: 18
      }
    ]
  });
});

test("encodeState changes token for each scale increment", () => {
  const scale140 = encodeState({
    baseColor: "#ffffff",
    layers: [{ id: "x", assetId: "center_star", color: "#c1121f", scale: 140 }]
  });
  const scale141 = encodeState({
    baseColor: "#ffffff",
    layers: [{ id: "x", assetId: "center_star", color: "#c1121f", scale: 141 }]
  });

  assert.notEqual(scale140, scale141);
});

test("decodeState supports legacy compact transform tokens", () => {
  assert.deepEqual(simplify(decodeState("!0b4-E7bZ")), {
    baseColor: "#ffffff",
    layers: [
      {
        assetId: "center_star",
        color: "#c1121f",
        offsetX: 8,
        offsetY: -6,
        scale: 137,
        rotation: 26
      }
    ]
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
    layers: [
      {
        assetId: "center_star",
        color: "#c1121f",
        offsetX: 0,
        offsetY: 0,
        scale: 100,
        rotation: 0
      }
    ]
  });
});
