/**
 * Logical painting paths. The files live in src/art and Vite content-hashes them.
 * Chapter scenes are a far layer, a mid layer, and one tileable ground strip.
 * The title waits on title.webp only. Each chapter's three paintings load with that chapter.
 */

export const BG_PATHS: Record<string, string> = {
  title: "assets/bg/title.webp",
  finale: "assets/bg/finale.webp",
};

export const LAYER_PATHS: Record<number, { far: string; mid: string; ground: string }> = {
  1: { far: "assets/bg/lahore_far.webp", mid: "assets/bg/lahore_mid.webp", ground: "assets/ground/lahore.webp" },
  2: { far: "assets/bg/station_far.webp", mid: "assets/bg/station_mid.webp", ground: "assets/ground/station.webp" },
  3: { far: "assets/bg/press_far.webp", mid: "assets/bg/press_mid.webp", ground: "assets/ground/press.webp" },
  4: { far: "assets/bg/assembly_far.webp", mid: "assets/bg/assembly_mid.webp", ground: "assets/ground/assembly.webp" },
  5: { far: "assets/bg/cell_far.webp", mid: "assets/bg/cell_mid.webp", ground: "assets/ground/cell.webp" },
};

function layerPaths(level: number): string[] {
  const set = LAYER_PATHS[level];
  if (!set) return [];
  return [set.far, set.mid, set.ground];
}

export const PORTRAIT_PATHS: Record<string, string> = {
  bhagat: "assets/portraits/bhagat.webp",
  sukhdev: "assets/portraits/sukhdev.webp",
  azad: "assets/portraits/azad.webp",
  dutt: "assets/portraits/dutt.webp",
  durga: "assets/portraits/durga.webp",
  jatin: "assets/portraits/jatin.webp",
};

export const FRAME_PATHS: Record<string, string> = {
  player_idle: "assets/frames/player_idle.webp",
  player_run1: "assets/frames/player_run1.webp",
  player_run2: "assets/frames/player_run2.webp",
  player_jump: "assets/frames/player_jump.webp",
  player_attack: "assets/frames/player_attack.webp",
  player_dash: "assets/frames/player_dash.webp",
  player_dodge: "assets/frames/player_dodge.webp",
  player_hit: "assets/frames/player_hit.webp",
  player_down: "assets/frames/player_down.webp",
  officer_idle: "assets/frames/officer_idle.webp",
  officer_attack: "assets/frames/officer_attack.webp",
  officer_down: "assets/frames/officer_down.webp",
  constable_attack: "assets/frames/constable_attack.webp",
  durga_idle: "assets/frames/durga_idle.webp",
  durga_walk: "assets/frames/durga_walk.webp",
};

export function allAssetPaths(): string[] {
  const layers: string[] = [];
  for (const level of [1, 2, 3, 4, 5]) layers.push(...layerPaths(level));
  return [
    ...Object.values(BG_PATHS),
    ...layers,
    ...Object.values(PORTRAIT_PATHS),
    ...Object.values(FRAME_PATHS),
  ];
}

const COMBAT_FRAMES = [
  "player_idle", "player_run1", "player_run2", "player_jump", "player_attack",
  "player_dash", "player_dodge", "player_hit", "player_down",
  "officer_idle", "officer_attack", "officer_down", "constable_attack",
];

const PLAYER_FRAMES = [
  "player_idle", "player_run1", "player_run2", "player_jump", "player_attack",
  "player_dash", "player_dodge", "player_hit", "player_down",
];

function frames(keys: string[]): string[] {
  return keys.map((key) => {
    const path = FRAME_PATHS[key];
    if (!path) throw new Error("Missing frame " + key);
    return path;
  });
}

/** Painted files the title canvas needs before it can open. */
export function titlePaths(): string[] {
  return [BG_PATHS.title ?? ""].filter((path) => path.length > 0);
}

/** Painted files a chapter draws. Later chapters reuse the chapter 1 frames. */
export function levelPaths(level: number): string[] {
  if (level === 1) {
    return [...layerPaths(1), PORTRAIT_PATHS.bhagat ?? "", PORTRAIT_PATHS.sukhdev ?? "", ...frames(COMBAT_FRAMES)];
  }
  if (level === 2) {
    return [
      ...layerPaths(2), PORTRAIT_PATHS.bhagat ?? "", PORTRAIT_PATHS.durga ?? "",
      ...frames(COMBAT_FRAMES), FRAME_PATHS.durga_idle ?? "", FRAME_PATHS.durga_walk ?? "",
    ];
  }
  if (level === 3) {
    return [...layerPaths(3), PORTRAIT_PATHS.bhagat ?? "", PORTRAIT_PATHS.azad ?? "", ...frames(COMBAT_FRAMES)];
  }
  if (level === 4) {
    return [...layerPaths(4), PORTRAIT_PATHS.bhagat ?? "", PORTRAIT_PATHS.dutt ?? "", ...frames(COMBAT_FRAMES)];
  }
  if (level === 5) {
    return [...layerPaths(5), PORTRAIT_PATHS.bhagat ?? "", PORTRAIT_PATHS.jatin ?? "", ...frames(PLAYER_FRAMES)];
  }
  return [];
}

export function finalePaths(): string[] {
  return [BG_PATHS.finale ?? ""].filter((path) => path.length > 0);
}

/** Everything except the title and chapter 1, in chapter order. */
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
  for (const level of [2, 3, 4, 5]) push(levelPaths(level));
  push(finalePaths());
  return out;
}
