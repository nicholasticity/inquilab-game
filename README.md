# Inquilab

A landscape phone prototype of one Lahore courtyard, in the shape of *Stranger Things: The Game*: 16-bit overhead, tap the ground to walk, tap a portrait to change spy.

Kite throws a pebble, Veil puts on a disguise, and Key picks the east gate. One guard patrols the court. Push the crate onto the brass plate to raise the grate and take the leaflet.

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
