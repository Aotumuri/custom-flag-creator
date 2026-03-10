const assetNames = [
  "half_t",
  "half_b",
  "half_l",
  "half_r",
  "center_hline",
  "center_vline",
  "diag_bl",
  "diag_br",
  "tricolor_l",
  "tricolor_c",
  "tricolor_r",
  "tricolor_t",
  "tricolor_m",
  "tricolor_b",
  "triangle_t",
  "triangle_b",
  "triangle_l",
  "triangle_r",
  "triangle_tl",
  "triangle_tr",
  "triangle_bl",
  "triangle_br",
  "mini_tr_tl",
  "mini_tr_tr",
  "mini_tr_bl",
  "mini_tr_br",
  "center_circle",
  "center_star",
  "center_flower",
  "flower_tl",
  "flower_tc",
  "flower_tr",
  "octagram",
  "octagram_2",
  "eu_star",
  "laurel_wreath",
  "nato_emblem",
  "rocket",
  "rocket_mini",
  "translator",
  "admin_contributors",
  "admin_evan",
  "admin_shield",
  "admin_shield_r",
  "beta_tester",
  "beta_tester_circle"
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
  path: "./custom/full.svg"
};

export const FRAME_LAYER = {
  id: "frame",
  label: "Frame",
  path: "./custom/frame.svg"
};

export const assetGroups = groups;

export const assets = assetNames.map((assetId) => ({
  id: assetId,
  label: labels[assetId] ?? assetId.replaceAll("_", " "),
  groupId: getGroupId(assetId),
  path: `./custom/${assetId}.svg`,
  thumbPath: `./custom/${assetId}.svg`
}));

export function getAsset(assetId) {
  return assets.find((asset) => asset.id === assetId) ?? null;
}
