import { LAYER_TRANSFORM_LIMITS } from "./model.js";

const BASE64URL_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export const LEGACY_TRANSFORM_MARKER = "-";
export const LEGACY_TRANSFORM_TOKEN_LENGTH = 4;
export const LEGACY_UNIFORM_TRANSFORM_MARKER = "_";
export const LEGACY_UNIFORM_TRANSFORM_TOKEN_LENGTH = 5;
export const TRANSFORM_MARKER = ".";
export const TRANSFORM_TOKEN_LENGTH = 7;

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

function getExactTransformSpans() {
  return {
    offsetX: LAYER_TRANSFORM_LIMITS.offsetX.max - LAYER_TRANSFORM_LIMITS.offsetX.min + 1,
    offsetY: LAYER_TRANSFORM_LIMITS.offsetY.max - LAYER_TRANSFORM_LIMITS.offsetY.min + 1,
    scaleX: LAYER_TRANSFORM_LIMITS.scaleX.max - LAYER_TRANSFORM_LIMITS.scaleX.min + 1,
    scaleY: LAYER_TRANSFORM_LIMITS.scaleY.max - LAYER_TRANSFORM_LIMITS.scaleY.min + 1,
    rotation: LAYER_TRANSFORM_LIMITS.rotation.max - LAYER_TRANSFORM_LIMITS.rotation.min + 1
  };
}

export function encodeTransformToken(layer) {
  const spans = getExactTransformSpans();
  const packed =
    ((((layer.offsetX - LAYER_TRANSFORM_LIMITS.offsetX.min) * spans.offsetY +
      (layer.offsetY - LAYER_TRANSFORM_LIMITS.offsetY.min)) *
      spans.scaleX +
      (layer.scaleX - LAYER_TRANSFORM_LIMITS.scaleX.min)) *
      spans.scaleY +
      (layer.scaleY - LAYER_TRANSFORM_LIMITS.scaleY.min)) *
      spans.rotation +
    (layer.rotation - LAYER_TRANSFORM_LIMITS.rotation.min);
  return encodeFixedWidthValue(packed, TRANSFORM_TOKEN_LENGTH);
}

export function decodeTransformToken(token) {
  const packed = decodeFixedWidthValue(token);
  if (packed === null) {
    return null;
  }

  const spans = getExactTransformSpans();
  const totalValues = spans.offsetX * spans.offsetY * spans.scaleX * spans.scaleY * spans.rotation;
  if (packed >= totalValues) {
    return null;
  }

  let remainder = packed;
  const rotation = (remainder % spans.rotation) + LAYER_TRANSFORM_LIMITS.rotation.min;
  remainder = Math.floor(remainder / spans.rotation);
  const scaleY = (remainder % spans.scaleY) + LAYER_TRANSFORM_LIMITS.scaleY.min;
  remainder = Math.floor(remainder / spans.scaleY);
  const scaleX = (remainder % spans.scaleX) + LAYER_TRANSFORM_LIMITS.scaleX.min;
  remainder = Math.floor(remainder / spans.scaleX);
  const offsetY = (remainder % spans.offsetY) + LAYER_TRANSFORM_LIMITS.offsetY.min;
  remainder = Math.floor(remainder / spans.offsetY);
  const offsetX = remainder + LAYER_TRANSFORM_LIMITS.offsetX.min;

  return { offsetX, offsetY, scaleX, scaleY, rotation };
}

export function decodeLegacyTransformToken(token) {
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

export function decodeLegacyUniformTransformToken(token) {
  const packed = decodeFixedWidthValue(token);
  if (packed === null) {
    return null;
  }

  const spans = {
    offsetX: LAYER_TRANSFORM_LIMITS.offsetX.max - LAYER_TRANSFORM_LIMITS.offsetX.min + 1,
    offsetY: LAYER_TRANSFORM_LIMITS.offsetY.max - LAYER_TRANSFORM_LIMITS.offsetY.min + 1,
    scale: LAYER_TRANSFORM_LIMITS.scaleX.max - LAYER_TRANSFORM_LIMITS.scaleX.min + 1,
    rotation: LAYER_TRANSFORM_LIMITS.rotation.max - LAYER_TRANSFORM_LIMITS.rotation.min + 1
  };
  const totalValues = spans.offsetX * spans.offsetY * spans.scale * spans.rotation;
  if (packed >= totalValues) {
    return null;
  }

  let remainder = packed;
  const rotation = (remainder % spans.rotation) + LAYER_TRANSFORM_LIMITS.rotation.min;
  remainder = Math.floor(remainder / spans.rotation);
  const scale = (remainder % spans.scale) + LAYER_TRANSFORM_LIMITS.scaleX.min;
  remainder = Math.floor(remainder / spans.scale);
  const offsetY = (remainder % spans.offsetY) + LAYER_TRANSFORM_LIMITS.offsetY.min;
  remainder = Math.floor(remainder / spans.offsetY);
  const offsetX = remainder + LAYER_TRANSFORM_LIMITS.offsetX.min;

  return { offsetX, offsetY, scaleX: scale, scaleY: scale, rotation };
}
