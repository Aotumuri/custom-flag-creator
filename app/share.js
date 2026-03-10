import { getAssetByShareCode, getAssetShareCode } from "./catalog.js";
import { inflateState } from "./model.js";
import { getPresetCode, getPresetColor } from "./palette.js";

const decoder = new TextDecoder();
const SHARE_PREFIX = "!";

function bytesToBase64Url(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlToBytes(value) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padding = "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(normalized + padding);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function colorToToken(color) {
  const presetCode = getPresetCode(color);
  if (presetCode !== null) {
    return presetCode;
  }
  const hex = color.toLowerCase().slice(1);
  return `~${bytesToBase64Url(
    Uint8Array.from([0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16)))
  )}`;
}

function tokenToColor(token) {
  return getPresetColor(token);
}

function bytesToHexColor(bytes) {
  if (bytes.length !== 3) {
    return null;
  }
  return `#${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function encodeCompactState(state) {
  const baseToken = colorToToken(state.baseColor);
  const layerTokens = state.layers
    .map((layer) => {
      const assetCode = getAssetShareCode(layer.assetId);
      if (assetCode === null) {
        throw new Error("Unknown asset");
      }
      return `${assetCode}${colorToToken(layer.color)}`;
    })
    .join("");
  return `${SHARE_PREFIX}${baseToken}${layerTokens}`;
}

function decodeCompactState(payload) {
  try {
    if (!payload.startsWith(SHARE_PREFIX)) {
      return null;
    }

    let cursor = 1;
    const baseMode = payload[cursor];
    if (!baseMode) {
      return null;
    }

    let baseColor = tokenToColor(baseMode);
    if (baseColor) {
      cursor += 1;
    } else if (baseMode === "~") {
      const rawBase = bytesToHexColor(base64UrlToBytes(payload.slice(cursor + 1, cursor + 5)));
      if (!rawBase) {
        return null;
      }
      baseColor = rawBase;
      cursor += 5;
    } else {
      return null;
    }

    const layers = [];
    while (cursor < payload.length) {
      const assetId = getAssetByShareCode(payload[cursor])?.id;
      const colorMode = payload[cursor + 1];
      if (!assetId || !colorMode) {
        return null;
      }

      cursor += 2;
      const color = tokenToColor(colorMode);
      if (color) {
        layers.push({ assetId, color });
        continue;
      }

      if (colorMode !== "~") {
        return null;
      }

      const rawColor = bytesToHexColor(base64UrlToBytes(payload.slice(cursor, cursor + 4)));
      if (!rawColor) {
        return null;
      }

      layers.push({ assetId, color: rawColor });
      cursor += 4;
    }

    return inflateState({ baseColor, layers });
  } catch {
    return null;
  }
}

function decodeLegacyState(payload) {
  try {
    const json = decoder.decode(base64UrlToBytes(payload));
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === "object" && "b" in parsed && "l" in parsed) {
      return inflateState({
        baseColor: parsed.b,
        layers: Array.isArray(parsed.l)
          ? parsed.l.map((entry) => ({
              assetId: Array.isArray(entry) ? entry[0] : "",
              color: Array.isArray(entry) ? entry[1] : ""
            }))
          : []
      });
    }
    return inflateState(parsed);
  } catch {
    return null;
  }
}

export function encodeState(state) {
  return encodeCompactState(state);
}

export function decodeState(payload) {
  return decodeCompactState(payload) ?? decodeLegacyState(payload);
}

export function readStateFromUrl() {
  const match = window.location.hash.match(/^#f=(.+)$/);
  return match ? decodeState(match[1]) : null;
}

export function writeStateToUrl(state) {
  const payload = encodeState(state);
  const nextUrl = new URL(window.location.href);
  nextUrl.hash = `f=${payload}`;
  const url = nextUrl.toString();
  try {
    window.history.replaceState(null, "", url);
  } catch {
    return url;
  }
  return url;
}
