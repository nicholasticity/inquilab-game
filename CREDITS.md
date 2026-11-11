# Credits

The courtyard is built on one 48-colour palette. Characters are layered from the Universal LPC Spritesheet Character Generator and recolored onto that palette, including the skin ramp, so they sit in the same light as the court. The walls, flagstones, and every prop are original pixel drawings in `scripts/craft.py`: running-bond brick with a sandstone parapet and plinth, flagstone slabs, a chai stall, clay matkas, jute sacks, brass lanterns, a thela, a well, a jharokha, and a carved door. The LPC wall and floor sheets are no longer baked into the map.

Kite wears a cream kurta, brown waistcoat, and pyjama, with a small Gandhi cap drawn on the hair. Veil wears the Sara tunic and a saffron dupatta (the thin cloth headwrap plus the scarf). Her disguise is the tan tunic with the dupatta off. Key wears a cream kurta and a navy waistcoat. The constable's pagri is the cloth headwrap recolored red, with a short plume, khaki uniform, and the LPC cane as a lathi. The officer is the same khaki body with a pith helmet and red sash drawn on every walk frame.

Original pixel props, drawn in `scripts/bake_lpc.py` at the same resolution as the LPC tiles, are the pressure plate and its rune, the iron grate bars, the pebble, the stone well, the charpoy, the leaning bicycle, the thela handcart, the chai stall (canopy, angithi, kettle, kulhads, bench), the clay matka, the jute sack, the tulsi pot, the brass lantern, diya, and bell, the carved door, the wooden trunk, the letterpress, the laundry, the jaali, the jharokha balcony, the pillar, the curfew notice, and the Azad Hind poster. The poster is an original tricolour and tiger, not a copy of a historical painting or photograph. The notice reads "BY ORDER OF THE GOVERNOR / CURFEW". The wall graffiti reads "CHALO DILLI". The officer's pith helmet and red sash are drawn onto the khaki LPC walk.

## Universal LPC Spritesheet Character Generator

Authors of the character layers include the Liberated Pixel Cup contributors listed in that project.

- https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator
- https://sanderfrenken.github.io/Universal-LPC-Spritesheet-Character-Generator/
- License: CC-BY-SA 3.0 and GPL 3.0

Layers used: male and female bodies and heads, eyes, messy / long / parted hair, pants, sandals, basic shoes, longsleeve, vest, Sara tunic, scarf, the thin cloth headwrap, the male cloth headwrap, and the cane.

## LPC tiles

Full credit lists are copied into `public/assets/lpc/credits/`.

- Walls, floors, windows, and doors from the LPC packs were the previous court's source. This build paints its own brick, flagstone, and wood. The credit files in `credits/` remain for that earlier derivation. bluecarrot16, Lanea Zimmerman (Sharm), Daniel Armstrong (HughSpectrum), and the authors named there. CC-BY-SA 3.0 / CC-BY-SA 4.0 / GPL 3.0. https://opengameart.org/content/lpc-walls https://opengameart.org/content/lpc-floors https://opengameart.org/content/lpc-windows-doors
- LPC base assets. Lanea Zimmerman (Sharm), Daniel Armstrong (HughSpectrum), and other LPC contributors. CC-BY-SA 3.0 / GPL 3.0. https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles The baked court does not use the chest, barrel, lamp, or awning sprites from that pack. The trunk, stall, lanterns, and door are original.

`scripts/bake_lpc.py` composites the character sheets and paints the map. The game loads the baked PNGs in `public/assets/lpc/`.
