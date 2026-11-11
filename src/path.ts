export function astar(
  w: number,
  h: number,
  solid: (x: number, y: number) => boolean,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): { x: number; y: number }[] | null {
  if (x0 === x1 && y0 === y1) return [];
  const key = (x: number, y: number) => y * w + x;
  const open: { x: number; y: number; g: number; f: number }[] = [
    { x: x0, y: y0, g: 0, f: Math.abs(x1 - x0) + Math.abs(y1 - y0) },
  ];
  const came = new Map<number, number>();
  const best = new Map<number, number>([[key(x0, y0), 0]]);
  const closed = new Set<number>();
  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const cur = open.shift();
    if (!cur) break;
    const ck = key(cur.x, cur.y);
    if (closed.has(ck)) continue;
    if (cur.x === x1 && cur.y === y1) {
      const path: { x: number; y: number }[] = [{ x: cur.x, y: cur.y }];
      let k = ck;
      while (came.has(k)) {
        k = came.get(k)!;
        path.push({ x: k % w, y: Math.floor(k / w) });
      }
      path.pop();
      path.reverse();
      return path;
    }
    closed.add(ck);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      if (solid(nx, ny)) continue;
      const nk = key(nx, ny);
      if (closed.has(nk)) continue;
      const ng = cur.g + 1;
      if (ng >= (best.get(nk) ?? 1e9)) continue;
      best.set(nk, ng);
      came.set(nk, ck);
      open.push({ x: nx, y: ny, g: ng, f: ng + Math.abs(x1 - nx) + Math.abs(y1 - ny) });
    }
  }
  return null;
}

export function nearestOpen(
  w: number,
  h: number,
  solid: (x: number, y: number) => boolean,
  x: number,
  y: number,
): { x: number; y: number } | null {
  if (x >= 0 && y >= 0 && x < w && y < h && !solid(x, y)) return { x, y };
  for (let r = 1; r <= 8; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        if (!solid(nx, ny)) return { x: nx, y: ny };
      }
    }
  }
  return null;
}
