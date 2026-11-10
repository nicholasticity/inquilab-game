import fs from "node:fs";
import path from "node:path";
import { allAssetPaths, deferredPaths, finalePaths, levelPaths, titlePaths } from "./assets";
import {
  advanceFromDone,
  applyLevel,
  blankInp,
  fresh,
  supportTop,
  tick,
  type Inp,
  type World,
} from "./game";

function fail(msg: string): never {
  throw new Error(msg);
}

function assert(cond: boolean, msg: string): void {
  if (!cond) fail(msg);
}

function checkAssets(): void {
  const missing = allAssetPaths().filter((rel) => !fs.existsSync(path.resolve("src/art", rel.slice("assets/".length))));
  assert(missing.length === 0, "Missing assets: " + missing.join(", "));
  assert(allAssetPaths().length === 28, "Expected 28 paintings");
  const covered = new Set<string>([...titlePaths(), ...levelPaths(1), ...deferredPaths()]);
  assert(covered.size === allAssetPaths().length, "Load groups should cover every painting once");
  for (const rel of allAssetPaths()) assert(covered.has(rel), "Uncovered painting " + rel);
  assert(titlePaths().join() === "assets/bg/title.webp", "Title should wait on its painting only");
  const first = levelPaths(1).join(" ");
  assert(first.includes("assets/bg/lahore.webp") && first.includes("player_idle") && !first.includes("durga") && !first.includes("finale"), "Chapter 1 set");
  assert(levelPaths(2).some((rel) => rel.includes("durga_walk")), "Chapter 2 should include Durga");
  assert(finalePaths().join() === "assets/bg/finale.webp", "Finale painting");
  for (const level of [1, 2, 3, 4, 5]) {
    for (const rel of levelPaths(level)) assert(rel.length > 0 && allAssetPaths().includes(rel), "Bad path in level " + String(level));
  }
}

function pressStart(): Inp {
  const inp = blankInp();
  inp.startP = true;
  return inp;
}

function skipTalk(w: World): void {
  let guard = 0;
  while (w.mode === "talk") {
    if (guard++ > 40) fail("Talk did not end on level " + String(w.level));
    const line = w.talk[w.talkI];
    if (line) w.talkShown = line.text.length;
    tick(w, pressStart(), 1 / 60);
  }
}

function qteInp(tag: string): Inp {
  const inp = blankInp();
  if (tag === "J" || tag === "X") inp.atkP = true;
  else if (tag === "K" || tag === "C") inp.dashP = true;
  else if (tag === "L") inp.dodgeP = true;
  else if (tag === "SPACE") inp.jumpP = true;
  else if (tag === "LEFT") inp.l = true;
  else if (tag === "RIGHT") inp.r = true;
  else fail("Unknown prompt " + tag);
  return inp;
}

function reachExit(w: World): void {
  w.player.x = w.exitX + 8;
  w.player.y = 300;
  w.player.vx = 0;
  w.player.vy = 0;
  tick(w, blankInp(), 1 / 60);
}

function scriptedClear(): { sawJatin: boolean; sawLetter: boolean } {
  const w = fresh();
  tick(w, pressStart(), 1 / 60);
  assert(w.mode === "talk" && w.level === 1, "Title start should open chapter 1");
  assert(w.bg === "lahore", "Chapter 1 background");

  skipTalk(w);
  assert(w.mode === "play", "Chapter 1 should enter play");
  reachExit(w);
  assert(w.mode === "done" && w.level === 1, "Chapter 1 should clear, mode=" + w.mode);

  advanceFromDone(w);
  assert(w.level === 2 && w.bg === "station", "Chapter 2 station");
  skipTalk(w);
  reachExit(w);
  assert(w.mode === "done" && w.level === 2, "Chapter 2 should clear");

  advanceFromDone(w);
  assert(w.level === 3 && w.bg === "press", "Chapter 3 press");
  skipTalk(w);
  for (const pap of w.papers) {
    w.player.x = pap.x;
    w.player.y = pap.y - w.player.h;
    w.player.vx = 0;
    w.player.vy = 0;
    tick(w, blankInp(), 1 / 60);
  }
  assert(w.papers.every((p) => p.got), "All three papers should be taken");
  reachExit(w);
  assert(w.mode === "done" && w.level === 3, "Chapter 3 should clear once the papers are out");

  advanceFromDone(w);
  assert(w.level === 4 && w.bg === "assembly", "Chapter 4 assembly");
  skipTalk(w);
  assert(w.mode === "play", "Assembly should be playable");
  w.time = 4;
  w.player.x = w.exitX - 40;
  w.player.y = 340;
  w.player.vx = 0;
  w.player.vy = 0;
  for (const foe of w.foes) foe.x = -600;
  let thrown = 0;
  while (w.leaflets < 8 && thrown++ < 20) {
    const inp = blankInp();
    inp.atkP = true;
    tick(w, inp, 1 / 60);
  }
  assert(w.leaflets === 8 && w.mode === "talk", "Gallery should open the assembly ending");
  skipTalk(w);
  assert(w.mode === "done" && w.unlocked === 5, "Assembly clear should unlock the fast");

  advanceFromDone(w);
  assert(w.level === 5 && w.bg === "cell", "Chapter 5 cell");
  skipTalk(w);
  assert(w.mode === "endure", "The fast should begin after the cell dialogue");

  let sawJatin = false;
  let sawLetter = false;
  let guard = 0;
  while (w.mode !== "finale") {
    if (guard++ > 4000) fail("Hunger strike did not reach the finale (days=" + String(w.days) + ", mode=" + w.mode + ", resolve=" + String(w.resolve) + ")");
    if (w.mode === "talk") {
      const line = w.talk[w.talkI];
      if (line?.text.includes("Jatindra")) sawJatin = true;
      if (line?.text.includes("father")) sawLetter = true;
      if (line) w.talkShown = line.text.length;
      tick(w, pressStart(), 1 / 60);
      continue;
    }
    if (w.mode === "dead") fail("The strike broke during a correct-prompt playthrough");
    if (w.mode !== "endure") fail("Unexpected mode during the fast: " + w.mode);
    let wait = 0;
    while (w.qte === "" && w.mode === "endure" && wait++ < 180) tick(w, blankInp(), 1 / 60);
    if (w.mode !== "endure") continue;
    assert(w.qte !== "", "A prompt should appear");
    tick(w, qteInp(w.qte), 1 / 60);
  }
  assert(sawJatin, "Jatindra Nath Das should be spoken of on the sixty-third day");
  assert(sawLetter, "The letter to his father should be read before the finale");
  assert(w.mode === "finale", "Finale mode");
  return { sawJatin, sawLetter };
}

function botFrame(w: World, jumpTimer: { t: number }): Inp {
  const inp = blankInp();
  if (w.mode === "talk" || w.mode === "dead" || w.mode === "done") {
    inp.startP = true;
    return inp;
  }
  if (w.mode !== "play") return inp;
  const p = w.player;
  inp.r = true;
  const foot = p.y + p.h;
  const ahead = supportTop(w.plats, p.x + p.w + 36, foot);
  const here = supportTop(w.plats, p.x + p.w * 0.5, foot);
  const need = (p.onG && (ahead === null || (here !== null && ahead < here - 20))) || (p.onW !== 0 && !p.onG);
  if (need) jumpTimer.t = 0.48;
  if (jumpTimer.t > 0.42) inp.jumpP = true;
  if (jumpTimer.t > 0) inp.jump = true;
  jumpTimer.t = Math.max(0, jumpTimer.t - 1 / 60);

  let nearest = 1e9;
  let telegraph = false;
  for (const e of w.foes) {
    if (e.hp <= 0) continue;
    const dx = e.x - p.x;
    if (Math.abs(e.y - p.y) > 110 || dx < -40) continue;
    nearest = Math.min(nearest, dx);
    if (dx < 110 && (e.ai === "telegraph" || e.ai === "strike")) telegraph = true;
  }
  if (w.level === 4) {
    if (nearest < 90) {
      inp.dodgeP = true;
      inp.dodge = true;
      inp.dashP = true;
      inp.dash = true;
    }
  } else if (telegraph) {
    inp.dodgeP = true;
    inp.dodge = true;
  } else if (nearest < 84) {
    inp.atkP = true;
    inp.atk = true;
  }
  return inp;
}

function botRun(level: number, seconds: number): { maxX: number; deaths: number; mode: string; ally: number } {
  const w = fresh();
  w.unlocked = level;
  applyLevel(w, level, "l" + String(level));
  const jumpTimer = { t: 0 };
  let maxX = 0;
  let deaths = 0;
  const steps = 60 * seconds;
  for (let i = 0; i < steps; i++) {
    const before = w.mode;
    tick(w, botFrame(w, jumpTimer), 1 / 60);
    if (before !== "dead" && w.mode === "dead") deaths += 1;
    if (w.player.x > maxX) maxX = w.player.x;
    if (w.mode === "done") break;
  }
  return { maxX, deaths, mode: w.mode, ally: w.ally?.hp ?? -1 };
}

checkAssets();
{
  const w = fresh();
  const inp = blankInp();
  inp.pauseP = true;
  tick(w, inp, 1 / 60);
  assert(w.mode === "select", "P should open chapters from the title");
  inp.pauseP = true;
  tick(w, inp, 1 / 60);
  assert(w.mode === "title", "P should return from chapters to the title");
}
const story = scriptedClear();
const roof = botRun(1, 90);
assert(roof.mode === "done" || roof.maxX > 4200, "Rooftop chapter should be traversable (reached x=" + roof.maxX.toFixed(0) + ", mode=" + roof.mode + ", deaths=" + String(roof.deaths) + ")");
const train = botRun(2, 90);
assert(train.maxX > 4500 && train.ally > 0, "Night train should be traversable with Durga alive (x=" + train.maxX.toFixed(0) + ", ally=" + String(train.ally) + ", mode=" + train.mode + ", deaths=" + String(train.deaths) + ")");
const assembly = botRun(4, 40);
assert(assembly.maxX > 2920 && assembly.mode !== "dead", "Assembly gallery should be reachable before the session (x=" + assembly.maxX.toFixed(0) + ", mode=" + assembly.mode + ", deaths=" + String(assembly.deaths) + ")");
console.log("playthrough ok", JSON.stringify({ story, roof, train, assembly }));
