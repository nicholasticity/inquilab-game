import type { Mission, RouteStep } from "../sim/types";
import { fromMap } from "./grid";

function steps(list: (RouteStep | [number, number] | [number, number, RouteStep["face"]])[]): RouteStep[] {
  return list.map((step) => {
    if (Array.isArray(step)) {
      const [x, y, face] = step;
      return face ? { x, y, face } : { x, y };
    }
    return step;
  });
}

const parapetMap = [
  "#############",
  "#PssssXssV###",
  "######s######",
  "######s######",
  "#####sss#####",
  "#####sLs#####",
  "#############",
];

const marketMap = [
  "#############",
  "#Vsss##ssssD#",
  "###s####s####",
  "###ssssss####",
  "###...T..####",
  "###.o....####",
  "#############",
];

const loftMap = [
  "############",
  "#Dsssss#####",
  "####s#s#####",
  "##Hss*ssA###",
  "####s#######",
  "###sssB#####",
  "############",
];

const courierMap = [
  "###########",
  "#AssssTsE##",
  "##s###s####",
  "##ssCss####",
  "####L######",
  "###########",
];

const stairsMap = [
  "##########",
  "#BssXssE##",
  "####s#####",
  "###sss####",
  "##########",
];

export const mission1: Mission = {
  id: 1,
  name: "The Lahore Roofs",
  agent: "kite",
  parTurns: 48,
  objective: "Cross the roofs. Take the troop plans. The courier is still below.",
  brief: [
    {
      who: "netaji",
      text: "Arun Menon. Kite. Kozhikode taught you roofs. Tonight the troop plans sit over a Lahore bazaar.",
    },
    { who: "netaji", text: "I am asking for your nerve, not a body on the stones." },
    { who: "wire", text: "The street is theirs. The vents are yours. I have the radio." },
  ],
  rooms: [
    {
      id: "parapet",
      title: "The parapet",
      caption: "Reach the vent.",
      cols: 13,
      rows: 7,
      spawn: { x: 1, y: 1 },
      cells: fromMap(parapetMap, {
        V: { kind: "exit", exitId: "market", prop: "vent" },
        P: { kind: "start", prop: "vent" },
      }),
      guards: [
        {
          id: "yard1",
          kind: "constable",
          coneLength: 2,
          route: steps([
            [6, 5],
            [6, 4],
            [6, 3],
            [6, 3, "up"],
            [6, 4],
            [6, 5],
            [6, 5, "down"],
          ]),
        },
      ],
      teach: [
        { when: "room-start", text: "Swipe to sneak. He moves after you." },
        { when: "adjacent-to:6,1", text: "The gold floor is what he sees. Tap Wait." },
        { when: "entered:9,1", text: "The vent is yours." },
      ],
    },
    {
      id: "market",
      title: "The bazaar roofs",
      caption: "Cross the bazaar to the east roof.",
      cols: 13,
      rows: 7,
      spawn: { x: 1, y: 1 },
      cells: fromMap(marketMap, {
        V: { kind: "shadow", prop: "vent" },
        D: { kind: "exit", exitId: "loft", prop: "vent" },
        T: { kind: "ability", ground: "light", prop: "pot" },
        o: { kind: "note", ground: "light" },
        ".": { kind: "light" },
      }).map((cell) => {
        if ((cell.x === 3 && cell.y === 2) || (cell.x === 8 && cell.y === 2)) return { ...cell, prop: "stairs" as const };
        if (cell.y === 3 && cell.kind === "shadow") return { ...cell, prop: "awning" as const };
        return cell;
      }),
      guards: [
        {
          id: "g1",
          kind: "constable",
          route: steps([
            [3, 4],
            [4, 4],
            [5, 4],
            [6, 4],
            [7, 4],
            [8, 4],
            [8, 4, "left"],
            [7, 4],
            [6, 4],
            [5, 4],
            [4, 4],
            [3, 4],
            [3, 4, "up"],
          ]),
        },
        {
          id: "g2",
          kind: "officer",
          route: steps([
            [8, 5],
            [7, 5],
            [6, 5],
            [5, 5],
            [4, 5],
            [4, 5, "right"],
            [5, 5],
            [6, 5],
            [7, 5],
            [8, 5],
            [8, 5, "left"],
          ]),
        },
      ],
      teach: [
        { when: "room-start", text: "The roof is cut. Go down, or he will look up the stair." },
        { when: "ability-visible", text: "Tap the gleaming pot. He will walk to the sound." },
      ],
    },
    {
      id: "loft",
      title: "The loft",
      caption: "Take the plans, then choose a door.",
      cols: 12,
      rows: 7,
      spawn: { x: 1, y: 1 },
      cells: fromMap(loftMap, {
        D: { kind: "shadow", prop: "stairs" },
        A: { kind: "exit", exitId: "courier", label: "The courier", blockedUntil: "hasPlans" },
        B: { kind: "exit", exitId: "stairs", label: "The street", blockedUntil: "hasPlans" },
        "*": { kind: "item", prop: "plans" },
      }).map((cell) => (cell.x === 5 && cell.y === 3 ? { ...cell, prop: "desk" as const } : cell)),
      guards: [
        {
          id: "loft-officer",
          kind: "officer",
          route: steps([
            [7, 3],
            [6, 3],
            [5, 3],
            [5, 2],
            [5, 1],
            [5, 1, "left"],
            [5, 2],
            [5, 3],
            [6, 3],
            [7, 3],
            [7, 3, "left"],
          ]),
        },
      ],
      teach: [{ when: "adjacent-to-hide", text: "Step in to vanish. He will not check it unless he is searching." }],
    },
    {
      id: "courier",
      title: "Under the lamps",
      caption: "Get the courier on his feet.",
      cols: 11,
      rows: 6,
      spawn: { x: 1, y: 1 },
      cells: fromMap(courierMap, {
        A: { kind: "shadow", prop: "stairs" },
        T: { kind: "ability", ground: "shadow", prop: "bell" },
        E: { kind: "exit", exitId: "extract", blockedUntil: "savedCourier", prop: "vent" },
        C: { kind: "courier" },
      }),
      guards: [
        {
          id: "lamp-watch",
          kind: "constable",
          route: steps([
            [6, 3],
            [6, 3, "left"],
            [6, 3, "left"],
            [6, 2],
            [6, 1],
            [6, 1, "down"],
            [6, 2],
            [6, 3],
          ]),
        },
      ],
    },
    {
      id: "stairs",
      title: "The street stair",
      caption: "Cross when he looks away.",
      cols: 10,
      rows: 5,
      spawn: { x: 1, y: 1 },
      cells: fromMap(stairsMap, {
        B: { kind: "shadow", prop: "stairs" },
        X: { kind: "shadow" },
        E: { kind: "exit", exitId: "extract", choice: { key: "courier", value: "plans" }, prop: "vent" },
      }),
      guards: [
        {
          id: "stair1",
          kind: "constable",
          route: steps([
            [4, 3],
            [5, 3],
            [4, 3],
            [4, 3, "up"],
            [3, 3],
            [4, 3],
          ]),
        },
      ],
    },
  ],
};
