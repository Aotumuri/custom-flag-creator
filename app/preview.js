import { BASE_LAYER, FRAME_LAYER, getAsset } from "./catalog.js";
import { buildLayerMarkup } from "./svg.js";

function getPreviewLayers(state) {
  return [
    {
      color: state.baseColor,
      options: {},
      path: BASE_LAYER.path
    },
    ...state.layers
      .map((layer) => {
        const asset = getAsset(layer.assetId);
        if (!asset) {
          return null;
        }

        return {
          color: layer.color,
          options: {
            clipPath: BASE_LAYER.path,
            transform: layer
          },
          path: asset.path
        };
      })
      .filter(Boolean),
    {
      color: "#000000",
      options: { locked: true },
      path: FRAME_LAYER.path
    }
  ];
}

async function createLayerNode(layer) {
  const element = document.createElement("div");
  element.className = "flag-layer";
  element.innerHTML = await buildLayerMarkup(layer.path, layer.color, layer.options);
  return element;
}

export function buildPreviewNodes(state) {
  return Promise.all(getPreviewLayers(state).map(createLayerNode));
}
