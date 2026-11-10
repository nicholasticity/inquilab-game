/**
 * Painted files the loader fetches. The title waits on title.webp only.
 * Floors, props, and directional frames load with the mission that needs them.
 */

export const BG_PATHS: Record<string, string> = {
  title: "assets/bg/title.webp",
  finale: "assets/bg/finale.webp",
};

export const PORTRAIT_PATHS: Record<string, string> = {
  netaji: "assets/portraits/netaji.webp",
  kite: "assets/portraits/kite.webp",
  veil: "assets/portraits/veil.webp",
  key: "assets/portraits/key.webp",
  wire: "assets/portraits/wire.webp",
};

export const TILE_PATHS: Record<string, string> = {
  bazaar: "assets/tiles/bazaar.webp",
  rooftop: "assets/tiles/rooftop.webp",
  railyard: "assets/tiles/railyard.webp",
  workshop: "assets/tiles/workshop.webp",
  assembly: "assets/tiles/assembly.webp",
  prison: "assets/tiles/prison.webp",
  garden: "assets/tiles/garden.webp",
  palace: "assets/tiles/palace.webp",
};

export const PROP_PATHS: Record<string, string> = {
  crate: "assets/props/crate.webp",
  haycart: "assets/props/haycart.webp",
  laundry: "assets/props/laundry.webp",
  stall: "assets/props/stall.webp",
  lamp: "assets/props/lamp.webp",
  desk: "assets/props/desk.webp",
  press: "assets/props/press.webp",
  carriage: "assets/props/carriage.webp",
  bars: "assets/props/bars.webp",
  tree: "assets/props/tree.webp",
  sandbags: "assets/props/sandbags.webp",
  guardpost: "assets/props/guardpost.webp",
};

const FRAMES = ["idle-down", "idle-up", "idle-left", "idle-right", "idle-side", "walk-down-a", "walk-down-b"];
const BODIES = ["scout", "sari", "lockpick", "constable", "officer", "soldier"];

export const SHEET_PATHS: Record<string, string> = Object.fromEntries(
  BODIES.flatMap((body) => FRAMES.map((frame) => [body + "-" + frame, "assets/sheets/" + body + "-" + frame + ".webp"])),
);

function framesFor(body: string): string[] {
  return FRAMES.map((frame) => SHEET_PATHS[body + "-" + frame] ?? "");
}

export function allAssetPaths(): string[] {
  return [
    ...Object.values(BG_PATHS),
    ...Object.values(PORTRAIT_PATHS),
    ...Object.values(TILE_PATHS),
    ...Object.values(PROP_PATHS),
    ...Object.values(SHEET_PATHS),
  ];
}

export function titlePaths(): string[] {
  return [BG_PATHS.title ?? ""].filter((path) => path.length > 0);
}

/** Portraits, floors, props, and frames a chapter draws on its first frame. */
export function levelPaths(level: number): string[] {
  const netaji = PORTRAIT_PATHS.netaji ?? "";
  const wire = PORTRAIT_PATHS.wire ?? "";
  if (level === 1) {
    return [
      netaji, wire, PORTRAIT_PATHS.kite ?? "",
      TILE_PATHS.bazaar ?? "", TILE_PATHS.rooftop ?? "", TILE_PATHS.garden ?? "",
      PROP_PATHS.crate ?? "", PROP_PATHS.haycart ?? "", PROP_PATHS.laundry ?? "",
      PROP_PATHS.stall ?? "", PROP_PATHS.lamp ?? "", PROP_PATHS.tree ?? "",
      ...framesFor("scout"), ...framesFor("constable"), ...framesFor("officer"),
    ];
  }
  if (level === 2) {
    return [netaji, PORTRAIT_PATHS.veil ?? "", TILE_PATHS.railyard ?? "", PROP_PATHS.carriage ?? "", ...framesFor("sari")];
  }
  if (level === 3) {
    return [netaji, PORTRAIT_PATHS.key ?? "", TILE_PATHS.workshop ?? "", PROP_PATHS.press ?? "", PROP_PATHS.desk ?? "", ...framesFor("lockpick")];
  }
  if (level === 4) {
    return [netaji, PORTRAIT_PATHS.veil ?? "", TILE_PATHS.assembly ?? "", ...framesFor("soldier")];
  }
  if (level === 5) {
    return [netaji, wire, PORTRAIT_PATHS.key ?? "", TILE_PATHS.prison ?? "", PROP_PATHS.bars ?? "", PROP_PATHS.sandbags ?? "", PROP_PATHS.guardpost ?? ""];
  }
  if (level === 6) {
    return [netaji, wire, PORTRAIT_PATHS.kite ?? "", TILE_PATHS.palace ?? "", TILE_PATHS.rooftop ?? "", TILE_PATHS.garden ?? ""];
  }
  return [];
}

export function finalePaths(): string[] {
  return [BG_PATHS.finale ?? ""].filter((path) => path.length > 0);
}

export function deferredPaths(): string[] {
  const seen = new Set<string>([...titlePaths(), ...levelPaths(1)]);
  const out: string[] = [];
  const push = (paths: string[]) => {
    for (const path of paths) {
      if (!path || seen.has(path)) continue;
      seen.add(path);
      out.push(path);
    }
  };
  for (const level of [2, 3, 4, 5, 6]) push(levelPaths(level));
  push(finalePaths());
  push(Object.values(TILE_PATHS));
  push(Object.values(PROP_PATHS));
  push(Object.values(SHEET_PATHS));
  return out;
}
