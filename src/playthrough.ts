import fs from "node:fs";
import path from "node:path";
import { allAssetPaths, deferredPaths, finalePaths, levelPaths, titlePaths } from "./assets";
import {
  advanceFromDone,
  applyLevel,
  blankInp,
  fresh,
  tick,
  type Ent,
  type Inp,
  type World,
} from "./game";

function fail(msg: string): never {
  throw new Error(msg);
}

function assert(cond: boolean, msg: string): void {
  if (!cond) fail(msg);
}

function modeOf(w: World): string {
  return w.mode;
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

function openPlay(id: number): World {
  const w = fresh();
  applyLevel(w, id, "");
  assert(modeOf(w) === "play", "Level " + String(id) + " should start in play without a talk key");
  return w;
}

function place(e: Ent, x: number, y: number): void {
  e.x = x;
  e.y = y;
  e.vx = 0;
  e.vy = 0;
  e.onG = true;
}

function shield(): { w: World; foe: Ent } {
  const w = openPlay(1);
  w.heavyOn = true;
  const foe = w.foes.find((e) => e.kind === "shield");
  if (!foe) fail("Chapter 1 should field a shield");
  place(w.player, 400, 370);
  place(foe, 440, 370);
  foe.face = -1;
  foe.ai = "march";
  w.player.face = 1;
  return { w, foe };
}

function combat(): void {
  const light = shield();
  const before = light.foe.hp;
  light.w.player.st = "attack";
  light.w.player.combo = 1;
  light.w.player.stT = 0.05;
  light.w.player.did = false;
  light.w.player.atkId = 3;
  tick(light.w, blankInp(), 1 / 60);
  assert(light.foe.hp === before, "A light hit should clang on a shield's face");
  assert(light.w.banner === "CLANG", "A blocked light should read CLANG");

  const heavy = shield();
  const hp = heavy.foe.hp;
  heavy.w.player.st = "heavy";
  heavy.w.player.stT = 0.15;
  heavy.w.player.did = false;
  heavy.w.player.atkId = 4;
  tick(heavy.w, blankInp(), 1 / 60);
  assert(heavy.foe.hp < hp, "A heavy should break a shield");
  assert(heavy.w.foes.includes(heavy.foe), "A disarmed opponent stays in the scene");
}

function perfectDodge(): void {
  const w = openPlay(1);
  const foe = w.foes.find((e) => e.kind === "constable");
  if (!foe) fail("Chapter 1 should field a constable");
  place(foe, 500, 370);
  foe.tag = "";
  foe.face = 1;
  foe.ai = "strike";
  foe.st = "attack";
  foe.stT = 0.07;
  foe.did = false;
  place(w.player, 520, 370);
  w.player.st = "dodge";
  w.player.stT = 0.1;
  w.player.inv = 0.25;
  tick(w, blankInp(), 1 / 60);
  assert(w.perfects >= 1 && w.focus > 0, "Dodging through a readable strike should grant focus");
  assert(w.player.hp === w.player.maxHp, "A perfect dodge takes no health");
}

function disguise(): void {
  const w = openPlay(2);
  const watch = w.foes.find((e) => e.tag === "watch");
  if (!watch || !w.ally) fail("Chapter 2 needs Durga and a watcher");
  place(watch, 900, 372);
  watch.face = -1;
  watch.ai = "watch";
  place(w.ally, 760, 372);
  place(w.player, 790, 372);
  w.player.st = "idle";
  tick(w, blankInp(), 1 / 60);
  assert(watch.ai === "watch", "Standing with Durga should hide Bhagat from the platform watch");
  place(w.ally, 200, 372);
  place(w.player, 760, 372);
  tick(w, blankInp(), 1 / 60);
  assert(watch.ai === "chase" || watch.ai === "aim", "Leaving Durga should break the disguise");
}

function lesson(): void {
  const w = openPlay(1);
  const startY = w.player.y;
  const right = blankInp();
  right.r = true;
  for (let i = 0; i < 40; i++) tick(w, right, 1 / 60);
  assert(w.lesson >= 1, "Walking should clear the first lesson");
  const jump = blankInp();
  jump.jumpP = true;
  jump.jump = true;
  tick(w, jump, 1 / 60);
  assert(w.lesson >= 2, "Jumping should clear the second lesson");
  let rose = false;
  for (let i = 0; i < 18; i++) {
    tick(w, blankInp(), 1 / 60);
    if (w.player.y < startY - 20) rose = true;
  }
  assert(rose, "A jump should leave the ground");
  let landed = false;
  for (let i = 0; i < 80; i++) {
    tick(w, blankInp(), 1 / 60);
    if (w.player.onG) landed = true;
  }
  assert(landed, "Gravity should bring the jump back down");
  assert(modeOf(w) === "play" && w.player.hp > 0, "The opening should not seize the player");
}

function clearChapter(w: World, id: number): void {
  applyLevel(w, id, "");
  w.mode = "play";
  if (id === 1 || id === 2) {
    w.bossDown = true;
    if (w.ally) {
      w.ally.hp = w.ally.maxHp;
      w.ally.x = w.exitX + 20;
      w.ally.y = 300;
    }
    w.player.x = w.exitX + 30;
    w.player.y = 300;
    w.player.vx = 0;
    w.player.vy = 0;
    tick(w, blankInp(), 1 / 60);
  } else if (id === 3) {
    for (const paper of w.papers) paper.got = true;
    w.wave = 2;
    w.player.x = w.exitX + 30;
    w.player.y = 360;
    w.player.vy = 0;
    tick(w, blankInp(), 1 / 60);
  } else if (id === 4) {
    w.leaflets = 8;
    w.gallery = true;
    w.player.x = 2920;
    w.player.y = 360;
    w.player.vx = 0;
    w.player.vy = 0;
    w.player.st = "idle";
    for (let i = 0; i < 100 && modeOf(w) === "play"; i++) tick(w, blankInp(), 1 / 60);
    assert(modeOf(w) === "talk", "Standing in the gallery should open the arrest");
    skipTalk(w);
  } else if (id === 5) {
    w.days = 95;
    w.jatin = true;
    w.flags = 2 | 4 | 8 | 16;
    w.breadOn = true;
    w.player.x = w.breadX;
    w.player.y = 390;
    const eat = blankInp();
    eat.atkP = true;
    tick(w, eat, 1 / 60);
    assert(w.broke && modeOf(w) === "talk", "Striking the bread should break the fast");
    skipTalk(w);
  }
  if (id < 5) assert(modeOf(w) === "done" && (w.rank === "S" || w.rank === "A" || w.rank === "B" || w.rank === "C"), "Chapter " + String(id) + " should rank a clear");
}

function story(): void {
  const w = fresh();
  tick(w, pressStart(), 1 / 60);
  assert(modeOf(w) === "talk" && w.level === 1 && w.bg === "lahore", "The title opens the Lahore talk");
  skipTalk(w);
  assert(modeOf(w) === "play" && w.hint.length > 0, "Chapter 1 should teach before the cordon");
  for (let id = 1; id <= 5; id++) clearChapter(w, id);
  assert(modeOf(w) === "finale", "The hunger strike should reach the finale");
  w.t = 7;
  tick(w, pressStart(), 1 / 60);
  assert(modeOf(w) === "title", "The finale should return to the title");
  applyLevel(w, 1, "");
  w.mode = "done";
  w.level = 1;
  advanceFromDone(w);
  assert(w.level === 2 && modeOf(w) === "talk", "A clear should continue into the next chapter");
}

function cross(id: number, goal: number): void {
  const w = openPlay(id);
  w.player.hp = 9;
  w.lesson = 5;
  w.heavyOn = true;
  w.dashOn = true;
  for (const e of w.foes) { e.hp = 0; e.ai = "down"; }
  if (w.ally) w.ally.x = -400;
  let cool = 0;
  let best = 0;
  for (let i = 0; i < 60 * 25; i++) {
    const p = w.player;
    const inp = blankInp();
    inp.r = true;
    const foot = p.y + p.h;
    const ahead = w.plats.some((pl) => pl.t !== 4 && p.x + 50 > pl.x && p.x + 50 < pl.x + pl.w && Math.abs(pl.y - foot) < 30);
    const higher = w.plats.some((pl) => pl.t !== 4 && p.x + 90 > pl.x && p.x + 40 < pl.x + pl.w && pl.y < foot - 36 && pl.y > foot - 150);
    cool -= 1 / 60;
    if (p.onG && cool <= 0 && (!ahead || higher)) {
      inp.jump = true;
      inp.jumpP = true;
      cool = 0.4;
    } else if (!p.onG && p.vy < 0) inp.jump = true;
    tick(w, inp, 1 / 60);
    if (p.x > best) best = p.x;
    if (best > goal) return;
  }
  fail("Chapter " + String(id) + " route ended at " + best.toFixed(0) + ", short of " + String(goal));
}

checkAssets();
combat();
perfectDodge();
disguise();
lesson();
cross(1, 3000);
cross(2, 2400);
story();
console.log("playthrough ok");
