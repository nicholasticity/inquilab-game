// Generated from the painted top-down pack plus the title and finale cards.

import tiles_assembly from "./art/tiles/assembly.webp";
import tiles_bazaar from "./art/tiles/bazaar.webp";
import tiles_garden from "./art/tiles/garden.webp";
import tiles_palace from "./art/tiles/palace.webp";
import tiles_prison from "./art/tiles/prison.webp";
import tiles_railyard from "./art/tiles/railyard.webp";
import tiles_rooftop from "./art/tiles/rooftop.webp";
import tiles_workshop from "./art/tiles/workshop.webp";
import props_bars from "./art/props/bars.webp";
import props_carriage from "./art/props/carriage.webp";
import props_crate from "./art/props/crate.webp";
import props_desk from "./art/props/desk.webp";
import props_guardpost from "./art/props/guardpost.webp";
import props_haycart from "./art/props/haycart.webp";
import props_lamp from "./art/props/lamp.webp";
import props_laundry from "./art/props/laundry.webp";
import props_press from "./art/props/press.webp";
import props_sandbags from "./art/props/sandbags.webp";
import props_stall from "./art/props/stall.webp";
import props_tree from "./art/props/tree.webp";
import sheets_constable_idle_down from "./art/sheets/constable-idle-down.webp";
import sheets_constable_idle_left from "./art/sheets/constable-idle-left.webp";
import sheets_constable_idle_right from "./art/sheets/constable-idle-right.webp";
import sheets_constable_idle_side from "./art/sheets/constable-idle-side.webp";
import sheets_constable_idle_up from "./art/sheets/constable-idle-up.webp";
import sheets_constable_walk_down_a from "./art/sheets/constable-walk-down-a.webp";
import sheets_constable_walk_down_b from "./art/sheets/constable-walk-down-b.webp";
import sheets_lockpick_idle_down from "./art/sheets/lockpick-idle-down.webp";
import sheets_lockpick_idle_left from "./art/sheets/lockpick-idle-left.webp";
import sheets_lockpick_idle_right from "./art/sheets/lockpick-idle-right.webp";
import sheets_lockpick_idle_side from "./art/sheets/lockpick-idle-side.webp";
import sheets_lockpick_idle_up from "./art/sheets/lockpick-idle-up.webp";
import sheets_lockpick_walk_down_a from "./art/sheets/lockpick-walk-down-a.webp";
import sheets_lockpick_walk_down_b from "./art/sheets/lockpick-walk-down-b.webp";
import sheets_officer_idle_down from "./art/sheets/officer-idle-down.webp";
import sheets_officer_idle_left from "./art/sheets/officer-idle-left.webp";
import sheets_officer_idle_right from "./art/sheets/officer-idle-right.webp";
import sheets_officer_idle_side from "./art/sheets/officer-idle-side.webp";
import sheets_officer_idle_up from "./art/sheets/officer-idle-up.webp";
import sheets_officer_walk_down_a from "./art/sheets/officer-walk-down-a.webp";
import sheets_officer_walk_down_b from "./art/sheets/officer-walk-down-b.webp";
import sheets_sari_idle_down from "./art/sheets/sari-idle-down.webp";
import sheets_sari_idle_left from "./art/sheets/sari-idle-left.webp";
import sheets_sari_idle_right from "./art/sheets/sari-idle-right.webp";
import sheets_sari_idle_side from "./art/sheets/sari-idle-side.webp";
import sheets_sari_idle_up from "./art/sheets/sari-idle-up.webp";
import sheets_sari_walk_down_a from "./art/sheets/sari-walk-down-a.webp";
import sheets_sari_walk_down_b from "./art/sheets/sari-walk-down-b.webp";
import sheets_scout_idle_down from "./art/sheets/scout-idle-down.webp";
import sheets_scout_idle_left from "./art/sheets/scout-idle-left.webp";
import sheets_scout_idle_right from "./art/sheets/scout-idle-right.webp";
import sheets_scout_idle_side from "./art/sheets/scout-idle-side.webp";
import sheets_scout_idle_up from "./art/sheets/scout-idle-up.webp";
import sheets_scout_walk_down_a from "./art/sheets/scout-walk-down-a.webp";
import sheets_scout_walk_down_b from "./art/sheets/scout-walk-down-b.webp";
import sheets_soldier_idle_down from "./art/sheets/soldier-idle-down.webp";
import sheets_soldier_idle_left from "./art/sheets/soldier-idle-left.webp";
import sheets_soldier_idle_right from "./art/sheets/soldier-idle-right.webp";
import sheets_soldier_idle_side from "./art/sheets/soldier-idle-side.webp";
import sheets_soldier_idle_up from "./art/sheets/soldier-idle-up.webp";
import sheets_soldier_walk_down_a from "./art/sheets/soldier-walk-down-a.webp";
import sheets_soldier_walk_down_b from "./art/sheets/soldier-walk-down-b.webp";
import finaleUrl from "./art/bg/finale.webp";
import titleUrl from "./art/bg/title.webp";
import keyUrl from "./art/portraits/key.webp";
import kiteUrl from "./art/portraits/kite.webp";
import netajiUrl from "./art/portraits/netaji.webp";
import veilUrl from "./art/portraits/veil.webp";
import wireUrl from "./art/portraits/wire.webp";
import { allAssetPaths } from "./assets";

/** Vite emits these with content hashes under dist/static/. */
const URL_BY_PATH: Record<string, string> = {
  "assets/bg/finale.webp": finaleUrl,
  "assets/bg/title.webp": titleUrl,
  "assets/portraits/key.webp": keyUrl,
  "assets/portraits/kite.webp": kiteUrl,
  "assets/portraits/netaji.webp": netajiUrl,
  "assets/portraits/veil.webp": veilUrl,
  "assets/portraits/wire.webp": wireUrl,
  "assets/tiles/assembly.webp": tiles_assembly,
  "assets/tiles/bazaar.webp": tiles_bazaar,
  "assets/tiles/garden.webp": tiles_garden,
  "assets/tiles/palace.webp": tiles_palace,
  "assets/tiles/prison.webp": tiles_prison,
  "assets/tiles/railyard.webp": tiles_railyard,
  "assets/tiles/rooftop.webp": tiles_rooftop,
  "assets/tiles/workshop.webp": tiles_workshop,
  "assets/props/bars.webp": props_bars,
  "assets/props/carriage.webp": props_carriage,
  "assets/props/crate.webp": props_crate,
  "assets/props/desk.webp": props_desk,
  "assets/props/guardpost.webp": props_guardpost,
  "assets/props/haycart.webp": props_haycart,
  "assets/props/lamp.webp": props_lamp,
  "assets/props/laundry.webp": props_laundry,
  "assets/props/press.webp": props_press,
  "assets/props/sandbags.webp": props_sandbags,
  "assets/props/stall.webp": props_stall,
  "assets/props/tree.webp": props_tree,
  "assets/sheets/constable-idle-down.webp": sheets_constable_idle_down,
  "assets/sheets/constable-idle-left.webp": sheets_constable_idle_left,
  "assets/sheets/constable-idle-right.webp": sheets_constable_idle_right,
  "assets/sheets/constable-idle-side.webp": sheets_constable_idle_side,
  "assets/sheets/constable-idle-up.webp": sheets_constable_idle_up,
  "assets/sheets/constable-walk-down-a.webp": sheets_constable_walk_down_a,
  "assets/sheets/constable-walk-down-b.webp": sheets_constable_walk_down_b,
  "assets/sheets/lockpick-idle-down.webp": sheets_lockpick_idle_down,
  "assets/sheets/lockpick-idle-left.webp": sheets_lockpick_idle_left,
  "assets/sheets/lockpick-idle-right.webp": sheets_lockpick_idle_right,
  "assets/sheets/lockpick-idle-side.webp": sheets_lockpick_idle_side,
  "assets/sheets/lockpick-idle-up.webp": sheets_lockpick_idle_up,
  "assets/sheets/lockpick-walk-down-a.webp": sheets_lockpick_walk_down_a,
  "assets/sheets/lockpick-walk-down-b.webp": sheets_lockpick_walk_down_b,
  "assets/sheets/officer-idle-down.webp": sheets_officer_idle_down,
  "assets/sheets/officer-idle-left.webp": sheets_officer_idle_left,
  "assets/sheets/officer-idle-right.webp": sheets_officer_idle_right,
  "assets/sheets/officer-idle-side.webp": sheets_officer_idle_side,
  "assets/sheets/officer-idle-up.webp": sheets_officer_idle_up,
  "assets/sheets/officer-walk-down-a.webp": sheets_officer_walk_down_a,
  "assets/sheets/officer-walk-down-b.webp": sheets_officer_walk_down_b,
  "assets/sheets/sari-idle-down.webp": sheets_sari_idle_down,
  "assets/sheets/sari-idle-left.webp": sheets_sari_idle_left,
  "assets/sheets/sari-idle-right.webp": sheets_sari_idle_right,
  "assets/sheets/sari-idle-side.webp": sheets_sari_idle_side,
  "assets/sheets/sari-idle-up.webp": sheets_sari_idle_up,
  "assets/sheets/sari-walk-down-a.webp": sheets_sari_walk_down_a,
  "assets/sheets/sari-walk-down-b.webp": sheets_sari_walk_down_b,
  "assets/sheets/scout-idle-down.webp": sheets_scout_idle_down,
  "assets/sheets/scout-idle-left.webp": sheets_scout_idle_left,
  "assets/sheets/scout-idle-right.webp": sheets_scout_idle_right,
  "assets/sheets/scout-idle-side.webp": sheets_scout_idle_side,
  "assets/sheets/scout-idle-up.webp": sheets_scout_idle_up,
  "assets/sheets/scout-walk-down-a.webp": sheets_scout_walk_down_a,
  "assets/sheets/scout-walk-down-b.webp": sheets_scout_walk_down_b,
  "assets/sheets/soldier-idle-down.webp": sheets_soldier_idle_down,
  "assets/sheets/soldier-idle-left.webp": sheets_soldier_idle_left,
  "assets/sheets/soldier-idle-right.webp": sheets_soldier_idle_right,
  "assets/sheets/soldier-idle-side.webp": sheets_soldier_idle_side,
  "assets/sheets/soldier-idle-up.webp": sheets_soldier_idle_up,
  "assets/sheets/soldier-walk-down-a.webp": sheets_soldier_walk_down_a,
  "assets/sheets/soldier-walk-down-b.webp": sheets_soldier_walk_down_b,
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
