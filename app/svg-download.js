import { buildStandaloneSvg } from "./preview.js";

const serializer = new XMLSerializer();
const SVG_FILE_NAME = "custom-flag.svg";

function serializeSvg(svg) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n${serializer.serializeToString(svg)}`;
}

function triggerDownload(url, fileName) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
}

export async function downloadCurrentFlagSvg(state) {
  const svg = await buildStandaloneSvg(state);
  const blob = new Blob([serializeSvg(svg)], {
    type: "image/svg+xml;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  try {
    triggerDownload(url, SVG_FILE_NAME);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
