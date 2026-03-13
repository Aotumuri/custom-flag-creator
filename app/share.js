import { getAssetByShareCode, getAssetShareCode } from "./catalog.js";
import {
  inflateState,
  isDefaultLayerTransform,
  LAYER_TRANSFORM_LIMITS,
  normalizeState
} from "./model.js";
import { getPresetCode, getPresetColor } from "./palette.js";

const decoder = new TextDecoder();
const BASE64URL_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const SHARE_PREFIX = "!";
const LEGACY_TRANSFORM_MARKER = "-";
const LEGACY_TRANSFORM_TOKEN_LENGTH = 4;
const LEGACY_UNIFORM_TRANSFORM_MARKER = "_";
const LEGACY_UNIFORM_TRANSFORM_TOKEN_LENGTH = 5;
const TRANSFORM_MARKER = ".";
const TRANSFORM_TOKEN_LENGTH = 7;

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

function encodeFixedWidthValue(value, length) {
  let remainder = value;
  let result = "";
  for (let index = 0; index < length; index += 1) {
    result = `${BASE64URL_ALPHABET[remainder % 64]}${result}`;
    remainder = Math.floor(remainder / 64);
  }
  return result;
}

function decodeFixedWidthValue(token) {
  let value = 0;
  for (const char of token) {
    const index = BASE64URL_ALPHABET.indexOf(char);
    if (index < 0) {
      return null;
    }
    value = value * 64 + index;
  }
  return value;
}

function decodeSignedTransformValue(value, bits, maxAbs) {
  const offset = 1 << (bits - 1);
  const bucketMax = offset - 1;
  return Math.round(((value - offset) * maxAbs) / bucketMax);
}

function decodeScaleTransformValue(value) {
  const { min, max } = LAYER_TRANSFORM_LIMITS.scaleX;
  return Math.round(min + (value * (max - min)) / 31);
}

function encodeTransformToken(layer) {
  const offsetXSpan = LAYER_TRANSFORM_LIMITS.offsetX.max - LAYER_TRANSFORM_LIMITS.offsetX.min + 1;
  const offsetYSpan = LAYER_TRANSFORM_LIMITS.offsetY.max - LAYER_TRANSFORM_LIMITS.offsetY.min + 1;
  const scaleXSpan = LAYER_TRANSFORM_LIMITS.scaleX.max - LAYER_TRANSFORM_LIMITS.scaleX.min + 1;
  const scaleYSpan = LAYER_TRANSFORM_LIMITS.scaleY.max - LAYER_TRANSFORM_LIMITS.scaleY.min + 1;
  const rotationSpan =
    LAYER_TRANSFORM_LIMITS.rotation.max - LAYER_TRANSFORM_LIMITS.rotation.min + 1;
  const packed =
    ((((layer.offsetX - LAYER_TRANSFORM_LIMITS.offsetX.min) * offsetYSpan +
      (layer.offsetY - LAYER_TRANSFORM_LIMITS.offsetY.min)) *
      scaleXSpan +
      (layer.scaleX - LAYER_TRANSFORM_LIMITS.scaleX.min)) *
      scaleYSpan +
      (layer.scaleY - LAYER_TRANSFORM_LIMITS.scaleY.min)) *
      rotationSpan +
    (layer.rotation - LAYER_TRANSFORM_LIMITS.rotation.min);
  return encodeFixedWidthValue(packed, TRANSFORM_TOKEN_LENGTH);
}

function decodeTransformToken(token) {
  const packed = decodeFixedWidthValue(token);
  if (packed === null) {
    return null;
  }

  const offsetXSpan = LAYER_TRANSFORM_LIMITS.offsetX.max - LAYER_TRANSFORM_LIMITS.offsetX.min + 1;
  const offsetYSpan = LAYER_TRANSFORM_LIMITS.offsetY.max - LAYER_TRANSFORM_LIMITS.offsetY.min + 1;
  const scaleXSpan = LAYER_TRANSFORM_LIMITS.scaleX.max - LAYER_TRANSFORM_LIMITS.scaleX.min + 1;
  const scaleYSpan = LAYER_TRANSFORM_LIMITS.scaleY.max - LAYER_TRANSFORM_LIMITS.scaleY.min + 1;
  const rotationSpan =
    LAYER_TRANSFORM_LIMITS.rotation.max - LAYER_TRANSFORM_LIMITS.rotation.min + 1;
  const totalValues = offsetXSpan * offsetYSpan * scaleXSpan * scaleYSpan * rotationSpan;
  if (packed >= totalValues) {
    return null;
  }

  let remainder = packed;
  const rotation = (remainder % rotationSpan) + LAYER_TRANSFORM_LIMITS.rotation.min;
  remainder = Math.floor(remainder / rotationSpan);
  const scaleY = (remainder % scaleYSpan) + LAYER_TRANSFORM_LIMITS.scaleY.min;
  remainder = Math.floor(remainder / scaleYSpan);
  const scaleX = (remainder % scaleXSpan) + LAYER_TRANSFORM_LIMITS.scaleX.min;
  remainder = Math.floor(remainder / scaleXSpan);
  const offsetY = (remainder % offsetYSpan) + LAYER_TRANSFORM_LIMITS.offsetY.min;
  remainder = Math.floor(remainder / offsetYSpan);
  const offsetX = remainder + LAYER_TRANSFORM_LIMITS.offsetX.min;

  return { offsetX, offsetY, scaleX, scaleY, rotation };
}

function decodeLegacyTransformToken(token) {
  const packed = decodeFixedWidthValue(token);
  if (packed === null) {
    return null;
  }

  return {
    offsetX: decodeSignedTransformValue((packed >> 15) & 0b111111, 6, LAYER_TRANSFORM_LIMITS.offsetX.max),
    offsetY: decodeSignedTransformValue((packed >> 9) & 0b111111, 6, LAYER_TRANSFORM_LIMITS.offsetY.max),
    rotation: decodeSignedTransformValue(packed & 0b1111, 4, LAYER_TRANSFORM_LIMITS.rotation.max),
    scaleX: decodeScaleTransformValue((packed >> 4) & 0b11111),
    scaleY: decodeScaleTransformValue((packed >> 4) & 0b11111)
  };
}

function decodeLegacyUniformTransformToken(token) {
  const packed = decodeFixedWidthValue(token);
  if (packed === null) {
    return null;
  }

  const offsetXSpan = LAYER_TRANSFORM_LIMITS.offsetX.max - LAYER_TRANSFORM_LIMITS.offsetX.min + 1;
  const offsetYSpan = LAYER_TRANSFORM_LIMITS.offsetY.max - LAYER_TRANSFORM_LIMITS.offsetY.min + 1;
  const scaleSpan = LAYER_TRANSFORM_LIMITS.scaleX.max - LAYER_TRANSFORM_LIMITS.scaleX.min + 1;
  const rotationSpan =
    LAYER_TRANSFORM_LIMITS.rotation.max - LAYER_TRANSFORM_LIMITS.rotation.min + 1;
  const totalValues = offsetXSpan * offsetYSpan * scaleSpan * rotationSpan;
  if (packed >= totalValues) {
    return null;
  }

  let remainder = packed;
  const rotation = (remainder % rotationSpan) + LAYER_TRANSFORM_LIMITS.rotation.min;
  remainder = Math.floor(remainder / rotationSpan);
  const scale = (remainder % scaleSpan) + LAYER_TRANSFORM_LIMITS.scaleX.min;
  remainder = Math.floor(remainder / scaleSpan);
  const offsetY = (remainder % offsetYSpan) + LAYER_TRANSFORM_LIMITS.offsetY.min;
  remainder = Math.floor(remainder / offsetYSpan);
  const offsetX = remainder + LAYER_TRANSFORM_LIMITS.offsetX.min;

  return { offsetX, offsetY, scaleX: scale, scaleY: scale, rotation };
}

function encodeCompactState(state) {
  const baseToken = colorToToken(state.baseColor);
  const layerTokens = state.layers
    .map((layer) => {
      const assetCode = getAssetShareCode(layer.assetId);
      if (assetCode === null) {
        throw new Error("Unknown asset");
      }
      const transformToken = isDefaultLayerTransform(layer)
        ? ""
        : `${TRANSFORM_MARKER}${encodeTransformToken(layer)}`;
      return `${assetCode}${colorToToken(layer.color)}${transformToken}`;
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
      let layerColor = tokenToColor(colorMode);
      if (!layerColor) {
        if (colorMode !== "~") {
          return null;
        }

        layerColor = bytesToHexColor(base64UrlToBytes(payload.slice(cursor, cursor + 4)));
        if (!layerColor) {
          return null;
        }

        cursor += 4;
      }

      const layer = { assetId, color: layerColor };
      if (payload[cursor] === TRANSFORM_MARKER) {
        const transform = decodeTransformToken(
          payload.slice(cursor + 1, cursor + 1 + TRANSFORM_TOKEN_LENGTH)
        );
        if (!transform) {
          return null;
        }
        Object.assign(layer, transform);
        cursor += 1 + TRANSFORM_TOKEN_LENGTH;
      } else if (payload[cursor] === LEGACY_UNIFORM_TRANSFORM_MARKER) {
        const transform = decodeLegacyUniformTransformToken(
          payload.slice(cursor + 1, cursor + 1 + LEGACY_UNIFORM_TRANSFORM_TOKEN_LENGTH)
        );
        if (!transform) {
          return null;
        }
        Object.assign(layer, transform);
        cursor += 1 + LEGACY_UNIFORM_TRANSFORM_TOKEN_LENGTH;
      } else if (payload[cursor] === LEGACY_TRANSFORM_MARKER) {
        const transform = decodeLegacyTransformToken(
          payload.slice(cursor + 1, cursor + 1 + LEGACY_TRANSFORM_TOKEN_LENGTH)
        );
        if (!transform) {
          return null;
        }
        Object.assign(layer, transform);
        cursor += 1 + LEGACY_TRANSFORM_TOKEN_LENGTH;
      }

      layers.push(layer);
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
    return inflateState(parsed);
  } catch {
    return null;
  }
}

export function encodeState(state) {
  const normalized = normalizeState(state);
  return encodeCompactState(normalized);
}

export function decodeState(payload) {
  return decodeCompactState(payload) ?? decodeLegacyState(payload);
}

export function readStateFromUrl() {
  const match = window.location.hash.match(/^#f=(.+)$/);
  return match ? decodeState(match[1]) : null;
}

export function buildStandaloneSvgUrl(state) {
  const payload = encodeState(state);
  const nextUrl = new URL("./svg/", window.location.href);
  nextUrl.hash = `f=${payload}`;
  return nextUrl.toString();
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
