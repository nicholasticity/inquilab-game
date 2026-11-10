/** Top-down mission maps. Tile coords. Terrain is carved, then markers are compiled out. */

export interface XY {
  x: number;
  y: number;
}

export interface GuardSpawn {
  x: number;
  y: number;
  x2: number;
  y2: number;
  kind: "constable" | "officer" | "soldier";
  tag: string;
  range?: number;
}

export interface LampSpawn {
  x: number;
  y: number;
  r: number;
}

export interface PaperSpawn {
  x: number;
  y: number;
  req: boolean;
}

export interface Mission {
  id: number;
  cols: number;
  rows: number;
  tiles: string[];
  start: XY;
  exit: XY;
  choice: XY;
  choiceId: string;
  papers: PaperSpawn[];
  uniforms: XY[];
  lamps: LampSpawn[];
  locks: XY[];
  checks: XY[];
  guards: GuardSpawn[];
  guide: XY[];
}

function blank(cols: number, rows: number): string[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => "#"));
}

function fill(t: string[][], x: number, y: number, w: number, h: number, ch: string): void {
  for (let yy = y; yy < y + h; yy++) {
    const row = t[yy];
    if (!row) continue;
    for (let xx = x; xx < x + w; xx++) {
      if (row[xx] !== undefined) row[xx] = ch;
    }
  }
}

function put(t: string[][], x: number, y: number, ch: string): void {
  const row = t[y];
  if (row && x >= 0 && x < row.length) row[x] = ch;
}

function compile(
  grid: string[][],
  id: number,
  choiceId: string,
  guards: GuardSpawn[],
  lamps: LampSpawn[],
  guide: XY[],
): Mission {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const tiles: string[] = [];
  const mission: Mission = {
    id, cols, rows, tiles,
    start: { x: 2, y: 2 }, exit: { x: 3, y: 2 }, choice: { x: 2, y: 2 }, choiceId,
    papers: [], uniforms: [], lamps, locks: [], checks: [], guards, guide,
  };
  for (let y = 0; y < rows; y++) {
    let line = "";
    const row = grid[y] ?? [];
    for (let x = 0; x < cols; x++) {
      let ch = row[x] ?? "#";
      if (ch === "S") { mission.start = { x, y }; ch = ","; }
      else if (ch === "E") { mission.exit = { x, y }; ch = ","; }
      else if (ch === "?") { mission.choice = { x, y }; ch = ","; }
      else if (ch === "*") { mission.papers.push({ x, y, req: true }); ch = ","; }
      else if (ch === "o") { mission.papers.push({ x, y, req: false }); ch = ","; }
      else if (ch === "U") { mission.uniforms.push({ x, y }); ch = ","; }
      else if (ch === "+") { mission.checks.push({ x, y }); ch = ","; }
      else if (ch === "=") mission.locks.push({ x, y });
      line += ch;
    }
    tiles.push(line);
  }
  return mission;
}

function lahore(): Mission {
  const g = blank(36, 22);
  fill(g, 1, 8, 8, 8, ",");
  fill(g, 2, 2, 2, 6, ",");
  fill(g, 2, 2, 32, 2, "v");
  fill(g, 28, 4, 6, 8, ",");
  fill(g, 10, 6, 16, 9, ".");
  fill(g, 1, 16, 34, 4, ",");
  put(g, 9, 12, ",");
  put(g, 26, 8, ",");
  put(g, 27, 8, "=");
  put(g, 4, 10, "g");
  put(g, 5, 10, "g");
  put(g, 5, 14, "h");
  put(g, 14, 12, "c");
  put(g, 15, 12, "c");
  put(g, 20, 8, "o");
  put(g, 3, 12, "S");
  put(g, 31, 6, "*");
  put(g, 31, 9, "?");
  put(g, 33, 3, "E");
  put(g, 3, 14, "+");
  put(g, 31, 5, "+");
  return compile(g, 1, "courier", [
    { x: 14, y: 10, x2: 22, y2: 10, kind: "constable", tag: "" },
    { x: 16, y: 8, x2: 23, y2: 8, kind: "officer", tag: "officer" },
    { x: 8, y: 18, x2: 16, y2: 18, kind: "constable", tag: "chase" },
  ], [{ x: 18, y: 10, r: 96 }], [
    { x: 3, y: 12 }, { x: 3, y: 3 }, { x: 31, y: 3 }, { x: 31, y: 6 },
    { x: 31, y: 9 }, { x: 31, y: 3 }, { x: 33, y: 3 },
  ]);
}

function railway(): Mission {
  const g = blank(36, 22);
  fill(g, 1, 8, 8, 8, ",");
  fill(g, 1, 16, 34, 4, ",");
  fill(g, 10, 5, 16, 9, ".");
  fill(g, 28, 8, 6, 8, ",");
  fill(g, 30, 8, 2, 10, ",");
  put(g, 26, 10, ",");
  put(g, 27, 10, "=");
  put(g, 12, 12, "c");
  put(g, 13, 12, "c");
  put(g, 18, 7, "h");
  put(g, 4, 17, "U");
  put(g, 3, 18, "S");
  put(g, 31, 11, "*");
  put(g, 31, 13, "?");
  put(g, 33, 18, "E");
  put(g, 6, 18, "+");
  put(g, 24, 18, "+");
  return compile(g, 2, "train", [
    { x: 13, y: 8, x2: 21, y2: 8, kind: "constable", tag: "watch" },
    { x: 15, y: 11, x2: 22, y2: 11, kind: "constable", tag: "watch" },
    { x: 17, y: 6, x2: 23, y2: 6, kind: "officer", tag: "officer" },
  ], [{ x: 18, y: 9, r: 100 }], [
    { x: 3, y: 18 }, { x: 31, y: 18 }, { x: 31, y: 11 }, { x: 31, y: 13 },
    { x: 31, y: 18 }, { x: 33, y: 18 },
  ]);
}

function workshop(): Mission {
  const g = blank(36, 22);
  fill(g, 1, 2, 6, 18, ",");
  fill(g, 1, 2, 33, 3, ",");
  fill(g, 28, 6, 6, 8, ",");
  fill(g, 30, 4, 2, 3, ",");
  fill(g, 30, 14, 3, 6, ",");
  fill(g, 10, 6, 16, 10, ".");
  put(g, 26, 10, ",");
  put(g, 27, 10, "=");
  put(g, 18, 12, "c");
  put(g, 19, 12, "c");
  put(g, 14, 14, "h");
  put(g, 22, 8, "o");
  put(g, 3, 10, "S");
  put(g, 31, 8, "*");
  put(g, 31, 11, "?");
  put(g, 32, 18, "E");
  put(g, 3, 16, "+");
  put(g, 31, 6, "+");
  return compile(g, 3, "papers", [
    { x: 14, y: 10, x2: 22, y2: 10, kind: "constable", tag: "" },
    { x: 13, y: 13, x2: 21, y2: 13, kind: "officer", tag: "officer" },
    { x: 16, y: 8, x2: 22, y2: 8, kind: "constable", tag: "chase", range: 100 },
  ], [{ x: 18, y: 10, r: 110 }], [
    { x: 3, y: 10 }, { x: 3, y: 3 }, { x: 31, y: 3 }, { x: 31, y: 8 },
    { x: 31, y: 11 }, { x: 31, y: 18 }, { x: 32, y: 18 },
  ]);
}

function assembly(): Mission {
  const g = blank(36, 22);
  fill(g, 1, 2, 34, 4, ",");
  fill(g, 2, 8, 8, 8, ",");
  fill(g, 3, 6, 2, 2, ",");
  fill(g, 12, 8, 18, 8, ".");
  put(g, 10, 12, ",");
  put(g, 11, 12, ",");
  put(g, 20, 11, "n");
  put(g, 21, 11, "n");
  put(g, 22, 12, "c");
  put(g, 4, 4, "S");
  put(g, 5, 12, "*");
  put(g, 6, 12, "?");
  put(g, 32, 3, "E");
  put(g, 8, 4, "+");
  put(g, 24, 4, "+");
  return compile(g, 4, "assembly", [
    { x: 16, y: 10, x2: 26, y2: 10, kind: "officer", tag: "officer" },
    { x: 15, y: 13, x2: 25, y2: 13, kind: "constable", tag: "" },
    { x: 18, y: 9, x2: 24, y2: 9, kind: "soldier", tag: "chase", range: 96 },
  ], [{ x: 20, y: 12, r: 100 }], [
    { x: 4, y: 4 }, { x: 4, y: 12 }, { x: 6, y: 12 }, { x: 4, y: 12 },
    { x: 4, y: 4 }, { x: 32, y: 4 }, { x: 32, y: 3 },
  ]);
}

function jail(): Mission {
  const g = blank(36, 22);
  fill(g, 1, 10, 34, 3, ",");
  fill(g, 5, 3, 8, 6, ",");
  fill(g, 18, 3, 12, 6, ".");
  fill(g, 27, 14, 7, 5, ",");
  put(g, 8, 9, "=");
  put(g, 22, 9, "=");
  put(g, 30, 13, "=");
  put(g, 8, 6, "h");
  put(g, 3, 11, "S");
  put(g, 8, 5, "*");
  put(g, 20, 11, "?");
  put(g, 33, 11, "E");
  put(g, 5, 11, "+");
  put(g, 26, 11, "+");
  return compile(g, 5, "warder", [
    { x: 20, y: 5, x2: 27, y2: 5, kind: "soldier", tag: "chase" },
    { x: 30, y: 16, x2: 32, y2: 16, kind: "officer", tag: "officer", range: 80 },
  ], [{ x: 22, y: 5, r: 80 }], [
    { x: 3, y: 11 }, { x: 8, y: 11 }, { x: 8, y: 5 }, { x: 8, y: 11 },
    { x: 20, y: 11 }, { x: 33, y: 11 },
  ]);
}

function viceroy(): Mission {
  const g = blank(36, 22);
  fill(g, 1, 8, 8, 8, ",");
  fill(g, 2, 2, 2, 6, ",");
  fill(g, 2, 2, 32, 2, "v");
  fill(g, 28, 5, 6, 8, ",");
  fill(g, 30, 3, 2, 3, ",");
  fill(g, 30, 12, 2, 3, ",");
  fill(g, 28, 14, 6, 6, ",");
  fill(g, 10, 7, 16, 8, ".");
  put(g, 9, 12, ",");
  put(g, 26, 16, ",");
  put(g, 27, 16, "=");
  put(g, 18, 11, "c");
  put(g, 6, 14, "g");
  put(g, 7, 14, "g");
  put(g, 4, 13, "h");
  put(g, 3, 12, "S");
  put(g, 31, 7, "*");
  put(g, 31, 10, "?");
  put(g, 32, 17, "E");
  put(g, 3, 14, "+");
  put(g, 31, 6, "+");
  return compile(g, 6, "signal", [
    { x: 14, y: 10, x2: 22, y2: 10, kind: "soldier", tag: "chase" },
    { x: 15, y: 12, x2: 23, y2: 12, kind: "officer", tag: "officer" },
  ], [{ x: 18, y: 11, r: 100 }], [
    { x: 3, y: 12 }, { x: 3, y: 3 }, { x: 31, y: 3 }, { x: 31, y: 7 },
    { x: 31, y: 10 }, { x: 31, y: 17 }, { x: 32, y: 17 },
  ]);
}

const BUILDERS = [lahore, railway, workshop, assembly, jail, viceroy];

export function missionById(id: number): Mission {
  const build = BUILDERS[id - 1];
  if (!build) throw new Error("No mission " + String(id));
  return build();
}
