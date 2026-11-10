export type HudHold = "jump" | "atk" | "dash" | "dodge" | "act";
export type HudSlot = "primary" | "high" | "mid" | "low" | "context";

export interface HudButtonDef {
  id: string;
  hold: HudHold;
  slot: HudSlot;
  label: string;
  icon: string;
  show: "always" | "throw";
  cool?: "dodge" | "dash";
  hint: string;
}

const SWORD = `<g transform="rotate(45 16 16)"><path fill="currentColor" d="M14 2h4v15h-4zM8 15h16v3.2H8zM14.4 18.2h3.2V26h-3.2zM12.6 26h6.8v2.2h-6.8z"/></g>`;
const UP = `<path fill="currentColor" d="M16 5l11 13h-7v9h-8v-9H5L16 5z"/>`;
const ROLL = `<path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" d="M22 10a8 8 0 1 0 1.5 8"/><path fill="currentColor" d="M20 6l6 6-7 1 1-7z"/>`;
const SPEED = `<path fill="currentColor" d="M2 7h16l3 2.2-3 2.3H2V7zm4 7.2h17l3 2.3-3 2.3H6v-4.6zM2 21.4h13l3 2.3-3 2.3H2v-4.6z"/>`;
const LEAF = `<path fill="currentColor" d="M8 4h11l7 7v17H8V4zm11 1.5V12h6.2L19 5.5zM11 16h10v2H11v-2zm0 5h10v2H11v-2z"/>`;

/** Corner buttons. Edit this list to move, rename, or swap an action. Slots are the quarter-arc: primary is the large corner button. */
export const HUD_BUTTONS: HudButtonDef[] = [
  { id: "atk", hold: "atk", slot: "primary", label: "Attack", icon: SWORD, show: "always", hint: "atk" },
  { id: "dash", hold: "dash", slot: "high", label: "Dash", icon: SPEED, show: "always", cool: "dash", hint: "dash" },
  { id: "jump", hold: "jump", slot: "mid", label: "Jump", icon: UP, show: "always", hint: "jump" },
  { id: "dodge", hold: "dodge", slot: "low", label: "Dodge", icon: ROLL, show: "always", cool: "dodge", hint: "dodge" },
  { id: "act", hold: "act", slot: "context", label: "Throw", icon: LEAF, show: "throw", hint: "act" },
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
    btn.hidden = def.show !== "always";
    btn.innerHTML = `<svg viewBox="0 0 32 32" aria-hidden="true">${def.icon}</svg>${def.cool ? `<span class="sweep"></span>` : ""}<span class="touch-hint" data-hint="${def.hint}" hidden></span>`;
    root.appendChild(btn);
    return btn;
  });
}
