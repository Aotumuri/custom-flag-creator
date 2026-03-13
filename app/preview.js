import { BASE_LAYER, FRAME_LAYER, getAsset } from "./catalog.js";
import { buildLayerMarkup } from "./svg.js";

const parser = new DOMParser();
const REFERENCE_ATTRIBUTES = [
  "clip-path",
  "fill",
  "filter",
  "href",
  "mask",
  "marker-end",
  "marker-mid",
  "marker-start",
  "stroke",
  "xlink:href"
];
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const SVG_VIEW_BOX = "0 0 72 72";

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

function rewriteReferencedIds(root, prefix) {
  const idMap = new Map();
  root.querySelectorAll("[id]").forEach((node, index) => {
    const nextId = `${prefix}-${index}`;
    idMap.set(node.id, nextId);
    node.id = nextId;
  });

  root.querySelectorAll("*").forEach((node) => {
    REFERENCE_ATTRIBUTES.forEach((attribute) => {
      const value = node.getAttribute(attribute);
      if (!value) {
        return;
      }

      if (value.startsWith("url(#") && value.endsWith(")")) {
        const targetId = value.slice(5, -1);
        if (idMap.has(targetId)) {
          node.setAttribute(attribute, `url(#${idMap.get(targetId)})`);
        }
        return;
      }

      if (value.startsWith("#") && idMap.has(value.slice(1))) {
        node.setAttribute(attribute, `#${idMap.get(value.slice(1))}`);
      }
    });
  });
}

async function buildLayerChildren(layer, index) {
  const markup = await buildLayerMarkup(layer.path, layer.color, layer.options);
  const documentRoot = parser.parseFromString(markup, "image/svg+xml").documentElement;
  rewriteReferencedIds(documentRoot, `flag-layer-${index}`);
  return Array.from(documentRoot.childNodes, (node) => document.importNode(node, true));
}

export async function buildStandaloneSvg(state) {
  const layerNodes = await Promise.all(
    getPreviewLayers(state).map((layer, index) => buildLayerChildren(layer, index))
  );
  const svg = document.createElementNS(SVG_NAMESPACE, "svg");
  svg.setAttribute("xmlns", SVG_NAMESPACE);
  svg.setAttribute("viewBox", SVG_VIEW_BOX);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.classList.add("standalone-flag");
  layerNodes.flat().forEach((node) => svg.appendChild(node));
  return svg;
}
