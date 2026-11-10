import { detectsPlayer, paintedNodes, seenNodes } from "../ai";
import { cellRect, hudRects, layoutBoard, overlaps } from "../../render/layout";
import { strideFrame } from "../../render/stride";
import { mission1 } from "../../missions/m01";
import { mission2 } from "../../missions/m02";
import { applyAction, startRoom } from "../rules";
import { emptyStory, enterRoom, playActions, solve, stepRun } from "../run";
import type { Action, Mission, Room } from "../types";

let failed = 0;

function assert(cond: unknown, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error("FAIL", msg);
  } else {
    console.log("ok", msg);
  }
}

function sameNodes(a: { x: number; y: number }[], b: { x: number; y: number }[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((node, i) => node.x === b[i].x && node.y === b[i].y);
}

function encode(actions: Action[]): string {
  return actions
    .map((action) => {
      if (action.type === "wait") return ".";
      if (action.type === "move") return action.dir[0].toUpperCase();
      if (action.x !== undefined) return "A" + action.x + "," + action.y;
      return "C";
    })
    .join(" ");
}

const parapet = enterRoom(mission1, "parapet");
const yard = parapet.room.guards[0];
yard.x = 6;
yard.y = 3;
yard.face = "up";
const danger = seenNodes(parapet.room, yard);
assert(sameNodes(danger, [{ x: 6, y: 2 }, { x: 6, y: 1 }]), "yard cone at (6,3) up is the shaft and the crossing");
assert(sameNodes(paintedNodes(parapet.room, yard), danger), "painted nodes equal seen nodes");

yard.face = "down";
yard.y = 5;
yard.x = 6;
const downCone = seenNodes(parapet.room, yard);
assert(downCone.length === 0, "cone stops at the void below the lamp");

const market = enterRoom(mission1, "market");
const g1 = market.room.guards.find((guard) => guard.id === "g1");
if (!g1) throw new Error("missing g1");
g1.x = 3;
g1.y = 4;
g1.face = "up";
const stair = seenNodes(market.room, g1);
assert(sameNodes(stair, [{ x: 3, y: 3 }, { x: 3, y: 2 }]), "west stair scan stops before the roof");
assert(!stair.some((node) => node.y === 1), "g1 cannot see the roof");

const blocked = applyAction(enterRoom(mission1, "parapet").room, { type: "move", dir: "up" });
assert(!blocked.result.ok && blocked.state.playerY === 1, "illegal move into void is rejected");

const stone = applyAction(market.room, { type: "ability", x: 6, y: 4 });
const pulled = stone.state.guards.find((guard) => guard.id === "g1");
assert(stone.result.ok && pulled?.state === "sus" && pulled.targetX === 6 && pulled.targetY === 4, "stone pulls g1 to the pot");
const g2 = stone.state.guards.find((guard) => guard.id === "g2");
assert(g2?.state === "sus", "g2 is in path range of the pot");

const hideRoom: Room = {
  id: "hide-test",
  title: "hide",
  cols: 5,
  rows: 3,
  spawn: { x: 1, y: 1 },
  cells: [
    { x: 1, y: 1, kind: "hide" },
    { x: 2, y: 1, kind: "shadow" },
    { x: 3, y: 1, kind: "shadow" },
  ],
  guards: [
    {
      id: "h",
      kind: "constable",
      route: [
        { x: 3, y: 1, face: "left" },
        { x: 3, y: 1, face: "left" },
      ],
    },
  ],
};
const hideMission: Mission = {
  id: 99,
  name: "hide",
  agent: "kite",
  brief: [],
  rooms: [hideRoom],
  parTurns: 5,
  objective: "",
};
const hiding = startRoom(hideMission, hideRoom, null);
const hGuard = hiding.guards[0];
assert(seenNodes(hiding, hGuard).some((node) => node.x === 1 && node.y === 1), "patrol cone includes the hide");
assert(!detectsPlayer(hiding, hGuard), "a patrol cone does not catch a hidden player");
hGuard.state = "search";
hGuard.x = 2;
hGuard.y = 1;
hGuard.face = "left";
assert(detectsPlayer(hiding, hGuard), "a searching guard checks the hide he faces");

const subRoom: Room = {
  id: "sub",
  title: "sub",
  cols: 4,
  rows: 3,
  spawn: { x: 1, y: 1 },
  cells: [
    { x: 1, y: 1, kind: "shadow" },
    { x: 2, y: 1, kind: "shadow" },
    { x: 2, y: 0, kind: "shadow" },
    { x: 0, y: 1, kind: "shadow" },
  ],
  guards: [
    {
      id: "s",
      kind: "constable",
      route: [
        { x: 2, y: 1, face: "left" },
        { x: 2, y: 1, face: "left" },
      ],
    },
  ],
};
const subMission: Mission = { ...hideMission, rooms: [subRoom] };
const behind = startRoom(subMission, subRoom, null);
behind.playerX = 2;
behind.playerY = 0;
const sub = applyAction(behind, { type: "move", dir: "down" });
assert(sub.result.ok && sub.result.subdued === "s" && !sub.result.caught, "stepping from behind subdues");

const front = startRoom(subMission, subRoom, null);
front.playerX = 1;
front.playerY = 1;
const caughtFront = applyAction(front, { type: "move", dir: "right" });
assert(Boolean(caughtFront.result.caught) && !caughtFront.result.subdued, "stepping in from the front is a catch");

for (const room of mission1.rooms) {
  const layout = layoutBoard(room.cols, room.rows);
  const huds = hudRects();
  let hit = false;
  for (const cell of room.cells) {
    const rect = cellRect(layout, cell.x, cell.y);
    if (huds.some((hud) => overlaps(rect, hud.r))) hit = true;
  }
  assert(!hit, "mission 1 " + room.id + " tiles stay clear of the HUD");
}

for (const room of mission2(emptyStory()).rooms) {
  const layout = layoutBoard(room.cols, room.rows);
  const huds = hudRects();
  let hit = false;
  for (const cell of room.cells) {
    if (huds.some((hud) => overlaps(cellRect(layout, cell.x, cell.y), hud.r))) hit = true;
  }
  assert(!hit, "mission 2 " + room.id + " tiles stay clear of the HUD");
}

const plantStart = strideFrame(0.05);
const plantStart2 = strideFrame(0.12);
assert(plantStart.leadLift === 0 && plantStart.leadT === 0 && plantStart2.leadT === 0, "leading foot stays planted at the start");
const air = strideFrame(0.5);
assert(air.leadLift > 0 && air.trailLift > 0 && air.hop > 0, "both feet leave the ground mid-step");
const landed = strideFrame(0.95);
assert(landed.leadT === 1 && landed.trailT === 1 && landed.leadLift === 0, "both feet plant on the destination");

const SAVE = "R R R R R R R R R R D D R R R R R U U R R R R R R D D R R R R R D D R R L L A6,1 U U R R R R R R";
const PLANS = "R R R R R R R R R R D D R R R R R U U R R R R R R D D R L D D R R R R . R R R R";
const TRAIN = "R R R R C R R R R R R L R R R R R R R D D";

console.log("solving mission 1, save, quiet…");
const savePath = solve(mission1, emptyStory(), { goal: "save", quiet: true, stone: true });
assert(Boolean(savePath), "a quiet save of mission 1 exists");
if (savePath) {
  assert(encode(savePath) === SAVE, "recorded save swipes stay the known quiet route");
  const replay = playActions(mission1, savePath);
  assert(replay.type === "extract" && replay.story.courier === "save", "recorded save path extracts with courier saved");
}

console.log("solving mission 1, plans, quiet…");
const plansPath = solve(mission1, emptyStory(), { goal: "plans", quiet: true });
assert(Boolean(plansPath), "a quiet plans exit exists");
if (plansPath) {
  assert(encode(plansPath) === PLANS, "recorded plans swipes stay the known quiet route");
  const replay = playActions(mission1, plansPath);
  assert(replay.type === "extract" && replay.story.courier === "plans", "plans path writes courier = plans");
}

console.log("solving mission 2…");
const train = solve(mission2(emptyStory()), emptyStory(), { goal: "sabotage" });
assert(Boolean(train), "mission 2 sabotage is solvable");
if (train) {
  assert(encode(train) === TRAIN, "recorded sabotage swipes stay the known route");
  const replay = playActions(mission2(emptyStory()), train);
  assert(replay.type === "extract" && replay.story.train === "sabotage", "mission 2 sabotage flag is written");
}

const heated = mission2({ ...emptyStory(), courier: "plans" });
assert(heated.rooms[0].guards.some((guard) => guard.id === "heat1"), "leaving the courier adds a constable to mission 2");

const veil = enterRoom(mission2(emptyStory()), "trench");
veil.room.disguised = true;
const officer = veil.room.guards.find((guard) => guard.id === "door");
if (!officer) throw new Error("missing officer");
const runWait = stepRun(veil, { type: "wait" });
assert(runWait.type !== "caught", "a disguised wait is not an instant catch");
const coated = enterRoom(mission2(emptyStory()), "trench");
coated.room.disguised = true;
coated.room.playerX = officer.x;
coated.room.playerY = officer.y;
const shared = applyAction(coated.room, { type: "wait" });
assert(Boolean(shared.result.caught), "sharing an officer's node breaks the coat");

if (failed > 0) {
  console.error(failed + " failed");
  process.exit(1);
}
console.log("all passed");
