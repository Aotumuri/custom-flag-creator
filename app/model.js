import { assets } from "./catalog.js";

export const DEFAULT_BASE_COLOR = "#ffffff";
export const DEFAULT_LAYER_COLOR = "#e60012";

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

export function createLayer(assetId, color = DEFAULT_LAYER_COLOR) {
  return {
    id: createLayerId(),
    assetId,
    color: normalizeColor(color, DEFAULT_LAYER_COLOR)
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
          color: normalizeColor(layer.color, DEFAULT_LAYER_COLOR)
        };
      })
      .filter(Boolean)
  };
}

export function serializeState(state) {
  return {
    v: 1,
    b: state.baseColor.slice(1),
    l: state.layers.map((layer) => [layer.assetId, layer.color.slice(1)])
  };
}

export function inflateState(value) {
  const raw = value ?? {};
  if ("baseColor" in raw || "layers" in raw) {
    return normalizeState({
      baseColor: raw.baseColor,
      layers: Array.isArray(raw.layers) ? raw.layers : []
    });
  }

  const layers = Array.isArray(raw.l) ? raw.l : [];

  return normalizeState({
    baseColor: raw.b,
    layers: layers.map((entry) => ({
      assetId: Array.isArray(entry) ? entry[0] : "",
      color: Array.isArray(entry) ? entry[1] : DEFAULT_LAYER_COLOR
    }))
  });
}
