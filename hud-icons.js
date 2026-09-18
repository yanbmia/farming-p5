// Pixel icons for the HUD buttons, drawn as 12x12 bitmaps and rendered as inline
// SVG so they stay crisp at any size and look the same on every OS (the emoji
// they replaced rendered differently on Mac, Windows and Linux).
//
// To edit an icon, change the rows below: each character is one pixel, '.' is
// transparent, and the other letters map to the palette. Keep every row 12 wide.

(function () {
  const PALETTE = {
    '#': '#3a2415', // outline / wood-dark, same as the UI borders
    'r': '#95030c', // title-sign red
    'w': '#f6e7cd', // parchment
    'l': '#a98a63', // faded ink
    'g': '#4f8a3a', // leaf green
    'y': '#ffd23f', // UI gold
  };

  const ICONS = {
    home: [
      '.....##.....',
      '....#rr#....',
      '...#rrrr#...',
      '..#rrrrrr#..',
      '.#rrrrrrrr#.',
      '#rrrrrrrrrr#',
      '############',
      '.#wwww##ww#.',
      '.#wwww##ww#.',
      '.#wwww##yw#.',
      '.#wwww##ww#.',
      '.##########.',
    ],
    guide: [
      '............',
      '.####..####.',
      '#wwww##wwww#',
      '#wlww##wwlw#',
      '#wwww##wwww#',
      '#wlww##wwlw#',
      '#wwww##wwww#',
      '#wlww##wwlw#',
      '#wwww##wwww#',
      '##ww####ww##',
      '..########..',
      '............',
    ],
    sound: [
      '............',
      '.....#......',
      '....##..#...',
      '...#w#...#..',
      '###ww#.#..#.',
      '#www##..#.#.',
      '#www##..#.#.',
      '#www##..#.#.',
      '###ww#.#..#.',
      '...#w#...#..',
      '....##..#...',
      '.....#......',
    ],
    muted: [
      '............',
      '.....#......',
      '....##......',
      '...#w#......',
      '###ww#..#.#.',
      '#www##...#..',
      '#www##..#.#.',
      '#www##......',
      '###ww#......',
      '...#w#......',
      '....##......',
      '.....#......',
    ],
    settings: [
      '.....##.....',
      '....####....',
      '..##....##..',
      '.##.llll.##.',
      '##..llll..##',
      '##..l..l..##',
      '##..l..l..##',
      '##..llll..##',
      '.##.llll.##.',
      '..##....##..',
      '....####....',
      '.....##.....',
    ],
    map: [
      '############',
      '#www#ww#www#',
      '#www#ww#www#',
      '#wgw#ww#www#',
      '#wgg#gg#www#',
      '#www#gg#gww#',
      '#www#ww#gww#',
      '#www#ww#gww#',
      '#www#ww#www#',
      '#wwr#ww#www#',
      '#www#ww#www#',
      '############',
    ],
    back: [
      '............',
      '....#.......',
      '...##.......',
      '..#w#.......',
      '.#ww########',
      '#wwwwwwwwww#',
      '#wwwwwwwwww#',
      '.#ww########',
      '..#w#.......',
      '...##.......',
      '....#.......',
      '............',
    ],
  };

  function iconSvg(name) {
    const rows = ICONS[name];
    if (!rows) return '';
    const byColor = {};
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.' || !PALETTE[ch]) continue;
        (byColor[ch] = byColor[ch] || []).push(`M${x} ${y}h1v1h-1z`);
      }
    });
    const paths = Object.keys(byColor)
      .map(ch => `<path fill="${PALETTE[ch]}" d="${byColor[ch].join('')}"/>`)
      .join('');
    return `<svg class="px-icon" viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${paths}</svg>`;
  }

  // swap the icon inside a HUD button (used by the mute toggle in sketch.js)
  function setPixelIcon(el, name) {
    if (!el) return;
    const holder = el.querySelector('.px-icon-holder') || el;
    holder.innerHTML = iconSvg(name);
    el.setAttribute('data-icon', name);
  }

  function renderAll() {
    document.querySelectorAll('[data-icon]').forEach(el => setPixelIcon(el, el.getAttribute('data-icon')));
  }

  window.setPixelIcon = setPixelIcon;
  window.pixelIconSvg = iconSvg;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderAll);
  } else {
    renderAll();
  }
})();
