import {
  createDefaultState,
  createLayer,
  LAYER_TRANSFORM_FIELDS,
  normalizeColor,
  normalizeState
} from "./model.js";
import { renderLayerThumbs } from "./layer-thumbs.js";
import { buildPreviewNodes } from "./preview.js";
import { readStateFromUrl, writeStateToUrl } from "./share.js";
import { renderAssetLibrary, renderBasePresets, renderLayers, syncLayerControls } from "./ui.js";

const refs = {
  assetLibrary: document.querySelector("#asset-library"),
  baseColor: document.querySelector("#base-color"),
  basePresets: document.querySelector("#base-presets"),
  copyLink: document.querySelector("#copy-link"),
  emptyLayers: document.querySelector("#empty-layers"),
  flagPreview: document.querySelector("#flag-preview"),
  layersList: document.querySelector("#layers-list"),
  resetFlag: document.querySelector("#reset-flag"),
  shareUrl: document.querySelector("#share-url"),
  statusMessage: document.querySelector("#status-message")
};

let state = createDefaultState();
let previewToken = 0;
function setStatus(message, tone = "neutral") {
  refs.statusMessage.textContent = message;
  refs.statusMessage.dataset.tone = tone;
}
async function renderPreview() {
  const token = ++previewToken;
  const nodes = await buildPreviewNodes(state);
  if (token !== previewToken) {
    return;
  }
  refs.flagPreview.innerHTML = "";
  nodes.forEach((node) => refs.flagPreview.appendChild(node));
}
function syncShareField() {
  refs.shareUrl.value = "Generating...";
  syncShareUrl().catch(() => {
    refs.shareUrl.value = "";
    setStatus("Share URL could not be updated.", "error");
  });
}

function updateState(nextState, options = {}) {
  const { layerRenderMode = "full" } = options;
  state = normalizeState(nextState);
  refs.baseColor.value = state.baseColor;
  renderBasePresets(refs.basePresets, state.baseColor);
  if (layerRenderMode === "full") {
    renderLayers(refs.layersList, refs.emptyLayers, state.layers);
  } else if (layerRenderMode === "controls") {
    syncLayerControls(refs.layersList, state.layers);
  }
  renderPreview().catch(() => {
    setStatus("Preview could not be rendered.", "error");
  });
  if (layerRenderMode !== "none") {
    renderLayerThumbs(refs.layersList, state.layers).catch(() => {
      setStatus("Layer thumbnails could not be rendered.", "error");
    });
  }
  syncShareField();
}

function updateLayer(layerId, mapLayer, options = { layerRenderMode: "controls" }) {
  let changed = false;
  const nextLayers = state.layers.map((layer) => {
    if (layer.id !== layerId) {
      return layer;
    }
    changed = true;
    return mapLayer(layer);
  });
  if (!changed) {
    return;
  }
  updateState({ ...state, layers: nextLayers }, options);
}
function addLayer(assetId) {
  updateState({
    ...state,
    layers: [...state.layers, createLayer(assetId)]
  });
}

function moveLayer(layerId, direction) {
  const currentIndex = state.layers.findIndex((layer) => layer.id === layerId);
  const nextIndex = currentIndex + direction;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= state.layers.length) {
    return;
  }
  const nextLayers = [...state.layers];
  const [layer] = nextLayers.splice(currentIndex, 1);
  nextLayers.splice(nextIndex, 0, layer);
  updateState({ ...state, layers: nextLayers });
}
function updateLayerColor(layerId, color) {
  updateLayer(
    layerId,
    (layer) => ({ ...layer, color: normalizeColor(color, layer.color) }),
    { layerRenderMode: "controls" }
  );
}

function updateLayerTransform(layerId, field, value) {
  if (!LAYER_TRANSFORM_FIELDS.has(field) || !Number.isFinite(value)) {
    return;
  }
  updateLayer(layerId, (layer) => ({ ...layer, [field]: value }), {
    layerRenderMode: "controls"
  });
}
function removeLayer(layerId) {
  updateState({
    ...state,
    layers: state.layers.filter((layer) => layer.id !== layerId)
  });
}

async function syncShareUrl(copyToClipboard = false) {
  const url = writeStateToUrl(state);
  refs.shareUrl.value = url;
  if (!copyToClipboard) {
    setStatus("Share link ready.", "success");
    return;
  }
  if (!navigator.clipboard?.writeText) {
    setStatus("Share link generated. Copy it from the field.", "success");
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    setStatus("Share link copied.", "success");
  } catch {
    setStatus("Share link generated. Copy it from the field.", "success");
  }
}

function bindEvents() {
  refs.assetLibrary.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add-layer]");
    if (!button) {
      return;
    }
    addLayer(button.dataset.addLayer);
    setStatus("Layer added.", "success");
  });
  refs.layersList.addEventListener("click", (event) => {
    const target = event.target;
    const moveUp = target.closest("[data-move-up]");
    const moveDown = target.closest("[data-move-down]");
    const removeButton = target.closest("[data-remove-layer]");
    const layerPreset = target.closest("[data-layer-preset]");
    if (moveUp) {
      moveLayer(moveUp.dataset.moveUp, -1);
      return;
    }
    if (moveDown) {
      moveLayer(moveDown.dataset.moveDown, 1);
      return;
    }
    if (removeButton) {
      removeLayer(removeButton.dataset.removeLayer);
      setStatus("Layer removed.", "success");
      return;
    }
    if (layerPreset) {
      updateLayerColor(layerPreset.dataset.layerPreset, layerPreset.dataset.color);
    }
  });
  refs.layersList.addEventListener("input", (event) => {
    const colorInput = event.target.closest("[data-layer-color]");
    if (colorInput) {
      updateLayerColor(colorInput.dataset.layerColor, colorInput.value);
      return;
    }
    const transformInput = event.target.closest("[data-layer-transform]");
    if (!transformInput) {
      return;
    }
    updateLayerTransform(
      transformInput.dataset.layerTransform,
      transformInput.dataset.layerField,
      transformInput.valueAsNumber
    );
  });
  refs.baseColor.addEventListener("input", (event) => {
    updateState(
      {
        ...state,
        baseColor: event.target.value
      },
      { layerRenderMode: "none" }
    );
  });
  refs.basePresets.addEventListener("click", (event) => {
    const preset = event.target.closest("[data-base-preset]");
    if (!preset) {
      return;
    }
    updateState(
      {
        ...state,
        baseColor: preset.dataset.color
      },
      { layerRenderMode: "none" }
    );
  });

  refs.copyLink.addEventListener("click", () => {
    refs.shareUrl.value = "Generating...";
    syncShareUrl(true).catch(() => {
      refs.shareUrl.value = "";
      setStatus("Share link could not be copied.", "error");
    });
  });
  refs.resetFlag.addEventListener("click", () => {
    updateState(createDefaultState());
    setStatus("Flag reset.", "success");
  });
}
async function init() {
  renderAssetLibrary(refs.assetLibrary);
  bindEvents();
  const sharedState = readStateFromUrl();
  if (sharedState) {
    state = sharedState;
  }
  updateState(state);
}
init().catch(() => {
  setStatus("The app could not be initialized.", "error");
});
