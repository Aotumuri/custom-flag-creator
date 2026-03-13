import { bytesToBase64Url, base64UrlToBytes } from "./base64url.js";
import { getAssetByShareCode, getAssetShareCode } from "./catalog.js";
import { inflateState, isDefaultLayerTransform } from "./model.js";
import { getPresetCode, getPresetColor } from "./palette.js";
import {
  decodeLegacyTransformToken,
  decodeLegacyUniformTransformToken,
  decodeTransformToken,
  encodeTransformToken,
  LEGACY_TRANSFORM_MARKER,
  LEGACY_TRANSFORM_TOKEN_LENGTH,
  LEGACY_UNIFORM_TRANSFORM_MARKER,
  LEGACY_UNIFORM_TRANSFORM_TOKEN_LENGTH,
  TRANSFORM_MARKER,
  TRANSFORM_TOKEN_LENGTH
} from "./share-transform.js";

const SHARE_PREFIX = "!";

function colorToToken(color) {
  const presetCode = getPresetCode(color);
  if (presetCode !== null) {
    return presetCode;
  }

  const hex = color.toLowerCase().slice(1);
  const bytes = Uint8Array.from(
    [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16))
  );
  return `~${bytesToBase64Url(bytes)}`;
}

function bytesToHexColor(bytes) {
  if (bytes.length !== 3) {
    return null;
  }

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `#${hex}`;
}

function readColorToken(payload, cursor) {
  const token = payload[cursor];
  if (!token) {
    return null;
  }

  const presetColor = getPresetColor(token);
  if (presetColor) {
    return { color: presetColor, nextCursor: cursor + 1 };
  }

  if (token !== "~") {
    return null;
  }

  const color = bytesToHexColor(base64UrlToBytes(payload.slice(cursor + 1, cursor + 5)));
  if (!color) {
    return null;
  }

  return { color, nextCursor: cursor + 5 };
}

function readTransformToken(payload, cursor) {
  const marker = payload[cursor];
  if (marker === TRANSFORM_MARKER) {
    const transform = decodeTransformToken(
      payload.slice(cursor + 1, cursor + 1 + TRANSFORM_TOKEN_LENGTH)
    );
    return transform
      ? { transform, nextCursor: cursor + 1 + TRANSFORM_TOKEN_LENGTH }
      : null;
  }

  if (marker === LEGACY_UNIFORM_TRANSFORM_MARKER) {
    const transform = decodeLegacyUniformTransformToken(
      payload.slice(cursor + 1, cursor + 1 + LEGACY_UNIFORM_TRANSFORM_TOKEN_LENGTH)
    );
    return transform
      ? { transform, nextCursor: cursor + 1 + LEGACY_UNIFORM_TRANSFORM_TOKEN_LENGTH }
      : null;
  }

  if (marker === LEGACY_TRANSFORM_MARKER) {
    const transform = decodeLegacyTransformToken(
      payload.slice(cursor + 1, cursor + 1 + LEGACY_TRANSFORM_TOKEN_LENGTH)
    );
    return transform
      ? { transform, nextCursor: cursor + 1 + LEGACY_TRANSFORM_TOKEN_LENGTH }
      : null;
  }

  return { transform: null, nextCursor: cursor };
}

export function encodeCompactState(state) {
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

export function decodeCompactState(payload) {
  try {
    if (!payload.startsWith(SHARE_PREFIX)) {
      return null;
    }

    const baseToken = readColorToken(payload, 1);
    if (!baseToken) {
      return null;
    }

    const layers = [];
    let cursor = baseToken.nextCursor;
    while (cursor < payload.length) {
      const assetId = getAssetByShareCode(payload[cursor])?.id;
      if (!assetId) {
        return null;
      }
      cursor += 1;

      const colorToken = readColorToken(payload, cursor);
      if (!colorToken) {
        return null;
      }
      cursor = colorToken.nextCursor;

      const layer = { assetId, color: colorToken.color };
      const transformToken = readTransformToken(payload, cursor);
      if (!transformToken) {
        return null;
      }
      if (transformToken.transform) {
        Object.assign(layer, transformToken.transform);
      }
      cursor = transformToken.nextCursor;
      layers.push(layer);
    }

    return inflateState({ baseColor: baseToken.color, layers });
  } catch {
    return null;
  }
}
