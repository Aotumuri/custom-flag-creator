const svgCache = new Map();
const parser = new DOMParser();
const serializer = new XMLSerializer();

function parseDeclarations(block) {
  return block
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce((result, entry) => {
      const [property, value] = entry.split(":").map((part) => part?.trim());
      if (property && value) {
        result[property] = value;
      }
      return result;
    }, {});
}

function inlineClassStyles(svg) {
  const styleRules = new Map();

  svg.querySelectorAll("style").forEach((styleNode) => {
    const cssText = styleNode.textContent ?? "";
    for (const match of cssText.matchAll(/\.([\w-]+)\s*\{([^}]+)\}/g)) {
      styleRules.set(match[1], parseDeclarations(match[2]));
    }
    styleNode.remove();
  });

  styleRules.forEach((declarations, className) => {
    svg.querySelectorAll(`.${className}`).forEach((element) => {
      Object.entries(declarations).forEach(([property, value]) => {
        element.setAttribute(property, value);
      });
      element.classList.remove(className);
      if (!element.getAttribute("class")) {
        element.removeAttribute("class");
      }
    });
  });

  svg.querySelectorAll("defs").forEach((defsNode) => {
    if (!defsNode.children.length) {
      defsNode.remove();
    }
  });
}

function tintSvg(svg, color) {
  svg.querySelectorAll("*").forEach((element) => {
    ["fill", "stroke"].forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (value && value !== "none") {
        element.setAttribute(attribute, color);
      }
    });
  });
}

function normalizeRoot(svg) {
  svg.removeAttribute("id");
  svg.removeAttribute("data-name");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
}

async function fetchSvg(path) {
  if (!svgCache.has(path)) {
    const request = fetch(path).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load ${path}`);
      }

      return response.text();
    });
    svgCache.set(path, request);
  }

  return svgCache.get(path);
}

export async function buildLayerMarkup(path, color, locked = false) {
  const source = await fetchSvg(path);
  const document = parser.parseFromString(source, "image/svg+xml");
  const svg = document.documentElement;

  inlineClassStyles(svg);
  normalizeRoot(svg);

  if (!locked) {
    tintSvg(svg, color);
  }

  return serializer.serializeToString(svg);
}
