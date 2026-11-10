import assemblyUrl from "./art/bg/assembly.webp";
import cellUrl from "./art/bg/cell.webp";
import finaleUrl from "./art/bg/finale.webp";
import lahoreUrl from "./art/bg/lahore.webp";
import pressUrl from "./art/bg/press.webp";
import stationUrl from "./art/bg/station.webp";
import titleUrl from "./art/bg/title.webp";
import constableAttackUrl from "./art/frames/constable_attack.webp";
import durgaIdleUrl from "./art/frames/durga_idle.webp";
import durgaWalkUrl from "./art/frames/durga_walk.webp";
import officerAttackUrl from "./art/frames/officer_attack.webp";
import officerDownUrl from "./art/frames/officer_down.webp";
import officerIdleUrl from "./art/frames/officer_idle.webp";
import playerAttackUrl from "./art/frames/player_attack.webp";
import playerDashUrl from "./art/frames/player_dash.webp";
import playerDodgeUrl from "./art/frames/player_dodge.webp";
import playerDownUrl from "./art/frames/player_down.webp";
import playerHitUrl from "./art/frames/player_hit.webp";
import playerIdleUrl from "./art/frames/player_idle.webp";
import playerJumpUrl from "./art/frames/player_jump.webp";
import playerRun1Url from "./art/frames/player_run1.webp";
import playerRun2Url from "./art/frames/player_run2.webp";
import azadUrl from "./art/portraits/azad.webp";
import bhagatUrl from "./art/portraits/bhagat.webp";
import durgaUrl from "./art/portraits/durga.webp";
import duttUrl from "./art/portraits/dutt.webp";
import jatinUrl from "./art/portraits/jatin.webp";
import sukhdevUrl from "./art/portraits/sukhdev.webp";
import { allAssetPaths } from "./assets";

/** Vite emits these with content hashes under dist/static/. */
const URL_BY_PATH: Record<string, string> = {
  "assets/bg/assembly.webp": assemblyUrl,
  "assets/bg/cell.webp": cellUrl,
  "assets/bg/finale.webp": finaleUrl,
  "assets/bg/lahore.webp": lahoreUrl,
  "assets/bg/press.webp": pressUrl,
  "assets/bg/station.webp": stationUrl,
  "assets/bg/title.webp": titleUrl,
  "assets/frames/constable_attack.webp": constableAttackUrl,
  "assets/frames/durga_idle.webp": durgaIdleUrl,
  "assets/frames/durga_walk.webp": durgaWalkUrl,
  "assets/frames/officer_attack.webp": officerAttackUrl,
  "assets/frames/officer_down.webp": officerDownUrl,
  "assets/frames/officer_idle.webp": officerIdleUrl,
  "assets/frames/player_attack.webp": playerAttackUrl,
  "assets/frames/player_dash.webp": playerDashUrl,
  "assets/frames/player_dodge.webp": playerDodgeUrl,
  "assets/frames/player_down.webp": playerDownUrl,
  "assets/frames/player_hit.webp": playerHitUrl,
  "assets/frames/player_idle.webp": playerIdleUrl,
  "assets/frames/player_jump.webp": playerJumpUrl,
  "assets/frames/player_run1.webp": playerRun1Url,
  "assets/frames/player_run2.webp": playerRun2Url,
  "assets/portraits/azad.webp": azadUrl,
  "assets/portraits/bhagat.webp": bhagatUrl,
  "assets/portraits/durga.webp": durgaUrl,
  "assets/portraits/dutt.webp": duttUrl,
  "assets/portraits/jatin.webp": jatinUrl,
  "assets/portraits/sukhdev.webp": sukhdevUrl,
};

export function resolveUrls(paths: string[]): string[] {
  return paths.map((path) => {
    const url = URL_BY_PATH[path];
    if (!url) throw new Error("No painted file for " + path);
    return url;
  });
}

export function urlForPath(path: string): string {
  const url = URL_BY_PATH[path];
  if (!url) throw new Error("No painted file for " + path);
  return url;
}

const known = allAssetPaths();
for (const path of known) {
  if (!URL_BY_PATH[path]) throw new Error("Art URL map is missing " + path);
}
for (const path of Object.keys(URL_BY_PATH)) {
  if (!known.includes(path)) throw new Error("Art URL map has an extra file " + path);
}
