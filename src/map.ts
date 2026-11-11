import grid from "./grid.json";

export const TILE = grid.tile;
export const MAP_W = grid.w;
export const MAP_H = grid.h;
export const GRID: string[] = grid.rows;

export const SPAWN = { x: grid.spawn[0], y: grid.spawn[1] };
export const CRATE = { x: grid.crate[0], y: grid.crate[1] };
export const PLATE = { x: grid.plate[0], y: grid.plate[1] };
export const BELL = { x: grid.bell[0], y: grid.bell[1] };
export const GRATE = { x: grid.grate[0], y: grid.grate[1] };
export const GATE = { x: grid.gate[0], y: grid.gate[1] };
export const LEAF = { x: grid.leaf[0], y: grid.leaf[1] };
export const SIGN = { x: grid.sign[0], y: grid.sign[1] };
export const GUARD_NODES = grid.guard.map(([x, y]) => ({ x, y }));

const SOLID = new Set(["#", "B", "T", "W", "C", "P", "&"]);

/** Collision, ignoring the moving crate. Grate and gate can open. */
export function blockedTile(tx: number, ty: number, grateOpen: boolean, gateOpen: boolean, rows = GRID): boolean {
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return true;
  const ch = rows[ty][tx];
  if (ch === "g") return !grateOpen;
  if (ch === "K") return !gateOpen;
  return SOLID.has(ch);
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
  for (let x = CRATE.x; x <= PLATE.x; x++) {
    if (x === CRATE.x) continue;
    if (blockedTile(x, CRATE.y, false, false)) errors.push(`push path blocked at ${x}`);
  }
  return errors;
}
