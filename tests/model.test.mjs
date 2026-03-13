import assert from "node:assert/strict";
import test from "node:test";

import { inflateState } from "../app/model.js";

function simplify(state) {
  return {
    baseColor: state.baseColor,
    layers: state.layers.map(({ assetId, color, offsetX, offsetY, scaleX, scaleY, rotation }) => ({
      assetId,
      color,
      offsetX,
      offsetY,
      scaleX,
      scaleY,
      rotation
    }))
  };
}

test("inflateState accepts normalized state objects", () => {
  assert.deepEqual(
    simplify(
      inflateState({
        baseColor: "#ffffff",
        layers: [
          {
            assetId: "triangle_t",
            color: "#118ab2",
            offsetX: 6,
            offsetY: -4,
            scaleX: 135,
            scaleY: 90,
            rotation: -20
          }
        ]
      })
    ),
    {
      baseColor: "#ffffff",
      layers: [
        {
          assetId: "triangle_t",
          color: "#118ab2",
          offsetX: 6,
          offsetY: -4,
          scaleX: 135,
          scaleY: 90,
          rotation: -20
        }
      ]
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
      layers: [
        {
          assetId: "center_star",
          color: "#c1121f",
          offsetX: 0,
          offsetY: 0,
          scaleX: 100,
          scaleY: 100,
          rotation: 0
        }
      ]
    }
  );
});

test("inflateState clamps transform controls into supported ranges", () => {
  assert.deepEqual(
    simplify(
      inflateState({
        baseColor: "#ffffff",
        layers: [
          {
            assetId: "triangle_t",
            color: "#118ab2",
            offsetX: 100,
            offsetY: -200,
            scaleX: 999,
            scaleY: 1,
            rotation: -500
          }
        ]
      })
    ),
    {
      baseColor: "#ffffff",
      layers: [
        {
          assetId: "triangle_t",
          color: "#118ab2",
          offsetX: 36,
          offsetY: -36,
          scaleX: 300,
          scaleY: 20,
          rotation: -180
        }
      ]
    }
  );
});
