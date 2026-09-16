# Farming P5

**A small farming game inspired by Stardew Valley, built with p5.js.**

> Play it here: [https://yanbmia.github.io/farming-p5/](https://yanbmia.github.io/farming-p5/)


## Features

- Multiple interactable areas: **Home**, **Garden**, **Chicken Coop**, **Cattle Coop**, **Pig Coop**, **Duck Pond**, **Barn**, and **Farmers Market**.
- Animal behaviors (chickens lay eggs, cows produce milk, pigs produce bacon, ducks seek breadcrumbs).
- Garden grid for planting and harvesting crops with growth stages.
- Inventory system saved to your browser's localStorage.
- Drag-and-drop interactions and simple click-based UI navigation.
- Guide overlay and visual feedback for expiring items (eggs, milk).

## How to play

- Open the game (see Running Locally below) and click the start screen.
- Walk with the arrow keys; the mouse does everything else (click a crop, an egg, an animal, or a hub entrance).
- Click a seed in the satchel to select it, then click an empty plot in the Garden to plant. Click again to water.
- Use the Barn to craft and the Farmers Market to buy and sell: click an item, then drag ingredients from the satchel into the slots.
- `Space` uses whatever is nearest, `Esc` steps back out of a hub or closes an overlay, `M` opens the farm map.
- The signpost on the left holds Home, Guide, Map and Sound; the controls plank under the screen is a quick reference.

## Running locally

Recommended: serve the project with a local static server so assets load correctly.

- Using Python 3 built-in server:

  ```bash
  cd path/to/farming-p5
  python3 -m http.server 8000
  # then open http://localhost:8000 in your browser
  ```

- Or simply open `index.html` directly in a browser (may be subject to some browser security restrictions depending on your environment).

## Project structure

- `index.html` — main entry file (the page is laid out as a barn front: signpost menu, roof + title sign, screen, satchel)
- `sketch.js` — game logic (p5.js)
- `style.css` — styles
- `hud-icons.js` — 12x12 pixel bitmaps for the menu icons, rendered as inline SVG
- `fonts/` — Pixelify Sans (SIL OFL), bundled so the page works offline
- `p5/` — p5.js library and addons
- `produce/`, `animal/`, `arrows/` — image assets used by the game


## License & Credits

- This project was **inspired by** Stardew Valley.
- Uses the p5.js library — https://p5js.org/
