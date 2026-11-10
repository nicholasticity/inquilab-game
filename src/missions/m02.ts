import type { GuardDef, Mission, Story } from "../sim/types";
import { fromMap } from "./grid";
import { mission2Brief } from "./story";

/**
 * Room 1 teaches the coat: patrol cones ignore a uniform, an officer's own square does not.
 * Room 2 makes you wait for that officer to step aside.
 * Room 3 is the choice, two doors on the siding.
 * Taking only the plans in Lahore adds one constable to the trench.
 */
export function mission2(story: Story): Mission {
  const heat: GuardDef[] =
    story.courier === "plans"
      ? [
          {
            id: "heat1",
            kind: "constable",
            route: [
              { x: 3, y: 3 },
              { x: 4, y: 3 },
              { x: 5, y: 3 },
              { x: 6, y: 3 },
              { x: 6, y: 3, face: "up" },
              { x: 5, y: 3 },
              { x: 4, y: 3 },
              { x: 3, y: 3 },
              { x: 3, y: 3, face: "up" },
            ],
          },
        ]
      : [];

  return {
    id: 2,
    name: "The Arms Train",
    agent: "veil",
    parTurns: 36,
    objective: "Reach the train. Sabotage it, or take it for the cells.",
    brief: mission2Brief(story),
    rooms: [
      {
        id: "trench",
        title: "The trench mouth",
        caption: "The coat, then the platform.",
        cols: 12,
        rows: 5,
        spawn: { x: 1, y: 1 },
        cells: fromMap(
          [
            "############",
            "#Ps......V##",
            "##ssssssss##",
            "##ssssssss##",
            "############",
          ],
          {
            P: { kind: "start" },
            V: { kind: "exit", exitId: "platform", prop: "vent" },
            ".": { kind: "light" },
          },
        ).map((cell) => {
          if (cell.x === 2 && (cell.y === 2 || cell.y === 3)) return { ...cell, prop: "stairs" as const };
          return cell;
        }),
        guards: [
          {
            id: "pace",
            kind: "constable",
            route: [
              { x: 3, y: 1 },
              { x: 4, y: 1 },
              { x: 5, y: 1 },
              { x: 6, y: 1 },
              { x: 7, y: 1 },
              { x: 7, y: 1, face: "left" },
              { x: 6, y: 1 },
              { x: 5, y: 1 },
              { x: 4, y: 1 },
              { x: 3, y: 1 },
              { x: 3, y: 1, face: "down" },
            ],
          },
          {
            id: "door",
            kind: "officer",
            route: [
              { x: 8, y: 2 },
              { x: 8, y: 1 },
              { x: 8, y: 1, face: "left" },
              { x: 8, y: 2, face: "down" },
            ],
          },
          ...heat,
        ],
        teach: [
          { when: "room-start", text: "Tap Coat. Patrols look through a uniform." },
          { when: "adjacent-to:8,1", text: "Do not end your step on an officer." },
        ],
      },
      {
        id: "platform",
        title: "The carriage door",
        caption: "Cross when the officer leaves the square.",
        cols: 10,
        rows: 5,
        spawn: { x: 1, y: 1 },
        cells: fromMap(
          [
            "##########",
            "#Vsss..sE#",
            "####s#####",
            "###sssso##",
            "##########",
          ],
          {
            V: { kind: "shadow", prop: "stairs" },
            E: { kind: "exit", exitId: "siding", prop: "vent" },
            ".": { kind: "light" },
            o: { kind: "note", ground: "shadow" },
          },
        ),
        guards: [
          {
            id: "clerk",
            kind: "constable",
            route: [
              { x: 5, y: 1 },
              { x: 6, y: 1 },
              { x: 6, y: 1, face: "left" },
              { x: 5, y: 1 },
              { x: 4, y: 1 },
              { x: 4, y: 1, face: "right" },
            ],
          },
          {
            id: "door2",
            kind: "officer",
            route: [
              { x: 4, y: 3 },
              { x: 4, y: 2 },
              { x: 4, y: 1 },
              { x: 4, y: 1, face: "left" },
              { x: 4, y: 2 },
              { x: 4, y: 3 },
              { x: 4, y: 3, face: "up" },
            ],
          },
        ],
        teach: [{ when: "room-start", text: "The door officer moves. Cross when he leaves the square." }],
      },
      {
        id: "siding",
        title: "The siding",
        caption: "Sabotage the wagon, or take the engine.",
        cols: 11,
        rows: 5,
        spawn: { x: 1, y: 1 },
        cells: fromMap(
          [
            "###########",
            "#Dssssssss#",
            "##s######s#",
            "##A..ss..B#",
            "###########",
          ],
          {
            D: { kind: "shadow", prop: "stairs" },
            A: {
              kind: "exit",
              exitId: "extract",
              label: "Sabotage",
              choice: { key: "train", value: "sabotage" },
            },
            B: {
              kind: "exit",
              exitId: "extract",
              label: "Hijack",
              choice: { key: "train", value: "hijack" },
            },
            ".": { kind: "light" },
          },
        ),
        guards: [
          {
            id: "siding-watch",
            kind: "constable",
            route: [
              { x: 3, y: 1 },
              { x: 4, y: 1 },
              { x: 5, y: 1 },
              { x: 6, y: 1 },
              { x: 7, y: 1 },
              { x: 7, y: 1, face: "down" },
              { x: 6, y: 1 },
              { x: 5, y: 1 },
              { x: 4, y: 1 },
              { x: 3, y: 1 },
            ],
          },
        ],
        teach: [{ when: "room-start", text: "Sabotage the wagon, or take the engine. Both are doors." }],
      },
    ],
  };
}
