import assert from "node:assert/strict";
import test from "node:test";

import { inflateState } from "../app/model.js";

function simplify(state) {
  return {
    baseColor: state.baseColor,
    layers: state.layers.map(({ assetId, color }) => ({ assetId, color }))
  };
}

test("inflateState accepts normalized state objects", () => {
  assert.deepEqual(
    simplify(
      inflateState({
        baseColor: "#ffffff",
        layers: [{ assetId: "triangle_t", color: "#118ab2" }]
      })
    ),
    {
      baseColor: "#ffffff",
      layers: [{ assetId: "triangle_t", color: "#118ab2" }]
    }
  );
});

test("inflateState accepts legacy serialized state objects", () => {
  assert.deepEqual(
    simplify(
      inflateState({
        b: "ffffff",
        l: [["center_star", "c1121f"]]
      })
    ),
    {
      baseColor: "#ffffff",
      layers: [{ assetId: "center_star", color: "#c1121f" }]
    }
  );
});
