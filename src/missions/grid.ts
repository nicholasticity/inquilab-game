import type { Cell, CellKind, PropKind } from "../sim/types";

const KINDS: Record<string, CellKind> = {
  ".": "light",
  s: "shadow",
  H: "hide",
  P: "start",
  "*": "item",
  o: "note",
  C: "courier",
  T: "ability",
  L: "light",
  X: "shadow",
};

const PROPS: Record<string, PropKind> = {
  L: "lamp",
  T: "pot",
  H: "basket",
  "*": "plans",
  o: "note",
};

export function fromMap(map: string[], spec: Record<string, Partial<Cell> & { kind?: CellKind }> = {}): Cell[] {
  const width = map[0]?.length ?? 0;
  const cells: Cell[] = [];
  map.forEach((row, y) => {
    if (row.length !== width) throw new Error("Map row " + y + " is " + row.length + ", expected " + width);
    for (let x = 0; x < row.length; x += 1) {
      const ch = row[x];
      if (ch === "#") continue;
      const extra = spec[ch] ?? {};
      const kind = extra.kind ?? KINDS[ch];
      if (!kind) throw new Error("Unknown map token " + ch);
      const prop = extra.prop ?? PROPS[ch];
      const cell: Cell = { x, y, kind, ...extra };
      if (prop && !cell.prop) cell.prop = prop;
      if (kind === "item") cell.itemId = "plans";
      cells.push(cell);
    }
  });
  return cells;
}
