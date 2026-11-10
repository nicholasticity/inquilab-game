import type { Mission, Story } from "../sim/types";
import { mission1 } from "./m01";
import { mission2 } from "./m02";
import { emptyStory } from "../sim/run";

export function buildMission(id: number, story: Story = emptyStory()): Mission | null {
  if (id === 1) return mission1;
  if (id === 2) return mission2(story);
  return null;
}

export { mission1, mission2 };
