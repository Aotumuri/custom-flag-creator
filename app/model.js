import { assets } from "./catalog.js";

export const DEFAULT_BASE_COLOR = "#ffffff";
export const DEFAULT_LAYER_COLOR = "#e60012";
export const DEFAULT_LAYER_TRANSFORM = Object.freeze({
  offsetX: 0,
  offsetY: 0,
  scaleX: 100,
  scaleY: 100,
  rotation: 0
});
export const LAYER_TRANSFORM_FIELDS = new Set([
  "offsetX",
  "offsetY",
  "scaleX",
  "scaleY",
  "rotation"
]);
export const LAYER_TRANSFORM_LIMITS = Object.freeze({
  offsetX: Object.freeze({ min: -36, max: 36, step: 1 }),
  offsetY: Object.freeze({ min: -36, max: 36, step: 1 }),
  scaleX: Object.freeze({ min: 20, max: 300, step: 1 }),
  scaleY: Object.freeze({ min: 20, max: 300, step: 1 }),
  rotation: Object.freeze({ min: -180, max: 180, step: 1 })
});

const validAssetIds = new Set(assets.map((asset) => asset.id));
let layerCounter = 0;

function createLayerId() {
  layerCounter += 1;
  return `layer-${layerCounter}`;
}

export function normalizeColor(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim().toLowerCase();
  const hex = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return /^#[0-9a-f]{6}$/.test(hex) ? hex : fallback;
}

function normalizeNumber(value, fallback, limits) {
  const numeric = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(limits.max, Math.max(limits.min, Math.round(numeric)));
}

export function normalizeLayerTransform(value) {
  const raw = value ?? {};
  const fallbackScale = raw.scale;
  return {
    offsetX: normalizeNumber(
      raw.offsetX,
      DEFAULT_LAYER_TRANSFORM.offsetX,
      LAYER_TRANSFORM_LIMITS.offsetX
    ),
    offsetY: normalizeNumber(
      raw.offsetY,
      DEFAULT_LAYER_TRANSFORM.offsetY,
      LAYER_TRANSFORM_LIMITS.offsetY
    ),
    scaleX: normalizeNumber(
      raw.scaleX ?? fallbackScale,
      DEFAULT_LAYER_TRANSFORM.scaleX,
      LAYER_TRANSFORM_LIMITS.scaleX
    ),
    scaleY: normalizeNumber(
      raw.scaleY ?? fallbackScale,
      DEFAULT_LAYER_TRANSFORM.scaleY,
      LAYER_TRANSFORM_LIMITS.scaleY
    ),
    rotation: normalizeNumber(
      raw.rotation,
      DEFAULT_LAYER_TRANSFORM.rotation,
      LAYER_TRANSFORM_LIMITS.rotation
    )
  };
}

export function isDefaultLayerTransform(layer) {
  return (
    layer.offsetX === DEFAULT_LAYER_TRANSFORM.offsetX &&
    layer.offsetY === DEFAULT_LAYER_TRANSFORM.offsetY &&
    layer.scaleX === DEFAULT_LAYER_TRANSFORM.scaleX &&
    layer.scaleY === DEFAULT_LAYER_TRANSFORM.scaleY &&
    layer.rotation === DEFAULT_LAYER_TRANSFORM.rotation
  );
}

export function createLayer(assetId, color = DEFAULT_LAYER_COLOR) {
  return {
    id: createLayerId(),
    assetId,
    color: normalizeColor(color, DEFAULT_LAYER_COLOR),
    ...DEFAULT_LAYER_TRANSFORM
  };
}

export function createDefaultState() {
  return {
    baseColor: DEFAULT_BASE_COLOR,
    layers: []
  };
}

export function normalizeState(value) {
  const raw = value ?? {};
  const layers = Array.isArray(raw.layers) ? raw.layers : [];

  return {
    baseColor: normalizeColor(raw.baseColor, DEFAULT_BASE_COLOR),
    layers: layers
      .map((layer) => {
        if (!layer || !validAssetIds.has(layer.assetId)) {
          return null;
        }

        return {
          id: typeof layer.id === "string" ? layer.id : createLayerId(),
          assetId: layer.assetId,
          color: normalizeColor(layer.color, DEFAULT_LAYER_COLOR),
          ...normalizeLayerTransform(layer)
        };
      })
      .filter(Boolean)
  };
}

function hasNormalizedStateShape(raw) {
  return "baseColor" in raw || "layers" in raw;
}

function inflateLegacyLayer(entry) {
  if (!Array.isArray(entry)) {
    return {
      assetId: "",
      color: DEFAULT_LAYER_COLOR,
      ...DEFAULT_LAYER_TRANSFORM
    };
  }

  const hasSeparateScales = entry.length > 6;
  const uniformScale = entry[4];
  return {
    assetId: entry[0],
    color: entry[1],
    offsetX: entry[2],
    offsetY: entry[3],
    scaleX: hasSeparateScales ? entry[4] : uniformScale,
    scaleY: hasSeparateScales ? entry[5] : uniformScale,
    rotation: entry[hasSeparateScales ? 6 : 5]
  };
}

function inflateLegacyState(raw) {
  const layers = Array.isArray(raw.l) ? raw.l : [];
  return normalizeState({
    baseColor: raw.b,
    layers: layers.map(inflateLegacyLayer)
  });
}

export function inflateState(value) {
  const raw = value ?? {};
  if (hasNormalizedStateShape(raw)) {
    return normalizeState({
      baseColor: raw.baseColor,
      layers: Array.isArray(raw.layers) ? raw.layers : []
    });
  }
  return inflateLegacyState(raw);
}
