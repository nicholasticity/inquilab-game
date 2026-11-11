export const MAP_W = 48;
export const MAP_H = 14;
export const TILE = 16;

export const SPAWN = { x: 3, y: 6 };
export const CRATE = { x: 16, y: 8 };
export const PLATE = { x: 22, y: 8 };
export const BELL = { x: 28, y: 2 };
export const GRATE = { x: 36, y: 5 };
export const GATE = { x: 36, y: 9 };
export const LEAF = { x: 40, y: 5 };
export const SIGN = { x: 42, y: 9 };
export const GUARD_NODES = [
  { x: 18, y: 4 },
  { x: 33, y: 4 },
  { x: 33, y: 8 },
  { x: 18, y: 8 },
];
export const PILLARS = [
  { x: 20, y: 5 },
  { x: 31, y: 5 },
];
export const POTS = [
  { x: 10, y: 10 },
  { x: 34, y: 10 },
];
export const LANTERNS = [
  { x: 8, y: 2 },
  { x: 18, y: 2 },
  { x: 34, y: 2 },
];

function carve(g: string[][], x: number, y: number, w: number, h: number, ch: string): void {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const xx = x + i;
      const yy = y + j;
      if (xx >= 0 && yy >= 0 && xx < MAP_W && yy < MAP_H) g[yy][xx] = ch;
    }
  }
}

export function buildGrid(): string[] {
  const g = Array.from({ length: MAP_H }, () => Array.from({ length: MAP_W }, () => "#"));
  // Gali and courtyard. East building stays solid, then the two alcoves are cut.
  carve(g, 1, 3, 35, 8, ".");
  carve(g, 1, 3, 6, 2, "#");
  carve(g, 1, 8, 7, 3, "T");
  for (let x = 20; x <= 33; x++) g[3][x] = "~";
  for (const p of PILLARS) g[p.y][p.x] = "P";
  for (const p of POTS) g[p.y][p.x] = "&";
  g[CRATE.y][CRATE.x] = "+";
  g[PLATE.y][PLATE.x] = "=";
  g[SPAWN.y][SPAWN.x] = "@";
  g[2][12] = "H";
  g[2][13] = "H";
  g[BELL.y][BELL.x] = "B";
  carve(g, 37, 4, 6, 3, ".");
  g[GRATE.y][GRATE.x] = "g";
  g[LEAF.y][LEAF.x] = "L";
  carve(g, 37, 8, 6, 3, ".");
  g[GATE.y][GATE.x] = "K";
  g[SIGN.y][SIGN.x] = "S";
  return g.map((row) => row.join(""));
}

export const GRID = buildGrid();

const WALK = new Set([".", "@", "+", "=", "L", "S", "g", "K"]);

export function isWallChar(ch: string): boolean {
  return !WALK.has(ch) && ch !== "P" && ch !== "&";
}

/** Collision, ignoring the moving crate. Grate and gate can open. */
export function blockedTile(tx: number, ty: number, grateOpen: boolean, gateOpen: boolean, grid = GRID): boolean {
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return true;
  const ch = grid[ty][tx];
  if (ch === "g") return !grateOpen;
  if (ch === "K") return !gateOpen;
  if (ch === "P" || ch === "&" || ch === "T" || ch === "~") return true;
  if (ch === "#" || ch === "H" || ch === "B") return true;
  return false;
}

export function validateMap(): string[] {
  const errors: string[] = [];
  if (GRID.length !== MAP_H) errors.push("height");
  for (const row of GRID) if (row.length !== MAP_W) errors.push(`width ${row.length}`);
  const walk = (tx: number, ty: number, grate: boolean) => !blockedTile(tx, ty, grate, false);
  if (!walk(SPAWN.x, SPAWN.y, false)) errors.push("spawn blocked");
  if (blockedTile(CRATE.x, CRATE.y, false, false)) errors.push("crate blocked");
  if (blockedTile(PLATE.x, PLATE.y, false, false)) errors.push("plate blocked");
  for (const n of GUARD_NODES) if (blockedTile(n.x, n.y, false, false)) errors.push(`node ${n.x},${n.y}`);
  const flood = (grate: boolean) => {
    const seen = new Set<number>();
    const q = [SPAWN.y * MAP_W + SPAWN.x];
    seen.add(q[0]);
    while (q.length) {
      const k = q.pop()!;
      const x = k % MAP_W;
      const y = Math.floor(k / MAP_W);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nx = x + dx;
        const ny = y + dy;
        const nk = ny * MAP_W + nx;
        if (seen.has(nk)) continue;
        if (!walk(nx, ny, grate)) continue;
        seen.add(nk);
        q.push(nk);
      }
    }
    return seen;
  };
  const closed = flood(false);
  const open = flood(true);
  if (closed.has(LEAF.y * MAP_W + LEAF.x)) errors.push("leaflet reachable while grate shut");
  if (!open.has(LEAF.y * MAP_W + LEAF.x)) errors.push("leaflet unreachable when grate open");
  if (!closed.has(PLATE.y * MAP_W + PLATE.x)) errors.push("plate unreachable");
  // Straight push along y = CRATE.y must be clear aside from the crate tile itself.
  for (let x = CRATE.x; x <= PLATE.x; x++) {
    if (x === CRATE.x) continue;
    if (blockedTile(x, CRATE.y, false, false)) errors.push(`push path blocked at ${x}`);
  }
  if (CRATE.y !== PLATE.y) {
    if (blockedTile(PLATE.x, CRATE.y, false, false) && !(PLATE.x === CRATE.x)) {
      /* horizontal then vertical */
    }
    for (let y = Math.min(CRATE.y, PLATE.y); y <= Math.max(CRATE.y, PLATE.y); y++) {
      if (y === CRATE.y) continue;
      if (blockedTile(PLATE.x, y, false, false)) errors.push(`push column blocked ${y}`);
    }
  }
  return errors;
}
