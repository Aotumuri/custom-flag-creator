const svgCache = new Map();
const clipMarkupCache = new Map();
const parser = new DOMParser();
const serializer = new XMLSerializer();
const SVG_CENTER = 36;

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

function wrapLayerMarkup(markup, transform) {
  let result = markup;

  if (transform.scaleX !== 100 || transform.scaleY !== 100) {
    const scaleX = transform.scaleX / 100;
    const scaleY = transform.scaleY / 100;
    result = `
      <g transform="translate(${SVG_CENTER} ${SVG_CENTER}) scale(${scaleX} ${scaleY}) translate(${-SVG_CENTER} ${-SVG_CENTER})">
        ${result}
      </g>
    `;
  }

  if (transform.rotation !== 0) {
    result = `
      <g transform="rotate(${transform.rotation} ${SVG_CENTER} ${SVG_CENTER})">
        ${result}
      </g>
    `;
  }

  if (transform.offsetX !== 0 || transform.offsetY !== 0) {
    result = `
      <g transform="translate(${transform.offsetX} ${transform.offsetY})">
        ${result}
      </g>
    `;
  }

  return result;
}

function applyLayerOptions(svg, clipMarkup, transform) {
  if (!clipMarkup && !transform) {
    return;
  }

  let markup = svg.innerHTML;
  if (transform) {
    markup = wrapLayerMarkup(markup, transform);
  }

  if (clipMarkup) {
    markup = `
      <defs>
        <clipPath id="flag-layer-clip" clipPathUnits="userSpaceOnUse">
          ${clipMarkup}
        </clipPath>
      </defs>
      <g clip-path="url(#flag-layer-clip)">
        ${markup}
      </g>
    `;
  }

  svg.innerHTML = markup;
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

async function fetchClipMarkup(path) {
  if (!clipMarkupCache.has(path)) {
    const request = fetchSvg(path).then((source) => {
      const document = parser.parseFromString(source, "image/svg+xml");
      const svg = document.documentElement;
      inlineClassStyles(svg);
      normalizeRoot(svg);
      return svg.innerHTML;
    });
    clipMarkupCache.set(path, request);
  }

  return clipMarkupCache.get(path);
}

export async function buildLayerMarkup(path, color, options = {}) {
  const { clipPath = null, locked = false, transform = null } = options;
  const source = await fetchSvg(path);
  const document = parser.parseFromString(source, "image/svg+xml");
  const svg = document.documentElement;

  inlineClassStyles(svg);
  normalizeRoot(svg);

  if (!locked) {
    tintSvg(svg, color);
  }

  const clipMarkup = clipPath ? await fetchClipMarkup(clipPath) : null;
  applyLayerOptions(svg, clipMarkup, transform);

  return serializer.serializeToString(svg);
}
