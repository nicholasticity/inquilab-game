import fs from "node:fs";
import path from "node:path";
import { allAssetPaths, deferredPaths, finalePaths, levelPaths, titlePaths } from "./assets";
import {
  TS,
  advanceFromDone,
  applyLevel,
  blankInp,
  epilogue,
  fresh,
  tick,
  type Inp,
  type World,
} from "./game";

function modeOf(w: World): string {
  return w.mode;
}

function aiOf(g: { ai: string }): string {
  return g.ai;
}

function fail(msg: string): never {
  throw new Error(msg);
}

function assert(cond: boolean, msg: string): void {
  if (!cond) fail(msg);
}

function pressStart(): Inp {
  const inp = blankInp();
  inp.startP = true;
  return inp;
}

function skipTalk(w: World): void {
  let guard = 0;
  while (w.mode === "talk") {
    if (guard++ > 40) fail("Talk did not end on mission " + String(w.level));
    const line = w.talk[w.talkI];
    if (line) w.talkShown = line.text.length;
    tick(w, pressStart(), 1 / 60);
  }
}

function openPlay(id: number): World {
  const w = fresh();
  applyLevel(w, id, "");
  assert(w.mode === "play", "Mission " + String(id) + " should start in play without a briefing");
  return w;
}

function checkAssets(): void {
  const missing = allAssetPaths().filter((rel) => !fs.existsSync(path.resolve("src/art", rel.slice("assets/".length))));
  assert(missing.length === 0, "Missing assets: " + missing.join(", "));
  assert(allAssetPaths().length > 8, "The painted pack should sit beside the title and the finale");
  const covered = new Set<string>([...titlePaths(), ...levelPaths(1), ...deferredPaths()]);
  assert(covered.size === allAssetPaths().length, "Load groups should cover every painting once");
  for (const rel of allAssetPaths()) assert(covered.has(rel), "Uncovered painting " + rel);
  assert(titlePaths().join() === "assets/bg/title.webp", "Title should wait on its painting only");
  const first = levelPaths(1).join(" ");
  assert(first.includes("netaji") && first.includes("kite") && first.includes("wire") && first.includes("bazaar") && first.includes("scout-idle-down") && !first.includes("veil") && !first.includes("finale"), "Mission 1 loads Netaji, Kite, Wire, and the Lahore art");
  assert(levelPaths(2).some((rel) => rel.includes("veil")), "Mission 2 should bring in Veil");
  assert(levelPaths(3).some((rel) => rel.includes("lockpick-idle-down")), "Mission 3 should bring in Key's frames");
  assert(deferredPaths().some((rel) => rel.includes("finale")), "The finale painting stays deferred");
  assert(finalePaths().join() === "assets/bg/finale.webp", "Finale painting");
}

function downAll(w: World): void {
  for (const g of w.guards) g.ai = "down";
}

function vision(): void {
  const w = openPlay(1);
  downAll(w);
  const g = w.guards[0];
  if (!g) fail("Mission 1 should field a sentry");
  g.ai = "patrol";
  g.x = 16.5 * TS;
  g.y = 10.5 * TS;
  g.face = 0;
  g.range = 160;
  g.wx = [g.x, g.x];
  g.wy = [g.y, g.y];
  w.player.x = g.x + 90;
  w.player.y = g.y;
  w.player.crouch = false;
  w.player.hidden = false;
  w.player.disguise = false;
  tick(w, blankInp(), 1 / 60);
  assert(aiOf(g) === "alert" || g.see, "A sentry should see a standing agent in the cone");

  const blocked = openPlay(1);
  downAll(blocked);
  const wall = blocked.guards[0];
  if (!wall) fail("Need a sentry for the wall test");
  wall.ai = "patrol";
  wall.x = 6.5 * TS;
  wall.y = 10.5 * TS;
  wall.face = 0;
  wall.range = 280;
  wall.wx = [wall.x, wall.x];
  wall.wy = [wall.y, wall.y];
  blocked.player.x = 12.5 * TS;
  blocked.player.y = 10.5 * TS;
  blocked.player.disguise = false;
  tick(blocked, blankInp(), 1 / 60);
  assert(aiOf(wall) === "patrol" && !wall.see, "A wall should cut the cone");
}

function grass(): void {
  const w = openPlay(1);
  downAll(w);
  const g = w.guards[0];
  if (!g) fail("Need a sentry for the grass");
  g.ai = "patrol";
  g.x = 2.5 * TS;
  g.y = 10.5 * TS;
  g.face = 0;
  g.range = 220;
  g.wx = [g.x, g.x];
  g.wy = [g.y, g.y];
  w.player.x = 5.5 * TS;
  w.player.y = 10.5 * TS;
  w.player.crouch = false;
  w.player.disguise = false;
  tick(w, blankInp(), 1 / 60);
  assert(g.see || aiOf(g) === "alert", "Standing in the grass should still be seen");
  g.ai = "patrol";
  g.see = false;
  w.phaseT = 0;
  w.spotted = false;
  w.player.crouch = true;
  tick(w, blankInp(), 1 / 60);
  assert(!g.see && aiOf(g) === "patrol", "Crouching in the grass should drop out of the cone");
}

function noise(): void {
  const w = openPlay(1);
  downAll(w);
  const g = w.guards[0];
  if (!g) fail("Need a sentry to hear");
  g.ai = "patrol";
  g.x = 8.5 * TS;
  g.y = 12.5 * TS;
  g.face = 0;
  g.wx = [g.x, g.x];
  g.wy = [g.y, g.y];
  w.player.x = g.x - 90;
  w.player.y = g.y;
  w.player.crouch = false;
  const inp = blankInp();
  inp.x = 1;
  inp.y = 0;
  inp.mag = 1;
  inp.run = true;
  tick(w, inp, 1 / 60);
  assert(aiOf(g) === "sus" || aiOf(g) === "alert", "A sprint should make a noise the sentry investigates");
}

function choke(): void {
  const w = openPlay(1);
  downAll(w);
  const g = w.guards[0];
  if (!g) fail("Need a sentry to subdue");
  g.ai = "patrol";
  g.x = 6.5 * TS;
  g.y = 12.5 * TS;
  g.face = 0;
  g.range = 8;
  g.wx = [g.x, g.x];
  g.wy = [g.y, g.y];
  w.player.x = g.x + 18;
  w.player.y = g.y;
  const front = blankInp();
  front.actP = true;
  tick(w, front, 1 / 60);
  assert(aiOf(g) === "patrol", "A sentry facing you should not go down");
  w.player.x = g.x - 18;
  const back = blankInp();
  back.actP = true;
  tick(w, back, 1 / 60);
  assert(aiOf(g) === "down" && w.story.downs >= 1, "A quiet subdue from behind should lay the sentry down");
}

function disguise(): void {
  const w = openPlay(2);
  downAll(w);
  const g = w.guards.find((e) => e.tag === "watch");
  if (!g) fail("The yard should have a watcher");
  const uniform = w.uniforms[0];
  if (!uniform) fail("Veil should find a uniform");
  w.player.x = (uniform.x + 0.5) * TS;
  w.player.y = (uniform.y + 0.5) * TS;
  tick(w, blankInp(), 1 / 60);
  assert(w.uniformHeld, "Walking over a uniform should take it");
  const wear = blankInp();
  wear.abilityP = true;
  tick(w, wear, 1 / 60);
  assert(w.player.disguise, "Veil's ability should put the coat on");
  g.ai = "patrol";
  g.x = 16.5 * TS;
  g.y = 8.5 * TS;
  g.face = 0;
  g.range = 160;
  g.wx = [g.x, g.x];
  g.wy = [g.y, g.y];
  w.player.x = g.x + 70;
  w.player.y = g.y;
  w.player.crouch = false;
  tick(w, blankInp(), 1 / 60);
  assert(aiOf(g) === "patrol" && !g.see, "A worn coat should hold inside the cone");
  const run = blankInp();
  run.x = 1;
  run.mag = 1;
  run.run = true;
  tick(w, run, 1 / 60);
  assert(!w.player.disguise && (aiOf(g) === "sus" || aiOf(g) === "alert"), "Sprinting should break the coat");
}

function lamps(): void {
  const w = openPlay(3);
  downAll(w);
  const g = w.guards[0];
  if (!g) fail("The hall should have a sentry");
  g.ai = "patrol";
  g.x = 14.5 * TS;
  g.y = 10.5 * TS;
  g.face = 0;
  g.range = 110;
  g.wx = [g.x, g.x];
  g.wy = [g.y, g.y];
  w.player.x = 18.5 * TS;
  w.player.y = 10.5 * TS;
  w.player.crouch = false;
  w.player.disguise = false;
  tick(w, blankInp(), 1 / 60);
  assert(g.see || aiOf(g) === "alert", "The lamp should reach a sentry's cone");
  g.ai = "patrol";
  g.see = false;
  w.phaseT = 0;
  w.spotted = false;
  const cut = blankInp();
  cut.abilityP = true;
  tick(w, cut, 1 / 60);
  assert(w.lamps.every((l) => !l.on), "Key should cut the lamps when no lock is in reach");
  assert(!g.see && aiOf(g) !== "alert", "Without the lamp, that step should be dark enough");
}

function locks(): void {
  const w = openPlay(5);
  const door = w.locks[0];
  if (!door) fail("The jail should have a lock");
  w.player.x = (door.x + 0.5) * TS;
  w.player.y = (door.y + 1.6) * TS;
  const inp = blankInp();
  inp.abilityP = true;
  tick(w, inp, 1 / 60);
  assert(door.open, "Key should open the nearest lock");
}

function choicesCarry(): void {
  const saved = openPlay(1);
  saved.story.courier = "save";
  applyLevel(saved, 2, "");
  const watched = saved.guards.filter((g) => g.tag === "watch").length;
  const harsh = fresh();
  harsh.story.courier = "plans";
  applyLevel(harsh, 2, "");
  const watchedHarsh = harsh.guards.filter((g) => g.tag === "watch").length;
  assert(watched < watchedHarsh, "Leaving the courier should thicken the yard watch");
  assert(saved.story.courier === "save", "A later mission should keep the earlier choice");
}

function followGuide(w: World): void {
  const pts = w.guide.map((t) => ({ x: (t.x + 0.5) * TS, y: (t.y + 0.5) * TS }));
  let index = 0;
  let stuck = 0;
  let px = w.player.x;
  let py = w.player.y;
  for (let frame = 0; frame < 60 * 50 && w.mode === "play"; frame++) {
    if (w.prompt) {
      const choose = blankInp();
      choose.pick = 1;
      tick(w, choose, 1 / 60);
      stuck = 0;
      continue;
    }
    const goal = pts[index];
    if (!goal) break;
    const dx = goal.x - w.player.x;
    const dy = goal.y - w.player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 10) {
      index += 1;
      stuck = 0;
      continue;
    }
    const inp = blankInp();
    inp.x = dx / dist;
    inp.y = dy / dist;
    inp.mag = 0.4;
    if (!w.player.crouch) inp.crouchP = true;
    const moved = Math.hypot(w.player.x - px, w.player.y - py);
    if (moved < 0.2) stuck += 1;
    else stuck = 0;
    px = w.player.x;
    py = w.player.y;
    if (stuck > 10) inp.act = true;
    tick(w, inp, 1 / 60);
  }
  if (w.mode !== "done") {
    fail("Mission " + String(w.level) + " ended at " + w.player.x.toFixed(0) + "," + w.player.y.toFixed(0) + " step " + String(index) + " mode " + w.mode);
  }
}

function clearMission(w: World, id: number): void {
  applyLevel(w, id, "");
  followGuide(w);
  assert(w.mode === "done" && (w.rank === "S" || w.rank === "A" || w.rank === "B" || w.rank === "C"), "Mission " + String(id) + " should rank a clear");
}

function story(): void {
  const w = fresh();
  tick(w, pressStart(), 1 / 60);
  assert(w.mode === "talk" && w.level === 1 && w.agent === "kite", "The title opens Kite's briefing");
  assert(w.talk.some((line) => line.who === "netaji"), "Netaji briefs the first mission");
  skipTalk(w);
  assert(w.mode === "play" && w.hint.length > 0, "Mission 1 should teach before the roofs");
  for (let id = 1; id <= 6; id++) clearMission(w, id);
  if (w.mode === "done") tick(w, pressStart(), 1 / 60);
  assert(w.mode === "finale", "The signal should reach the epilogue");
  assert(w.story.courier === "save" && w.story.assembly === "swap" && w.story.warder === "spare" && w.story.signal === "wait", "Choices should survive to the epilogue");
  assert(epilogue(w).length > 3, "The epilogue should recount the route");
  w.t = 9;
  tick(w, pressStart(), 1 / 60);
  assert(w.mode === "title", "The epilogue should return to the title");
  applyLevel(w, 1, "");
  w.mode = "done";
  w.level = 1;
  advanceFromDone(w);
  assert(w.level === 2 && modeOf(w) === "talk", "A clear should continue into Veil's briefing");
}

checkAssets();
vision();
grass();
noise();
choke();
disguise();
lamps();
locks();
choicesCarry();
story();
console.log("playthrough ok");
