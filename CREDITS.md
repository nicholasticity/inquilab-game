# Credits

The courtyard is built on one 48-colour palette. Characters are layered from the Universal LPC Spritesheet Character Generator and recolored onto that palette, including the skin ramp, so they sit in the same light as the court. The walls and the props are LPC sprites cropped at their native pixel size, recolored onto that same palette in `scripts/kitbash.py`, and edited where a Lahore prop did not exist on the sheet. Nothing in the court is drawn at one size and scaled up in the game.

Kite wears a cream kurta, brown waistcoat, and pyjama, with a small Gandhi cap drawn on the hair. Veil wears the Sara tunic and a saffron dupatta (the thin cloth headwrap plus the scarf). Her disguise is the tan tunic with the dupatta off. Key wears a cream kurta and a navy waistcoat. The constable's pagri is the cloth headwrap recolored red, with a short plume, khaki uniform, and the LPC cane as a lathi. The officer is the same khaki body with a pith helmet and red sash drawn on every walk frame.

## What came from which sheet

Full credit lists are copied into `public/assets/lpc/credits/`.

- **Walls.** The running bond is the grey stone course in [LPC] Walls (`walls.png`, tile rows 29–31), recolored to brick and sandstone. The parapet is that cap course. The cornice soffit and the foundation joints are drawn on top of it. bluecarrot16, Lanea Zimmerman (Sharm), Daniel Armstrong (HughSpectrum), and the authors in `credits/walls.txt`. CC-BY-SA 3.0 / CC-BY-SA 4.0 / GPL 3.0. https://opengameart.org/content/lpc-walls
- **Windows and doors.** The diamond jaali and the paneled gate are crops from LPC Windows & Doors. bluecarrot16, Lanea Zimmerman (Sharm), Daniel Armstrong (HughSpectrum), Casper Nilsson, Anamaris, Krusmira, Keith Karnage, Guido Bos, Talosaurus. CC-BY-SA 3.0 / GPL 3.0+. https://opengameart.org/content/lpc-windows-doors
- **Containers.** The clay matka, the kulhad, and the wooden crate are crops from [LPC] Containers v4.2. bluecarrot16, Lanea Zimmerman (Sharm), William Thompson, Tuomo Untinen (Reemax), Evert, Buch, Blarumyrran, n2liquid, Jetrel, Guido Bos, Hyptosis, Bonsaiheldin, NaRNeRZz, PriorBlue, Jerom, 7Soul, Wolthera van Hövell tot Westerflier (TheraHedwig). CC-BY-SA 4.0, plus the licenses named in `credits/containers.txt`. https://opengameart.org/content/lpc-containers
- **Medieval village decorations.** The stall awning and plank counter, the laundry line, the handcart, and the hanging lanterns are crops from [LPC] Medieval Village Decorations. Authors are listed in `credits/decorations.txt`. CC-BY-SA 3.0 / CC-BY-SA 4.0 / GPL 3.0. https://opengameart.org/content/lpc-medieval-village-decorations
- **Tavern.** The iron degchi on the stall is the cauldron from [LPC] Tavern. bluecarrot16, Lanea Zimmerman (Sharm), William.Thompsonj, Jetrel, DCSS Contributors, Reemax, Hyptosis, Daniel Eddeland (Daneeklu), BenCreating, Evert, tapatilorenzo. CC-BY-SA 3.0. https://opengameart.org/content/lpc-tavern
- **Food.** The fruit on the handcart is from [LPC] Foods. bluecarrot16, Daniel Eddeland (daneeklu), Joshua Taylor, Richard Kettering (Jetrel), thekingphoenix, RedVoxel, Molly "Cougarmint" Willits. CC-BY-SA 3.0+ / GPL 3.0+. https://opengameart.org/content/lpc-food
- **Birds.** The pigeons are the brown side-view walk from [LPC] Birds (`bird_2_brown_1.png`). bluecarrot16, commissioned by castelonia. CC-BY 4.0 / CC-BY 3.0 / CC-BY-SA 4.0 / CC-BY-SA 3.0 / GPL 3.0 / GPL 2.0 / OGA-BY 3.0. https://opengameart.org/content/lpc-birds

## Drawn to fill gaps

These are original pixels at the same size and shade count as the LPC crops, because the sheets had no matching Lahore prop: the round terracotta matkas, the squat jute bori, the hanging shop bell, the stone well with its pulley and bucket, the single-awning chai stall and its counter-top pot, the wooden thela, the grey rock pigeons, the kurta, dupatta and dhoti on the line, the brass chai kettle, the brass lota, the stack of clay pots, the tethered goat, the potted plants, the broom, the upright bicycle and its kickstand, the round pressure plate, the diya flame, the tulsi leaves, the steam wisps, the pebble, the leaflet, the jharokha's cusped arch and brackets (the jaali inside it is the LPC lattice), the pigeon ledge, the cornice soffit, the pillar, the lamplight pools, and the contact shadow. The LPC bird, container, tavern cauldron, and medieval handcart crops are not used for those props. The flagstones, the kolam, the dhurrie, the curfew notice, the Azad Hind poster, the "CHALO DILLI" graffiti, the iron grate, its rune, the charpoy, and the letterpress are the same original drawings as the previous court. The poster is an original tricolour and tiger, not a copy of a historical painting or photograph. The notice reads "BY ORDER OF THE GOVERNOR / CURFEW". The officer's pith helmet and red sash are drawn onto the khaki LPC walk.

## Universal LPC Spritesheet Character Generator

Authors of the character layers include the Liberated Pixel Cup contributors listed in that project.

- https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator
- https://sanderfrenken.github.io/Universal-LPC-Spritesheet-Character-Generator/
- License: CC-BY-SA 3.0 and GPL 3.0

Layers used: male and female bodies and heads, eyes, messy / long / parted hair, pants, sandals, basic shoes, longsleeve, vest, Sara tunic, scarf, the thin cloth headwrap, the male cloth headwrap, and the cane.

`scripts/bake_lpc.py` composites the character sheets and paints the map. The game loads the baked PNGs in `public/assets/lpc/`.
