# Inquilab

Inquilab: Shadow Raj is a turn-based stealth game. An indigenous rebel cell, commanded by Netaji Subhas Chandra Bose, opens the road for his column. The British Raj falls.

The people you play are invented operatives. Famous revolutionaries are not the player characters. Takedowns are non-lethal: a sentry is laid down where he stood.

## The cell

| Codename | Operative | Home | Specialty |
| --- | --- | --- | --- |
| Kite | Arun Menon | Kozhikode | Scout. Rooftops and vents. Drops a stone from above. |
| Veil | Leela Sen | Dhaka | Disguise. A stolen coat hides her from a patrol, not from an officer's own square. |
| Key | Rajan Pillai | Travancore | Locks. Opens the nearest door, and cuts the lamps when he is clear of one. |

Netaji briefs each mission over the radio. Farid Ansari, codename Wire, is the handler on the line: an older Calcutta man in a waistcoat and round spectacles. Netaji reacts to what you chose last time, and he leads the column in the finale. Trust and the shape of the victory follow those choices. The Raj falls in every ending.

## How a mission plays

The whole room is on screen. You take one step, a wait, or an ability. The sentries move after you. Their cones are painted on the floor and stop at walls and locked doors. A gold cone is a patrol. An amber cone is a sentry who heard something or is searching. Stepping into a cone, or onto a sentry from the front, is a catch: he shows `?`, then `!`, and the room starts again. There is no firefight and no continue button.

Step onto a sentry from the side or from behind and he is laid down. A body in another sentry's cone makes that sentry suspicious. A basket hides you from a patrol. Kite can drop a stone on a gleaming pot or bell, once every three turns, and a patrol will walk toward the sound. Veil spends a turn to put the coat on or take it off.

The rank runs from S to C. Catches, a slow route, a missed note, and a body left in a cone each cost a grade. A cleared mission shows a headline. The next briefing remembers the choice. After the arms train, a short epilogue names the four doors still on the road.

## Missions

1. **The Lahore roofs.** Kite. The vents run above the bazaar. Take the troop plans. Save the courier, or leave with the plans. The street is the loud way. The roof is the quiet one.
2. **The arms train.** Veil. A trench under the yard, or the lit platform in a stolen coat. Sabotage the train, or hijack it for the cells. Saving the courier thins the watch. Taking only the plans thickens it.
3. **The press.** Key. A dark passage around a lit hall. Carry the press, the forged passes, or both. A sabotage on the train removes a searcher. With no lock in reach, his hands cut the lamps.
4. **The assembly.** Veil, again. The gallery is dark. The floor is bright. Swap the file, or read the declaration aloud. Carrying both from the workshop adds a patrol.
5. **The lock.** Key. Open the west cell and walk the leaders out. Spare the turncoat warder, or lock him in.
6. **The Viceroy's house.** Kite again. The roof, the lamp room, then the gate. Wait for Netaji's column, or light the signal early. Sparing the warder takes an officer off the court.

Missions 1 and 2 are playable. Missions 3 to 6 are listed, and they are not enterable yet. After mission 2 the epilogue says so.

## Controls

The phone is the way the game is played, in landscape. A portrait phone shows "Rotate your phone."

Swipe anywhere to step. Tap a neighbouring tile, tap yourself or Wait, or tap a gleaming stone or the Coat button. Up to three swipes can queue. Pause offers Resume, Retry room, Mission select, and Mute. There is no stick and no cluster of action buttons.

On a keyboard, the arrows and WASD step, Space waits, E or F uses the ability, Enter advances the radio, and Escape pauses. Those keys are not printed on the title.

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

`npm test` checks the cones, a subdue, a frontal catch, the disguise, the layout, the stride, and quiet clears of mission 1 and mission 2.

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

The title painting and the codec portraits stay on those screens. Everything on the board — floors, walls, pits, lamps, pots, vents, doors, and the people — is drawn by one painter: one palette, light from the upper left, the same ink outline. Cones, the gleam on a stone, and the HUD use that palette and sit on top of the board. The play portrait is a bust of the same figurine, not a painted face.
