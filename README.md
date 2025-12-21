# Farming P5

**A small farming game inspired by Stardew Valley, built with p5.js.**

---

## About

Farming P5 is a browser-based farming & animal-care game that focuses on simple, relaxing gameplay: grow crops, collect produce, care for animals, and trade at the market. It was built with the p5.js library and is intended as a playful project and learning exercise.

## Features

- Multiple interactable areas: **Home**, **Garden**, **Chicken Coop**, **Cattle Coop**, **Pig Coop**, **Duck Pond**, **Barn**, and **Farmers Market**.
- Animal behaviors (chickens lay eggs, cows produce milk, pigs produce bacon, ducks seek breadcrumbs).
- Garden grid for planting and harvesting crops with growth stages.
- Inventory system saved to your browser's localStorage.
- Drag-and-drop interactions and simple click-based UI navigation.
- Guide overlay and visual feedback for expiring items (eggs, milk).

## How to play

- Open the game (see Running Locally below) and click the start screen.
- Navigate the farm by clicking the onscreen arrows and hotspots in the Home hub.
- Click animals or products (eggs, milk, bacon) to collect them into your inventory.
- In the Garden, right-click to harvest mature crops (harvesting gives a small bonus yield).
- Use the Barn to select stock items and the Farmers Market to select market items for trade.
- Follow the on-screen guide (click the guide icon) for helpful tips.

> Note: All interactions are primarily mouse-driven (click/drag); there are no complex keyboard controls.

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

- `index.html` — main entry file
- `sketch.js` — game logic (p5.js)
- `style.css` — styles
- `p5/` — p5.js library and addons
- `produce/`, `animal/`, `arrows/` — image assets used by the game


## License & Credits

- This project was **inspired by** Stardew Valley; it is an independent fan-like project and **not affiliated** with ConcernedApe.
- Uses the p5.js library — https://p5js.org/
