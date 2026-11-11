# Inquilab

A landscape phone prototype of one Lahore courtyard, in the shape of *Stranger Things: The Game*: 16-bit overhead, tap the ground to walk, tap a portrait to change spy.

Kite throws a pebble, Veil puts on a disguise, and Key picks the east gate. One guard patrols the court. Push the crate onto the glowing plate to raise the grate and take the leaflet.

The art is Liberated Pixel Cup: 32px tiles and 64px, 9-frame character sheets, baked by `scripts/bake_lpc.py`. See `CREDITS.md`. The game draws at 640×360 and letterboxes that 1:1 into an 844×390 phone, so a character stays about the height of a Stranger Things sprite.

## Run

Node 20 or newer.

```bash
npm ci
npm run dev
```

The dev server listens on port 5173. `npm run build` writes `dist/`. `npm test` typechecks.

Play it in landscape. A portrait phone shows “Rotate your phone”. WASD is a desktop debug aid and is not drawn on screen.

## Deploy

Static site. `render.yaml` builds with `npm ci && npm run build`, publishes `dist/`, and sends `Cache-Control: no-cache` for `index.html`. Hashed files live under `dist/static/`.
