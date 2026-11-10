export type HudHold = "act" | "ability" | "crouch" | "throw";
export type HudSlot = "primary" | "high" | "mid" | "low";

export interface HudButtonDef {
  id: string;
  hold: HudHold;
  slot: HudSlot;
  label: string;
  icon: string;
  hint: string;
}

const HAND = `<path fill="currentColor" d="M11 14V6.5a1.6 1.6 0 0 1 3.2 0V14h1.2V8.2a1.5 1.5 0 0 1 3 0V16l2.2-1.6a1.6 1.6 0 0 1 2.2.4 1.7 1.7 0 0 1-.2 2.2L17.2 23a6 6 0 0 1-3.6 1.2c-2.6 0-4.6-1.6-4.6-4.4V14H11z"/>`;
const SPARK = `<path fill="currentColor" d="M18 2l-2 9h6L12 30l2-11H8L18 2z"/>`;
const PEBBLE = `<circle cx="16" cy="18" r="5" fill="currentColor"/><path fill="currentColor" d="M8 7l3 2-2 1-1-3zm14-1l1 4-3-1 2-3zM7 16l4 1-1 2-3-3z"/>`;
const CROUCH = `<path fill="currentColor" d="M8 20c1.6-4 4-6 8-6s6.4 2 8 6H8z"/><circle cx="16" cy="9" r="3.2" fill="currentColor"/>`;

/** Corner buttons. Primary is the large Action key. Throw is dragged to aim. */
export const HUD_BUTTONS: HudButtonDef[] = [
  { id: "act", hold: "act", slot: "primary", label: "Action", icon: HAND, hint: "act" },
  { id: "ability", hold: "ability", slot: "high", label: "Ability", icon: SPARK, hint: "ability" },
  { id: "throw", hold: "throw", slot: "mid", label: "Throw", icon: PEBBLE, hint: "throw" },
  { id: "crouch", hold: "crouch", slot: "low", label: "Crouch", icon: CROUCH, hint: "crouch" },
];

export function mountHudButtons(root: HTMLElement): HTMLButtonElement[] {
  root.replaceChildren();
  return HUD_BUTTONS.map((def) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "btn-" + def.id;
    btn.className = "hud-btn slot-" + def.slot;
    btn.dataset.hold = def.hold;
    btn.dataset.hud = def.id;
    btn.setAttribute("aria-label", def.label);
    btn.innerHTML = `<svg viewBox="0 0 32 32" aria-hidden="true">${def.icon}</svg><span class="touch-hint" data-hint="${def.hint}" hidden></span>`;
    root.appendChild(btn);
    return btn;
  });
}
