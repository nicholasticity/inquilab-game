/** Paths under public/, no leading slash. */
export const BG_PATHS: Record<string, string> = {
  title: "assets/bg/title.webp",
  lahore: "assets/bg/lahore.webp",
  station: "assets/bg/station.webp",
  press: "assets/bg/press.webp",
  assembly: "assets/bg/assembly.webp",
  cell: "assets/bg/cell.webp",
  finale: "assets/bg/finale.webp",
};

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

export function assetUrl(path: string): string {
  return import.meta.env.BASE_URL + path;
}

export function allAssetPaths(): string[] {
  return [
    ...Object.values(BG_PATHS),
    ...Object.values(PORTRAIT_PATHS),
    ...Object.values(FRAME_PATHS),
  ];
}
