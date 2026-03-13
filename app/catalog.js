const assetDefinitions = [
  ["half_t", "A"],
  ["half_b", "B"],
  ["half_l", "C"],
  ["half_r", "D"],
  ["center_hline", "E"],
  ["center_vline", "F"],
  ["diag_bl", "G"],
  ["diag_br", "H"],
  ["tricolor_l", "I"],
  ["tricolor_c", "J"],
  ["tricolor_r", "K"],
  ["tricolor_t", "L"],
  ["tricolor_m", "M"],
  ["tricolor_b", "N"],
  ["triangle_t", "O"],
  ["triangle_b", "P"],
  ["triangle_l", "Q"],
  ["triangle_r", "R"],
  ["triangle_tl", "S"],
  ["triangle_tr", "T"],
  ["triangle_bl", "U"],
  ["triangle_br", "V"],
  ["mini_tr_tl", "W"],
  ["mini_tr_tr", "X"],
  ["mini_tr_bl", "Y"],
  ["mini_tr_br", "Z"],
  ["center_circle", "a"],
  ["center_star", "b"],
  ["center_flower", "c"],
  ["flower_tl", "d"],
  ["flower_tc", "e"],
  ["flower_tr", "f"],
  ["octagram", "g"],
  ["octagram_2", "h"],
  ["eu_star", "i"],
  ["laurel_wreath", "j"],
  ["nato_emblem", "k"],
  ["rocket", "l"],
  ["rocket_mini", "m"],
  ["translator", "n"],
  ["admin_contributors", "o"],
  ["admin_evan", "p"],
  ["admin_shield", "q"],
  ["admin_shield_r", "r"],
  ["beta_tester", "s"],
  ["beta_tester_circle", "t"]
];

const labels = {
  admin_contributors: "Admin Contributors",
  admin_evan: "Admin Evan",
  admin_shield: "Admin Shield",
  admin_shield_r: "Admin Shield Right",
  beta_tester: "Beta Tester",
  beta_tester_circle: "Beta Tester Circle",
  center_circle: "Center Circle",
  center_flower: "Center Flower",
  center_hline: "Center Horizontal Band",
  center_star: "Center Star",
  center_vline: "Center Vertical Band",
  diag_bl: "Diagonal Bottom Left",
  diag_br: "Diagonal Bottom Right",
  eu_star: "EU Star",
  flower_tc: "Top Center Flower",
  flower_tl: "Top Left Flower",
  flower_tr: "Top Right Flower",
  half_b: "Bottom Half",
  half_l: "Left Half",
  half_r: "Right Half",
  half_t: "Top Half",
  laurel_wreath: "Laurel Wreath",
  mini_tr_bl: "Mini Bottom Left Triangle",
  mini_tr_br: "Mini Bottom Right Triangle",
  mini_tr_tl: "Mini Top Left Triangle",
  mini_tr_tr: "Mini Top Right Triangle",
  nato_emblem: "NATO Emblem",
  octagram: "Octagram",
  octagram_2: "Octagram II",
  rocket: "Rocket",
  rocket_mini: "Mini Rocket",
  translator: "Translator",
  triangle_b: "Bottom Triangle",
  triangle_bl: "Bottom Left Triangle",
  triangle_br: "Bottom Right Triangle",
  triangle_l: "Left Triangle",
  triangle_r: "Right Triangle",
  triangle_t: "Top Triangle",
  triangle_tl: "Top Left Triangle",
  triangle_tr: "Top Right Triangle",
  tricolor_b: "Bottom Third",
  tricolor_c: "Center Third",
  tricolor_l: "Left Third",
  tricolor_m: "Middle Third",
  tricolor_r: "Right Third",
  tricolor_t: "Top Third"
};

const groups = [
  { id: "bands", title: "Bands and fields" },
  { id: "triangles", title: "Triangles" },
  { id: "symbols", title: "Symbols and marks" }
];

function createAssetUrl(fileName) {
  return new URL(`../custom/${fileName}`, import.meta.url).href;
}

function getGroupId(assetId) {
  if (
    assetId.startsWith("half_") ||
    assetId.startsWith("tricolor_") ||
    assetId.startsWith("center_hline") ||
    assetId.startsWith("center_vline") ||
    assetId.startsWith("diag_")
  ) {
    return "bands";
  }

  if (assetId.startsWith("triangle_") || assetId.startsWith("mini_tr_")) {
    return "triangles";
  }

  return "symbols";
}

export const BASE_LAYER = {
  id: "full",
  label: "Base field",
  path: createAssetUrl("full.svg")
};

export const FRAME_LAYER = {
  id: "frame",
  label: "Frame",
  path: createAssetUrl("frame.svg")
};

export const assetGroups = groups;

export const assets = assetDefinitions.map(([assetId, shareCode]) => ({
  id: assetId,
  label: labels[assetId] ?? assetId.replaceAll("_", " "),
  groupId: getGroupId(assetId),
  path: createAssetUrl(`${assetId}.svg`),
  thumbPath: createAssetUrl(`${assetId}.svg`),
  shareCode
}));

const assetById = new Map(assets.map((asset) => [asset.id, asset]));
const assetByShareCode = new Map(assets.map((asset) => [asset.shareCode, asset]));

export function getAsset(assetId) {
  return assetById.get(assetId) ?? null;
}

export function getAssetByShareCode(code) {
  return assetByShareCode.get(code) ?? null;
}

export function getAssetShareCode(assetId) {
  return assetById.get(assetId)?.shareCode ?? null;
}
