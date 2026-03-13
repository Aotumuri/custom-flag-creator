import { base64UrlToBytes } from "./base64url.js";
import { inflateState, normalizeState } from "./model.js";
import { decodeCompactState, encodeCompactState } from "./share-compact.js";

const decoder = new TextDecoder();

function decodeLegacyState(payload) {
  try {
    const json = decoder.decode(base64UrlToBytes(payload));
    return inflateState(JSON.parse(json));
  } catch {
    return null;
  }
}

function buildHashUrl(baseUrl, payload) {
  const nextUrl = new URL(baseUrl, window.location.href);
  nextUrl.hash = `f=${payload}`;
  return nextUrl.toString();
}

export function encodeState(state) {
  return encodeCompactState(normalizeState(state));
}

export function decodeState(payload) {
  return decodeCompactState(payload) ?? decodeLegacyState(payload);
}

export function readStateFromUrl() {
  const match = window.location.hash.match(/^#f=(.+)$/);
  return match ? decodeState(match[1]) : null;
}

export function buildStandaloneSvgUrl(state) {
  return buildHashUrl("./svg/", encodeState(state));
}

export function writeStateToUrl(state) {
  const url = buildHashUrl(window.location.href, encodeState(state));
  try {
    window.history.replaceState(null, "", url);
  } catch {
    return url;
  }
  return url;
}
