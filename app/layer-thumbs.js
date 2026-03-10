import { getAsset } from "./catalog.js";
import { buildLayerMarkup } from "./svg.js";

let thumbToken = 0;

export async function renderLayerThumbs(root, layers) {
  const token = ++thumbToken;
  const entries = await Promise.all(
    layers.map(async (layer) => {
      const asset = getAsset(layer.assetId);
      return [
        layer.id,
        asset ? await buildLayerMarkup(asset.path, layer.color) : ""
      ];
    })
  );

  if (token !== thumbToken) {
    return;
  }

  const markupById = new Map(entries);
  root.querySelectorAll("[data-layer-thumb]").forEach((node) => {
    const markup = markupById.get(node.dataset.layerThumb) ?? "";
    if (node.innerHTML !== markup) {
      node.innerHTML = markup;
    }
  });
}
