import assemblyFarUrl from "./art/bg/assembly_far.webp";
import assemblyMidUrl from "./art/bg/assembly_mid.webp";
import cellFarUrl from "./art/bg/cell_far.webp";
import cellMidUrl from "./art/bg/cell_mid.webp";
import finaleUrl from "./art/bg/finale.webp";
import lahoreFarUrl from "./art/bg/lahore_far.webp";
import lahoreMidUrl from "./art/bg/lahore_mid.webp";
import pressFarUrl from "./art/bg/press_far.webp";
import pressMidUrl from "./art/bg/press_mid.webp";
import stationFarUrl from "./art/bg/station_far.webp";
import stationMidUrl from "./art/bg/station_mid.webp";
import titleUrl from "./art/bg/title.webp";
import assemblyGroundUrl from "./art/ground/assembly.webp";
import cellGroundUrl from "./art/ground/cell.webp";
import lahoreGroundUrl from "./art/ground/lahore.webp";
import pressGroundUrl from "./art/ground/press.webp";
import stationGroundUrl from "./art/ground/station.webp";
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
  "assets/bg/assembly_far.webp": assemblyFarUrl,
  "assets/bg/assembly_mid.webp": assemblyMidUrl,
  "assets/bg/cell_far.webp": cellFarUrl,
  "assets/bg/cell_mid.webp": cellMidUrl,
  "assets/bg/finale.webp": finaleUrl,
  "assets/bg/lahore_far.webp": lahoreFarUrl,
  "assets/bg/lahore_mid.webp": lahoreMidUrl,
  "assets/bg/press_far.webp": pressFarUrl,
  "assets/bg/press_mid.webp": pressMidUrl,
  "assets/bg/station_far.webp": stationFarUrl,
  "assets/bg/station_mid.webp": stationMidUrl,
  "assets/bg/title.webp": titleUrl,
  "assets/ground/assembly.webp": assemblyGroundUrl,
  "assets/ground/cell.webp": cellGroundUrl,
  "assets/ground/lahore.webp": lahoreGroundUrl,
  "assets/ground/press.webp": pressGroundUrl,
  "assets/ground/station.webp": stationGroundUrl,
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
