# Inquilab

Inquilab: Shadow Raj is a top-down stealth game. An indigenous rebel cell, commanded by Netaji Subhas Chandra Bose, opens the road for his column. The British Raj falls.

The people you play are invented operatives. Famous revolutionaries are not the player characters. Takedowns are non-lethal: a sentry is laid down, dragged, and hidden.

## The cell

| Codename | Operative | Home | Specialty |
| --- | --- | --- | --- |
| Kite | Arun Menon | Kozhikode | Scout. Rooftops and vents. Drops a stone from above. |
| Veil | Leela Sen | Dhaka | Disguise. A stolen uniform holds until you sprint. |
| Key | Rajan Pillai | Travancore | Locks. Opens the nearest door, and cuts the lamps when he is clear of one. |

Netaji briefs each mission over the radio. Farid Ansari, codename Wire, is the handler on the line: an older Calcutta man in a waistcoat and round spectacles. Netaji reacts to what you chose last time, and he leads the column in the finale. Trust and the shape of the victory follow those choices. The Raj falls in every ending.

## How a mission plays

The view is overhead, a little above the floor, and the camera follows you with a short look ahead. Maps are larger than the screen.

Sentries walk a route. Their cones are drawn on the floor and stop at walls and crates. A lamp lengthens a cone. Darkness, a crouch, and tall grass shorten it. States run from a patrol, to a suspicious `?`, to an alert `!`, to a search, and back to the route. An alert whistles to nearby sentries.

A light push on the stick sneaks. A full push runs, and running is loud. Crouch is quieter still. Hug a wall to stay in its cover, and push into it to peek. Action is contextual: subdue from behind, drag a body, hide in a basket or a crowd, turn a lock, knock, or put on a coat. Throw a pebble, and drag the button to aim it. Each spy's ability button is the trick in the table above.

If you are seen, a short alert phase starts. Break the line of sight and hide until it clears, or be caught and return to the checkpoint. There is no firefight.

Being unseen, sparing sentries, collecting notes, and the clock set the rank from S to C. A cleared mission shows a radio headline and the rebellion's strength. The next briefing remembers the choice.

## Missions

1. **The Lahore roofs.** Kite. The vents run above the bazaar. Take the troop plans. Save the courier, or leave with the plans. The street is the loud way. The roof is the quiet one.
2. **The arms train.** Veil. A trench under the yard, or the lit platform in a stolen coat. Sabotage the train, or hijack it for the cells. Saving the courier thins the watch. Taking only the plans thickens it.
3. **The press.** Key. A dark passage around a lit hall. Carry the press, the forged passes, or both. A sabotage on the train removes a searcher. With no lock in reach, his hands cut the lamps.
4. **The assembly.** Veil, again. The gallery is dark. The floor is bright. Swap the file, or read the declaration aloud. Carrying both from the workshop adds a patrol.
5. **The lock.** Key. Open the west cell and walk the leaders out. Spare the turncoat warder, or lock him in.
6. **The Viceroy's house.** Kite again. The roof, the lamp room, then the gate. Wait for Netaji's column, or light the signal early. Sparing the warder takes an officer off the court.

The epilogue is the column coming through the gate. How the republic starts depends on who you spared, what you stole, and how loud the cell became.

## Controls

Desktop:

| Action | Keys |
| --- | --- |
| Move | WASD or arrow keys. Shift runs. |
| Crouch | C |
| Action | E |
| Throw | Q, in the direction you face |
| Ability | F |
| Choose | 1, 2, or 3 |
| Advance the radio, continue | Enter or Space |
| Missions | P, or 1–6 once a mission is unlocked |
| Pause | Esc or P |

Phone, landscape: the game asks to launch in landscape and shows a rotate card if the phone is upright. A stick sits on the left. A light push sneaks and a full push runs. On the right, a large Action button, then Ability, Throw, and Crouch along the arc. Drag Throw to aim. The portrait is the spy you are playing. The bar under it is the alert. The circle at the top right is the radar. Pause has size, opacity, and left-hand layout, remembered on the device.

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

`npm test` checks the paintings, vision and walls, grass, noise, a subdue, Veil's coat, Key's lamps, Key's lock, the choices that carry, and a clear of all six missions.

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

The title and the finale still use the painted cards. Codec portraits are the painted busts of Netaji, Wire, and the three spies, loaded with the mission that needs them. The title waits only on its painting.

Floors, props, and directional figures are the painted top-down pack. A floor is sampled in world space with a row shift, a tint, and a scuff so the repeat does not read as a grid. Lamps, distance, and a vignette darken what the operative cannot stand in. Vision cones stay drawn on the floor. Bars, sandbags, and the guard post sit on walls and edges. Walk frames exist for facing down. Up and side walks bob, squash, and sway the idle frame. The sari is never mirrored. The camera is zoomed so the figures read on a phone.
