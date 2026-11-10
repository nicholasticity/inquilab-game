import { setMuted } from "../audio/cues";
import { emptyStory } from "../sim/run";
import type { Story } from "../sim/types";

const KEY = "inquilab-go";

export interface Campaign {
  story: Story;
  unlocked: number;
  mute: boolean;
}

function fresh(): Campaign {
  return { story: emptyStory(), unlocked: 1, mute: false };
}

function load(): Campaign {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const parsed = JSON.parse(raw) as Partial<Campaign>;
    const story = { ...emptyStory(), ...(parsed.story ?? {}) };
    return {
      story,
      unlocked: parsed.unlocked === 2 ? 2 : 1,
      mute: parsed.mute === true,
    };
  } catch {
    return fresh();
  }
}

export const campaign: Campaign = load();
setMuted(campaign.mute);

export function persist(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(campaign));
  } catch {
    /* private mode */
  }
}

export function resetStory(): void {
  campaign.story = emptyStory();
  persist();
}
