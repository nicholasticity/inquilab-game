# Credits

The courtyard is built from Liberated Pixel Cup art. Characters are layered from the Universal LPC Spritesheet Character Generator. Tiles and props come from the OpenGameArt LPC walls, floors, windows and doors packs, plus LPC base props (chests, barrels, lamps, the striped awning). Clothing and skin use the generator's own palette ramps: bronze skin, and recolors of the longsleeve, pants, scarf, and headwrap sheets.

The constable's wrapped head uses the generator's male cloth headwrap, recolored cream. The generator does not ship a separate turban sheet. His lathi is the LPC cane.

## Universal LPC Spritesheet Character Generator

Authors of the character layers include the Liberated Pixel Cup contributors listed in that project.

- https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator
- https://sanderfrenken.github.io/Universal-LPC-Spritesheet-Character-Generator/
- License: CC-BY-SA 3.0 and GPL 3.0

Layers used: male and female bodies and heads, eyes, messy / long / parted hair, pants, sandals, longsleeve, vest, Sara tunic, scarf, leather cap, cloth headwrap, and the cane.

## LPC tiles

Full credit lists are copied into `public/assets/lpc/credits/`.

- Walls. bluecarrot16 and the authors named in `credits/walls.txt`. CC-BY-SA 3.0. https://opengameart.org/content/lpc-walls
- Floors. bluecarrot16 and the authors named in `credits/floors.txt`. CC-BY-SA 4.0. https://opengameart.org/content/lpc-floors
- Windows and doors. bluecarrot16, Lanea Zimmerman (Sharm), Daniel Armstrong (HughSpectrum), and the authors named in `credits/windows-doors.txt`. CC-BY-SA 3.0 / GPL 3.0. https://opengameart.org/content/lpc-windows-doors
- LPC base assets (chests, barrels, buckets, kitchen bowl, house awning and door, castle light sources, cabinets). Lanea Zimmerman (Sharm), Daniel Armstrong (HughSpectrum), and other LPC contributors. CC-BY-SA 3.0 / GPL 3.0. https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles

`scripts/bake_lpc.py` composites the character sheets and paints the map. The game loads the baked PNGs in `public/assets/lpc/`.
