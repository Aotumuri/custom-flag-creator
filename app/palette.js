const presetDefinitions = [
  ["0", "#ffffff"],
  ["1", "#f2f2f2"],
  ["2", "#d9d9d9"],
  ["3", "#111111"],
  ["4", "#c1121f"],
  ["5", "#e76f51"],
  ["6", "#f4a261"],
  ["7", "#e9c46a"],
  ["8", "#90be6d"],
  ["9", "#2a9d8f"],
  ["a", "#118ab2"],
  ["b", "#1d4ed8"],
  ["c", "#264653"],
  ["d", "#6d597a"],
  ["e", "#b56576"],
  ["f", "#ff006e"]
];

export const COLOR_PRESETS = presetDefinitions.map(([code, value]) => ({
  code,
  value
}));

const presetByCode = new Map(COLOR_PRESETS.map((preset) => [preset.code, preset.value]));
const presetByValue = new Map(COLOR_PRESETS.map((preset) => [preset.value, preset.code]));

export function getPresetColor(code) {
  return presetByCode.get(code) ?? null;
}

export function getPresetCode(color) {
  return presetByValue.get(color.toLowerCase()) ?? null;
}
