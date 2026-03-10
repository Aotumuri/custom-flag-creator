import { assetGroups, assets, getAsset } from "./catalog.js";
import { COLOR_PRESETS } from "./palette.js";

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
                <div>
                  <strong>${asset.label}</strong>
                  <span>${asset.id}.svg</span>
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
        <li class="layer-item">
          <div class="layer-heading">
            <div class="layer-thumb">
              <img src="${asset.thumbPath}" alt="${asset.label}" />
            </div>
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
        </li>
      `;
    })
    .join("");
}
