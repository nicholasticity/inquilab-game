# Inquilab

A dramatic, non-lethal 2D action game about Bhagat Singh and the Hindustan Socialist Republican Association, from the Lahore protest of October 1928 to the dawn of 23 March 1931.

You play across five chapters: a rooftop escape, a night train out of Lahore with Durgawati Devi, a raid on a secret press, the Central Legislative Assembly, and the hunger strike in Lahore Central Jail. Constables are knocked down. Nobody is killed.

The pictures are painted scenes and character frames. The roofs, checkpoints, and leaflets are drawn in play.

## Controls

Desktop:

| Action | Keys |
| --- | --- |
| Move | WASD or arrow keys |
| Jump | Space (also W / Up) |
| Attack | J or X |
| Dash / slide | K or C (hold Down to slide) |
| Dodge | L or Shift |
| Begin, advance dialogue, continue | Enter or Space |
| Chapters | P, or 1–5 once a chapter is unlocked |
| Pause | Esc or P |

Touch: the on-screen pad (move, jump, attack, dash, dodge), Begin and Chapters on the title, and the pause button. Tap the picture to advance dialogue and to continue after a chapter.

Slide or dodge under the low beams on the train. In the Assembly, reach the gallery and throw eight leaflets; the guards there are not fought. During the fast, match the prompt before the bar runs out.

## Run locally

Requires Node 20 or newer.

```bash
npm ci
npm run dev
```

The dev server listens on port 5173. A production build is the `dist/` folder:

```bash
npm run build
npm run preview
```

`npm test` plays the five chapters in simulation, from the title through the finale, and checks that a runner can cross the rooftop shaft.

## Deploy on Render

This is a static site. There is no server.

In the Render Dashboard, create a **Static Site** from this repository:

| Setting | Value |
| --- | --- |
| Build command | `npm ci && npm run build` |
| Publish directory | `dist` |

`render.yaml` is the same Blueprint. The site is a single page, so it does not need a rewrite rule. Node 22 is set for the build with `NODE_VERSION`.

The built JavaScript, CSS, and paintings are content-hashed under `dist/static/`. The Blueprint tells Render to cache those for a year (`Cache-Control: public, max-age=31536000, immutable`). `index.html` is served with `no-cache`, so a new deploy picks up the new filenames. Render also drops its CDN cache on every deploy.

## Art

Scenes and portraits are the painted webps. Sprite frames are the same cut paintings, saved at 273 pixels tall — twice the height they are drawn on the 960×540 canvas, which matches a sharp screen. The title opens as soon as its painting is in. Chapter 1’s painting, portraits, and frames load next, and the later chapters load while you play. The game does not fetch anything except those files.

A few poses were never painted, and the game uses the frame the original did:

- Constables only have an attack painting, so they patrol in that pose.
- A downed constable uses the officer's fallen painting. There is no constable-down frame.
- Officers have idle, attack, and down — no walk cycle — so they patrol in the idle painting.
- Dodge and slide share the dodge painting.

Platforms, papers, rain, the raid's firelight, and the heads-up display are drawn in code. The bundle also contains a train-compartment painting and portraits of Rajguru, a witness, Bagh, and the inspector that this action version never shows; those files are not in the site.
