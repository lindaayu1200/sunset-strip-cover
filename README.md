# Sunset Strip — Vice cover art from your own photos

Turn your photos and a caption into multi-panel GTA-style poster covers, graded in sunset and neon tones, and export a PNG at 1080x1080, 1080x1350 or 1920x1080. Static files, no build step, no network.

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/lindaayu1200/sunset-strip-cover/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard)
[![reward](https://make.fun/badge/gta6-cover-art-01/lindaayu1200/sunset-strip-cover/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Built for the [make.fun GTA 6 cover art bounty](https://make.fun/bounty/gta6-cover-art-01).

## Features

- Five panel layouts: four-up grid, spotlight, three-strip, cinema and duo.
- Five colour grades with atmosphere and palm silhouettes.
- Bold lettering in slab, chrome, neon and stencil styles, four inks.
- Decorative panel frames, band textures and a poster badge, all drawn on canvas.
- Drag and zoom each photo inside its panel; one photo can fill every panel.
- Sample photos included, drawn for this project and free to use.
- Exports PNG at 1080x1080, 1080x1350 and 1920x1080, at full render size.

## How to use

node serve.ts

Open http://localhost:8080, add your photos, edit the title, subtitle and kicker, pick a layout, grade and lettering style, then press Export PNG.

## Hand-in

mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

## Requirements

Node.js 22.18 or later for main.ts and serve.ts; any current desktop browser.

## License

MIT