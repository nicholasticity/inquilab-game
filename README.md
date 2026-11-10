# Inquilab

A dramatic, non-lethal 2D action game about Bhagat Singh and the Hindustan Socialist Republican Association, from the Lahore protest of October 1928 to the dawn of 23 March 1931.

You play five chapters. Constables are knocked down, disarmed, or evaded. Nobody is killed.

The pictures are painted scenes and character frames. Shields, rifle bolts, trails, and the heads-up display are drawn in play.

## How a chapter plays

Tap Attack and the light comes out on the press. Hold it, and the heavy comes out when you let go. A dodge cuts the swing short. The third light drops a baton constable. The heavy breaks a shield. Dodge as a swing is telegraphed: passing through it grants a focus window, and the next hit that connects is heavier and opens a guard. Dash, from chapter 2, has no invulnerability; hold Down and dash to slide under a beam. Jumps are shorter if you release early. A perfect dodge after Jatin's death also steadies the fast.

Each chapter ends with a rank from S to C, from the hits you took, the reads you made, the alarm you raised, and the time. A checkpoint rewinds the room, so a death is not a way to farm the rank. Health is five. Falling off the world, or being seized, returns you to the last checkpoint.

## Chapters

1. **Rooftop dragnet.** Sukhdev talks you through the string, the dodge, and the heavy on the first roof. A scaffold climbs over a lathi line on the low road. Past a quiet roof, the lanes close behind you across collapsing brick. Pillars lead to an inspector who has to be disarmed before the cordon lets you through. Folded copies sit off the path.
2. **Night train.** Stay at Durga Devi's shoulder on the stone platform and the watch does not know you. Step across the carriages, duck the beam on the moving car, and close on the rifleman on the last carriage. She trips anyone who gets on you. Lose her and the chapter fails.
3. **The workshop.** Three pamphlet bundles, up the stairs and across a floor that drops when you stand on it. The fire climbs behind you and takes a burning stretch of boards. Chandrashekhar Azad holds the door once the bundles are in hand. The men he stalled still have to be disarmed.
4. **The Assembly.** Slip the cones or fight through the marble hall and its balcony. The gallery is further on. Throw eight leaflets with Attack, or with the Throw button. Batukeshwar Dutt throws with you on the fourth and the eighth. Then stand in the circle and be arrested. An alarm fills the house.
5. **The long fast.** The cell has a bunk and a stone floor. The same fights, slower as the days pass. Warders come in. Refuse the bread. After Jatin's letter, a perfect dodge mends you. Disarm the jailer once the fast has held, or strike the bread and be taken earlier, at a worse rank.

The finale is the leaflet from the Assembly, on the morning of 23 March 1931.

## Controls

Desktop:

| Action | Keys |
| --- | --- |
| Move | WASD or arrow keys |
| Crouch | Hold Down |
| Jump | Space (also W / Up) |
| Light string | Tap J or X. The swing starts on the press |
| Heavy | Hold J or X, then let go. The heavy starts on the release |
| Dash / slide | K or C (hold Down to slide). Dash is locked until the train |
| Dodge | L or Shift |
| Begin, advance dialogue, continue | Enter or Space |
| Chapters | P, or 1–5 once a chapter is unlocked |
| Pause | Esc or P |

Touch, landscape: a floating stick on the left half. Flick it to dash. Attack, Jump, Dodge, and Dash sit in an arc under the right thumb. Dash becomes Slide while the stick is down, and Throw in the Assembly gallery. Hold Attack, then let go, for the heavy. The portrait hint asks you to turn the phone; the buttons still work upright. Tap the picture to advance dialogue and to continue after a chapter.

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

`npm test` checks the paintings, the combat rules, the disguise, the chapter clears, and that a runner can cross the rooftops and the train.

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

Scenes and portraits are the painted webps. Each chapter has a far layer, a mid layer, and a tileable ground strip. Sprite frames are the same cut paintings, saved at 273 pixels tall — twice the height they are drawn on the 960×540 canvas, which matches a sharp screen. The title opens as soon as its painting is in. Chapter 1’s layers, ground, portraits, and frames load next, and the later chapters load while you play. The game does not fetch anything except those files.

A few poses were never painted. The game keeps the frames it has and draws the rest in motion:

- A shield is the officer's idle frame with an arc in front of it. A guard pose would help most.
- A rifleman aims with the officer's attack frame, a line, and a bolt. An aim pose would help.
- The inspector is the officer drawn larger. An inspector frame, and the inspector portrait that exists outside this site, would help.
- The heavy blow holds the idle frame for its windup, then the attack frame. A heavy-attack painting would help.
- Azad and Dutt assist without bodies: he slows the room, Dutt's throw staggers the gallery. Full-body paintings would let them stand in the scene.
- Constables only have an attack painting, so they patrol in that pose. A downed constable uses the officer's fallen painting.
- Officers have idle, attack, and down, so they patrol in the idle painting.
- Dodge and slide share the dodge painting.

The bundle also contains a train-compartment painting and portraits of Rajguru, a witness, and Bagh that this action version never shows. Those files are not in the site.
