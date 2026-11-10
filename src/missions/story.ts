import type { BriefLine, Story } from "../sim/types";

export interface MissionCard {
  id: number;
  name: string;
  agent: string;
  blurb: string;
}

export const MISSION_CARDS: MissionCard[] = [
  { id: 1, name: "The Lahore Roofs", agent: "Kite", blurb: "Vents above a watched bazaar." },
  { id: 2, name: "The Arms Train", agent: "Veil", blurb: "A stolen coat on a night platform." },
  { id: 3, name: "The Press", agent: "Key", blurb: "The hall is lit. The passage is not." },
  { id: 4, name: "The Assembly", agent: "Veil", blurb: "Swap the file, or read it aloud." },
  { id: 5, name: "The Lock", agent: "Key", blurb: "A warder, and a wing of doors." },
  { id: 6, name: "The Viceroy's House", agent: "Kite", blurb: "The signal, then the gate." },
];

export const NAMES: Record<string, string> = {
  netaji: "NETAJI",
  wire: "WIRE",
  kite: "KITE",
  veil: "VEIL",
  key: "KEY",
};

export function mission2Brief(story: Story): BriefLine[] {
  const react =
    story.courier === "save"
      ? "You brought the courier off the roofs. The yard is a little blinder for it."
      : story.courier === "plans"
        ? "The plans are on my table, and so is the price. The yard knows a thief was on the roofs."
        : "The arms train is in the yard. I need it ruined, or I need it ours.";
  return [
    { who: "netaji", text: react + " Leela Sen. Veil. A coat is your door." },
    { who: "netaji", text: "I am asking you to walk as if you belong, until you choose not to." },
    { who: "wire", text: "Sabotage keeps the rifles out of the cantonment. Hijack arms the cells." },
  ];
}

export function headline(level: number, story: Story): string {
  if (level === 1) return story.courier === "plans" ? "TROOP PLANS TAKEN IN LAHORE" : "COURIER CLEAR OF THE ROOFS";
  if (level === 2) return story.train === "hijack" ? "ARMS TRAIN IN REBEL HANDS" : "ARMS TRAIN LEFT DEAD ON THE SIDING";
  if (level === 3) return story.papers === "passes" ? "FORGED PASSES ON THE ROAD" : "THE PRESS IS OUT OF THE WORKSHOP";
  if (level === 4) return story.assembly === "broadcast" ? "THE DECLARATION IS READ IN THE HOUSE" : "A FILE IS SWAPPED IN THE ASSEMBLY";
  if (level === 5) return story.warder === "lock" ? "THE WING IS OPEN. THE WARDER STAYS" : "REBEL LEADERS WALK OUT";
  return story.signal === "early" ? "THE SIGNAL BURNS OVER THE HOUSE" : "THE COLUMN IS ON THE AVENUE";
}

export function epilogue(story: Story): string[] {
  const lines: string[] = [];
  if (story.courier === "save") lines.push("Kite went back for the courier. The man carried the next night's map.");
  else if (story.courier === "plans") lines.push("Kite kept the plans and left the courier in the lamps. The yard was waiting.");
  if (story.train === "sabotage") lines.push("Veil ruined the arms train. The cantonment woke to empty wagons.");
  else if (story.train === "hijack") lines.push("Veil took the train. The cells met it down the line.");
  if (story.downs > 0) {
    lines.push(
      story.downs === 1
        ? "One sentry was laid down quietly."
        : story.downs + " sentries were laid down quietly.",
    );
  } else lines.push("No sentry was put on the floor. The route stayed a rumour.");
  lines.push("The press, the assembly, the lock, and the Viceroy's house are still on the road.");
  lines.push("Dilli Chalo.");
  return lines;
}
