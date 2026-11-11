/** Locked 32-colour ramp. Warm 1930s Lahore, derived from DawnBringer 32. Do not add swatches. */
export const PALETTE = [
  "#1a1210", // 0 ink
  "#2c1e18", // 1 deep
  "#4a3228", // 2 umber
  "#6b4632", // 3 wood
  "#8f6244", // 4 sand dark
  "#c49262", // 5 sand
  "#e6c79a", // 6 sand light
  "#f6e6c8", // 7 cream
  "#fbf3e4", // 8 whitewash
  "#1c2433", // 9 night
  "#2e4060", // 10 indigo
  "#5a7098", // 11 indigo light
  "#7a5a28", // 12 brass dark
  "#c4a04a", // 13 brass
  "#f0d878", // 14 alert yellow
  "#f8f0c8", // 15 hot yellow
  "#6e2830", // 16 maroon
  "#a83838", // 17 red
  "#e07060", // 18 rose
  "#e8b088", // 19 skin light
  "#c48458", // 20 skin
  "#8d5a38", // 21 skin shadow
  "#24321c", // 22 leaf dark
  "#3e6a32", // 23 leaf
  "#7aa250", // 24 leaf light
  "#3a3428", // 25 khaki dark
  "#6e6248", // 26 khaki
  "#a89870", // 27 khaki light
  "#2a3038", // 28 iron
  "#5c6772", // 29 iron mid
  "#98a4b0", // 30 iron light
  "#ffffff", // 31 flash white
] as const;

export const RGB: ReadonlyArray<readonly [number, number, number]> = PALETTE.map((hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
});

export const INK = 0;
export const CLEAR = 255;
