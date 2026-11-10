import type { Cell, Dir, Pos, Room, RoomState } from "./types";

export const DIRS: Dir[] = ["up", "right", "down", "left"];

export const DELTA: Record<Dir, Pos> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function opposite(dir: Dir): Dir {
  if (dir === "up") return "down";
  if (dir === "down") return "up";
  if (dir === "left") return "right";
  return "left";
}

export function turnRight(dir: Dir): Dir {
  if (dir === "up") return "right";
  if (dir === "right") return "down";
  if (dir === "down") return "left";
  return "up";
}

export function cellKey(x: number, y: number): string {
  return x + "," + y;
}

export function cellDef(room: Room, x: number, y: number): Cell | null {
  if (x < 0 || y < 0 || x >= room.cols || y >= room.rows) return null;
  for (const cell of room.cells) {
    if (cell.x === x && cell.y === y) return cell;
  }
  return null;
}

export function dirBetween(from: Pos, to: Pos): Dir | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 0 && dy === 0) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}

export function exitLocked(state: RoomState, cell: Cell): boolean {
  if (cell.kind !== "exit" || !cell.blockedUntil) return false;
  if (cell.blockedUntil === "hasPlans") return !state.hasPlans;
  if (cell.blockedUntil === "savedCourier") return !state.savedCourier;
  return false;
}

/** A cell a guard may see or walk through. Locked exits are closed doors. */
export function passable(state: RoomState, x: number, y: number): boolean {
  const cell = cellDef(state.room, x, y);
  if (!cell || cell.kind === "void") return false;
  if (exitLocked(state, cell)) return false;
  return true;
}

export function isLit(state: RoomState, x: number, y: number): boolean {
  const cell = cellDef(state.room, x, y);
  if (!cell) return false;
  if (state.taken[cellKey(x, y)]) return cell.ground === "light";
  if (cell.kind === "light") return true;
  if (cell.ground === "light") return true;
  return false;
}

export function playerHiding(state: RoomState): boolean {
  const cell = cellDef(state.room, state.playerX, state.playerY);
  return cell?.kind === "hide";
}

export function adjacent(ax: number, ay: number, bx: number, by: number): boolean {
  return Math.abs(ax - bx) + Math.abs(ay - by) === 1;
}

export function pathDist(state: RoomState, x0: number, y0: number, x1: number, y1: number): number {
  if (x0 === x1 && y0 === y1) return 0;
  if (!passable(state, x1, y1)) return Infinity;
  const start = cellKey(x0, y0);
  const goal = cellKey(x1, y1);
  const queue: { x: number; y: number; d: number }[] = [{ x: x0, y: y0, d: 0 }];
  const seen = new Set<string>([start]);
  while (queue.length > 0) {
    const cur = queue.shift();
    if (!cur) break;
    for (const dir of DIRS) {
      const x = cur.x + DELTA[dir].x;
      const y = cur.y + DELTA[dir].y;
      const key = cellKey(x, y);
      if (seen.has(key) || !passable(state, x, y)) continue;
      if (key === goal) return cur.d + 1;
      seen.add(key);
      queue.push({ x, y, d: cur.d + 1 });
    }
  }
  return Infinity;
}

/** First step from (x0,y0) along a shortest path to (x1,y1). */
export function pathNext(state: RoomState, x0: number, y0: number, x1: number, y1: number): Pos | null {
  if (x0 === x1 && y0 === y1) return null;
  if (!passable(state, x1, y1)) return null;
  const origin = cellKey(x0, y0);
  const queue: Pos[] = [{ x: x0, y: y0 }];
  const prev = new Map<string, string>();
  prev.set(origin, "");
  while (queue.length > 0) {
    const cur = queue.shift();
    if (!cur) break;
    for (const dir of DIRS) {
      const x = cur.x + DELTA[dir].x;
      const y = cur.y + DELTA[dir].y;
      if (!passable(state, x, y)) continue;
      const key = cellKey(x, y);
      if (prev.has(key)) continue;
      prev.set(key, cellKey(cur.x, cur.y));
      if (x === x1 && y === y1) {
        let node = key;
        let parent = prev.get(node) ?? "";
        while (parent !== origin) {
          node = parent;
          parent = prev.get(node) ?? "";
        }
        const [nx, ny] = node.split(",").map(Number);
        return { x: nx, y: ny };
      }
      queue.push({ x, y });
    }
  }
  return null;
}

export function abilityCells(state: RoomState): Cell[] {
  return state.room.cells.filter((cell) => cell.kind === "ability" && !state.taken[cellKey(cell.x, cell.y)]);
}

export function soundCells(state: RoomState, x: number, y: number): Pos[] {
  const cells: Pos[] = [{ x, y }];
  for (const dir of DIRS) {
    const nx = x + DELTA[dir].x;
    const ny = y + DELTA[dir].y;
    if (passable(state, nx, ny)) cells.push({ x: nx, y: ny });
  }
  return cells;
}
