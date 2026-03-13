import { assetGroups, assets, getAsset } from "./catalog.js";
import { LAYER_TRANSFORM_LIMITS } from "./model.js";
import { COLOR_PRESETS } from "./palette.js";

const TRANSFORM_FIELDS = [
  { field: "offsetX", label: "X", suffix: "" },
  { field: "offsetY", label: "Y", suffix: "" },
  { field: "scaleX", label: "Size X", suffix: "%" },
  { field: "scaleY", label: "Size Y", suffix: "%" },
  { field: "rotation", label: "Tilt", suffix: "deg" }
];

function renderPresetButtons(currentColor, datasetKey, datasetValue) {
  return COLOR_PRESETS.map((preset) => {
    const selected = preset.value === currentColor ? " is-selected" : "";
    return `
      <button
        class="color-swatch${selected}"
        type="button"
        style="background:${preset.value}"
        title="${preset.value}"
        aria-label="Use ${preset.value}"
        data-${datasetKey}="${datasetValue}"
        data-color="${preset.value}"
      ></button>
    `;
  }).join("");
}

function renderTransformInput(layer, config) {
  const limits = LAYER_TRANSFORM_LIMITS[config.field];
  return `
    <label class="layer-setting">
      <span>${config.label}</span>
      <div class="layer-setting-row">
        <input
          class="layer-number-input"
          type="number"
          value="${layer[config.field]}"
          min="${limits.min}"
          max="${limits.max}"
          step="${limits.step}"
          data-layer-transform="${layer.id}"
          data-layer-field="${config.field}"
        />
        ${config.suffix ? `<small>${config.suffix}</small>` : ""}
      </div>
    </label>
  `;
}

function renderTransformControls(layer) {
  return `
    <div class="layer-settings" aria-label="Layer transform controls">
      ${TRANSFORM_FIELDS.map((config) => renderTransformInput(layer, config)).join("")}
    </div>
  `;
}

export function renderAssetLibrary(root) {
  root.innerHTML = assetGroups
    .map((group) => {
      const groupAssets = assets.filter((asset) => asset.groupId === group.id);
      const cards = groupAssets
        .map(
          (asset) => `
            <li>
              <button class="asset-card" type="button" data-add-layer="${asset.id}">
                <div class="asset-thumb">
                  <img src="${asset.thumbPath}" alt="${asset.label}" loading="lazy" />
                </div>
                <div class="asset-copy">
                  <strong>${asset.label}</strong>
                </div>
              </button>
            </li>
          `
        )
        .join("");

      return `
        <section class="asset-group">
          <h3>${group.title}</h3>
          <ol class="asset-grid">${cards}</ol>
        </section>
      `;
    })
    .join("");
}

export function renderBasePresets(root, color) {
  root.innerHTML = renderPresetButtons(color, "base-preset", "base");
}

export function renderLayers(root, emptyState, layers) {
  emptyState.hidden = layers.length > 0;
  root.innerHTML = layers
    .map((layer, index) => {
      const asset = getAsset(layer.assetId);
      if (!asset) {
        return "";
      }

      return `
        <li class="layer-item" data-layer-id="${layer.id}">
          <div class="layer-heading">
            <div class="layer-thumb" data-layer-thumb="${layer.id}" aria-hidden="true"></div>
            <div class="layer-copy">
              <strong>${asset.label}</strong>
              <span>Custom layer ${index + 1}</span>
            </div>
          </div>
          <div class="layer-toolbar">
            <div class="layer-color-tools">
              <label class="color-input">
                <span>Color</span>
                <input type="color" value="${layer.color}" data-layer-color="${layer.id}" />
              </label>
              <div class="color-presets" aria-label="Layer color presets">
                ${renderPresetButtons(layer.color, "layer-preset", layer.id)}
              </div>
            </div>
            <div class="layer-actions">
              <button class="button" type="button" data-move-up="${layer.id}">Up</button>
              <button class="button" type="button" data-move-down="${layer.id}">Down</button>
              <button class="button" type="button" data-remove-layer="${layer.id}">Remove</button>
            </div>
          </div>
          ${renderTransformControls(layer)}
        </li>
      `;
    })
    .join("");
}

export function syncLayerControls(root, layers) {
  const layerById = new Map(layers.map((layer) => [layer.id, layer]));

  root.querySelectorAll("[data-layer-id]").forEach((layerNode) => {
    const layer = layerById.get(layerNode.dataset.layerId);
    if (!layer) {
      return;
    }

    const colorInput = layerNode.querySelector("[data-layer-color]");
    if (colorInput && colorInput.value !== layer.color) {
      colorInput.value = layer.color;
    }

    layerNode.querySelectorAll("[data-layer-preset]").forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.color === layer.color);
    });

    layerNode.querySelectorAll("[data-layer-transform]").forEach((input) => {
      const field = input.dataset.layerField;
      if (field && input.value !== String(layer[field])) {
        input.value = layer[field];
      }
    });
  });
}
