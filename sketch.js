let farmBg;
let chickenCoopBg;
let gardenBg;
let barn;
let home;
let startpage;
let chicken1, chicken2, eggImg;
let duck1, duck2;
let leftArrow, rightArrow, backArrow;
let guideIcon, guideImg;
let leftExtendBg, rightExtendBg;
let cattleCoopBg;
let duckPondBg;
let farmersMarketBg;
let pigCoopBg;
let cowImg, breadImg, milkImg, pigImg, baconImg, pieImg, cheeseImg, sandwichImg, appleJamImg, carrotCakeImg;

// note: the back arrow is now drawn in code - see drawBackButton() / getBackButtonRect()
let currentWorld = 'start'; // start, home, chickenCoop, barn, garden, leftExtend, rightExtend, cattleCoop, duckPond, farmersMarket, pigCoop
let previousWorld = null; // track previous world for back navigation

// human-readable zone names shown on the scrapbook-style zone label flag
// (see drawZoneLabel()) - lets the player tell at a glance where they are
const worldLabels = {
  home: 'Home',
  leftExtend: 'Farm West',
  rightExtend: 'Farm East',
  chickenCoop: 'Chicken Coop',
  cattleCoop: 'Cattle Coop',
  pigCoop: 'Pig Coop',
  duckPond: 'Duck Pond',
  garden: 'Garden',
  barn: 'Barn',
  farmersMarket: 'Farmers Market',
};

let chickens = [];
let eggs = [];
let ducks = [];
let breadCrumbs = [];
let cows = [];
let milks = [];
let pigs = [];
let bacons = [];

let produceImgs = [];
const producePaths = [
  'produce/apple.png', 'produce/carrot.png',
  'produce/corn.png', 'produce/grape.png', 
  'produce/lemon.png', 'produce/peach.png',
  'produce/pepper.png', 'produce/pumpkin.png',
  'produce/radish.png', 'produce/strawberry.png',
  'produce/wheat.png'
];
while (producePaths.length < 64) {
  producePaths.push(producePaths[producePaths.length % producePaths.length]);
}

// track which grid cells have crops (null = empty)
let gardenGrid = Array(6).fill().map(() => Array(8).fill(null));

// inventory tracker
let inventory = {
  wheat: 50,
  corn: 0,
  carrot: 0,
  radish: 0,
  apple: 0,
  strawberry: 0,
  pepper: 0,
  lemon: 0,
  peach: 0,
  grape: 0,
  pumpkin: 0,
  egg: 50,
  bread: 0,
  milk: 0,
  bacon: 0,
  pie: 0,
  cheese: 0,
  sandwich: 0,
  applejam: 0,
  carrotcake: 0,
};

// the shape and starting counts a brand new farm begins with - captured before
// anything mutates `inventory`, so startNewFarm() has something to restore to
const DEFAULT_INVENTORY = Object.assign({}, inventory);

// items available in the barn stock
const barnItems = [
  'wheat', 'corn', 'carrot', 'radish', 'apple',
  'strawberry', 'pepper', 'lemon', 'peach', 'grape', 'pumpkin'
];

let selectedStockItem = null;
// drop zone in barn
const tradeRect = { x: 500, y: 200, w: 250, h: 220 };

// farmers market items and trade zone
const marketItems = ['bread', 'cow', 'cheese', 'pig', 'pie', 'sandwich', 'applejam', 'carrotcake'];
let selectedMarketItem = null;
const marketTradeRect = { x: 500, y: 200, w: 250, h: 220 };

// drag and drop variables (used for duck pond feeding, and for dragging ingredients
// into barn/market trade slots - see tryFillIngredientSlot(). Garden planting is
// click/space-based instead, see selectedSeed/plantSeedAt())
let isDragging = false;
let draggedItem = null;
let draggedElement = null;

// planting: click a seed in the inventory to select it, then walk over to the garden
// and click an empty cell to plant (space plants the cell you are standing on)
let selectedSeed = null;

// guide overlay
let showGuide = false;

// coins: earned by selling at the market, spent to buy barn/market items outright.
// Kept alongside `inventory` rather than inside it - it isn't an item and shouldn't
// get an inventory slot. Persisted with the rest of the save, see saveInventory().
let coins = 0;
let marketMode = 'buy';  // farmers market panel: 'buy' (trade slots) or 'sell'
let lastSale = null;     // { text, at } - brief confirmation under the trade box

// player character (arrow-key controlled)
let player;
const INTERACT_RANGE = 45; // how close player must be to harvest/collect

// walkable bounds per world (keeps player on the path/grass, off menus).
// barn and farmersMarket are intentionally excluded - they're mouse-click-only
// trading screens with no player character or movement.
const worldBounds = {
  home:          { minX: 60,  maxX: 740, minY: 140, maxY: 600 },
  leftExtend:    { minX: 60,  maxX: 700, minY: 140, maxY: 600 },
  rightExtend:   { minX: 130, maxX: 740, minY: 140, maxY: 600 },
  chickenCoop:   { minX: 100, maxX: 700, minY: 140, maxY: 600 },
  cattleCoop:    { minX: 100, maxX: 700, minY: 140, maxY: 600 },
  pigCoop:       { minX: 100, maxX: 700, minY: 140, maxY: 600 },
  duckPond:      { minX: 100, maxX: 700, minY: 140, maxY: 600 },
  garden:        { minX: 195, maxX: 605, minY: 150, maxY: 480 },
};

// walking past these x-thresholds triggers a world change (replaces arrow-click nav)
// entryX/entryY = where the player appears when they land in the destination world
const edgeTransitions = {
  home:        [
    { side: 'left',  threshold: 60,  destination: 'leftExtend',  entryX: 690, entryY: null },
    { side: 'right', threshold: 740, destination: 'rightExtend', entryX: 140, entryY: null },
  ],
  leftExtend:  [
    { side: 'right', threshold: 700, destination: 'home', entryX: 70, entryY: null },
  ],
  rightExtend: [
    { side: 'left',  threshold: 130, destination: 'home', entryX: 730, entryY: null },
  ],
};

// hub zones (sub-world entrances) act as fences the player walks around, not through.
// entry requires standing within PERIMETER_RANGE of the zone's edge, then clicking the
// zone (or pressing space) - see isBlockedByFence(), findNearbyHubZone(),
// findTargetAtPoint(), and performInteraction().
const hubZones = {
  home: [
    { quad: [100, 135, 300, 135, 300, 340, 100, 340], destination: 'chickenCoop', label: 'Chicken Coop' },
    { quad: [255, 430, 565, 430, 565, 600, 255, 600], destination: 'garden', label: 'Garden' },
    // traced from farm.png: the roof's left edge runs x=315 (y~135) to x=328 (y~225),
    // the right eave is flat at x=548 down to y~218, and the walls sit at x 328..534
    // with their base at y~288. The old quad was a trapezoid over the roof, ~50px
    // right of the building and stopping above the doors.
    { quad: [315, 135, 548, 135, 540, 288, 328, 288], destination: 'barn', label: 'Barn' },
  ],
  leftExtend: [
    { quad: [175, 165, 400, 12, 680, 170, 460, 300],  destination: 'cattleCoop', label: 'Cattle Coop' },
    { quad: [35, 340, 120, 270, 250, 355, 155, 430],  destination: 'duckPond', label: 'Duck Pond' },
    { quad: [230, 420, 560, 420, 560, 615, 230, 615], destination: 'farmersMarket', label: "Farmers Market" },
  ],
  rightExtend: [
    { quad: [100, 410, 330, 410, 330, 605, 100, 605], destination: 'pigCoop', label: 'Pig Coop' },
  ],
};

// brief cooldown after any world change so the player can't instantly bounce back
let worldChangeCooldown = 0;

// Player class
//
// Drawn procedurally rather than from a sprite sheet, so the "walk cycle" is a set
// of transforms driven by two bits of state: walkPhase (where we are in the stride)
// and stride (how much of the walk animation is faded in, 0..1). Both are updated in
// updateAnimation(), which handleMovement() calls every frame - so the character
// eases into walking and settles back to idle instead of snapping between the two.
const WALK_CYCLE_SPEED = 0.22;  // radians of stride per frame while moving
const STRIDE_FADE_IN   = 0.18;  // how fast the walk animation ramps up
const STRIDE_FADE_OUT  = 0.22;  // ...and eases back out when the keys are released
const POP_DURATION     = 14;    // frames of the "pop" after a successful interaction

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 36;
    this.speed = 3;
    this.facing = 'down'; // down, up, left, right

    // animation state
    this.dx = 0;          // last frame's input direction, used for the walking lean
    this.dy = 0;
    this.isMoving = false;
    this.walkPhase = 0;   // position in the stride (radians)
    this.stride = 0;      // 0 = fully idle, 1 = fully walking
    this.popTimer = 0;    // counts down after a successful interaction
  }

  handleMovement() {
    const bounds = worldBounds[currentWorld];
    if (!bounds) {
      // no walkable world (barn/market): hold still but keep the animation settling
      this.isMoving = false;
      this.updateAnimation();
      return;
    }

    let dx = 0, dy = 0;
    if (keyIsDown(LEFT_ARROW)) { dx -= 1; this.facing = 'left'; }
    if (keyIsDown(RIGHT_ARROW)) { dx += 1; this.facing = 'right'; }
    if (keyIsDown(UP_ARROW)) { dy -= 1; this.facing = 'up'; }
    if (keyIsDown(DOWN_ARROW)) { dy += 1; this.facing = 'down'; }

    if (dx !== 0 && dy !== 0) {
      // normalize diagonal movement
      dx *= 0.7071;
      dy *= 0.7071;
    }

    const moveX = dx * this.speed;
    const moveY = dy * this.speed;

    // try moving on each axis independently (against the player's ORIGINAL position
    // on the other axis) so the player slides along a fence instead of getting stuck
    // when approaching it diagonally
    const triedX = constrain(this.x + moveX, bounds.minX, bounds.maxX);
    const triedY = constrain(this.y + moveY, bounds.minY, bounds.maxY);

    const newX = isBlockedByFence(triedX, this.y) ? this.x : triedX;
    const newY = isBlockedByFence(this.x, triedY) ? this.y : triedY;

    tutorialWalked += dist(this.x, this.y, newX, newY); // for the tutorial's first step

    this.x = newX;
    this.y = newY;

    this.dx = dx;
    this.dy = dy;
    this.isMoving = (dx !== 0 || dy !== 0);
    this.updateAnimation();
  }

  // advance the walk cycle and tick down the interaction pop
  updateAnimation() {
    if (this.isMoving) {
      this.walkPhase = (this.walkPhase + WALK_CYCLE_SPEED) % TWO_PI;
      this.stride = min(1, this.stride + STRIDE_FADE_IN);
    } else {
      this.stride = max(0, this.stride - STRIDE_FADE_OUT);
      if (this.stride === 0) {
        this.walkPhase = 0; // reset to a neutral pose once fully settled
        this.dx = 0;
        this.dy = 0;
      }
    }

    if (this.popTimer > 0) this.popTimer--;
  }

  // brief scale-up, triggered by performInteraction() on a successful action
  triggerPop() {
    this.popTimer = POP_DURATION;
  }

  draw() {
    const b = sin(this.walkPhase);        // -1..1 across one stride
    const swing = b * this.stride;        // limb swing, faded by stride
    const plant = (1 - abs(b)) * this.stride; // 1 at foot-plant, 0 mid-stride

    // bob: the body rises between footfalls and drops as a foot lands
    const bob = -abs(b) * 4.5 * this.stride;

    // pop: snaps to full size on the frame of the action, then eases back
    const popT = this.popTimer / POP_DURATION;
    const popEase = pow(popT, 1.6);
    const popScale = 1 + 0.38 * popEase;
    const popLift = -6 * popEase;

    // idle breathing so standing still doesn't look frozen
    const breathe = this.stride === 0 ? sin(frameCount * 0.05) * 0.02 : 0;

    push();
    translate(this.x, this.y);

    // shadow stays on the ground and shrinks as the body lifts off it
    const lift = constrain((abs(bob) + abs(popLift)) / 10, 0, 1);
    noStroke();
    fill(0, 0, 0, 60);
    ellipse(0, this.size * 0.42,
            this.size * 0.7 * (1 - 0.18 * lift),
            this.size * 0.25 * (1 - 0.18 * lift));

    translate(0, bob + popLift);
    rotate(radians(this.dx * 5 * this.stride)); // lean into the direction of travel
    scale(popScale);
    // squash on the down-beat, stretch on the up-beat
    scale(1 + 0.12 * plant + breathe, 1 - 0.12 * plant - breathe);

    drawFarmerSprite(this.facing, swing, this.stride);

    pop();
  }
}

// ---------------------------------------------------------------------------
// THE FARMER
//
// A code-drawn pixel sprite: 12 columns wide, PX pixels per cell, so it matches
// the chunky look of the HUD icons. The body is a bitmap per facing (left is the
// right-facing sheet mirrored); the legs are drawn separately so the existing
// walk cycle (swing) can animate them without needing extra frames. To swap in
// real art later, replace drawFarmerSprite() with an image() call - everything
// that drives it (facing, swing, stride) stays the same.
// ---------------------------------------------------------------------------

const FARMER_PX = 3; // on-screen pixels per bitmap cell -> sprite is 36 wide, 48 tall

const FARMER_PALETTE = {
  '#': [58, 36, 21],     // outline, same brown-black as the UI
  's': [224, 179, 86],   // straw hat
  'S': [190, 140, 60],   // hat band / shadow
  'k': [241, 201, 165],  // skin
  'h': [107, 74, 42],    // hair
  'y': [235, 170, 60],   // shirt (the old body colour, so the palette stays)
  'b': [63, 127, 196],   // overalls
  'B': [48, 100, 160],   // overalls shadow
};

// rows 0-12 of each facing: hat, face, shirt, overalls. Legs are rows 13-15 and
// are drawn procedurally in drawFarmerSprite().
const FARMER_BODY = {
  down: [
    '....####....',
    '...#ssss#...',
    '...#ssss#...',
    '.###SSSS###.',
    '#ssssssssss#',
    '.##kkkkkk##.',
    '..#k#kk#k#..',
    '..#kkkkkk#..',
    '...#kkkk#...',
    '..#yyyyyy#..',
    '.#y#bbbb#y#.',
    '.#k#bBBb#k#.',
    '...#bbbb#...',
  ],
  up: [
    '....####....',
    '...#ssss#...',
    '...#ssss#...',
    '.###SSSS###.',
    '#ssssssssss#',
    '.##hhhhhh##.',
    '..#hhhhhh#..',
    '..#hhhhhh#..',
    '...#hhhh#...',
    '..#yyyyyy#..',
    '.#y#bbbb#y#.',
    '.#k#bBBb#k#.',
    '...#bbbb#...',
  ],
  right: [
    '....####....',
    '...#ssss#...',
    '...#ssss#...',
    '.###SSSS###.',
    '#ssssssssss#',
    '..##kkkkk#..',
    '...#hkk#k#..',
    '...#kkkkk#..',
    '....#kkk#...',
    '...#yyyy#...',
    '...#bbb#y#..',
    '...#bBb#k#..',
    '....#bbb#...',
  ],
};

function farmerFill(ch) {
  const c = FARMER_PALETTE[ch];
  if (c) fill(c[0], c[1], c[2]);
}

// draws the sprite centred on (0, 0): rows 0-15 span -30..+18 at FARMER_PX = 3,
// so the feet sit on the ground shadow the Player draws at size * 0.42
function drawFarmerSprite(facing, swing, stride) {
  const px = FARMER_PX;
  const cols = 12, rows = 16;
  const originX = -cols * px / 2;
  const originY = -rows * px / 2 - 6;
  const mirrored = facing === 'left';
  const sheet = FARMER_BODY[mirrored ? 'right' : facing] || FARMER_BODY.down;

  push();
  noStroke();
  rectMode(CORNER);
  if (mirrored) scale(-1, 1);

  // body rows
  for (let y = 0; y < sheet.length; y++) {
    const row = sheet[y];
    for (let x = 0; x < cols; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      farmerFill(ch);
      // a hair of overlap hides the anti-aliased seams between cells while the
      // body is rotated or squashed by the walk animation
      rect(originX + x * px, originY + y * px, px + 0.6, px + 0.6);
    }
  }

  // legs: two 2-cell-wide columns, 3 cells tall, with a dark boot on the last row.
  // Front view: they step toward/away from the camera, so one shortens as the
  // other lengthens. Side view: they scissor fore and aft.
  const legY = originY + 13 * px;
  const sideOn = facing === 'left' || facing === 'right';
  const lift = swing * stride;

  if (!sideOn) {
    // front/back view: each leg is two cells (base + shadow column toward the
    // middle) with an outline on its outer edge; a stepping leg shortens
    const legs = [
      { x: 4, outline: 3, shade: 5, lift: Math.max(0, lift) },
      { x: 6, outline: 8, shade: 6, lift: Math.max(0, -lift) },
    ];
    for (const leg of legs) {
      const shorten = Math.round(leg.lift * 1.2 * px);
      const h = 3 * px - shorten;
      const ly = legY;
      farmerFill('#');
      rect(originX + leg.outline * px, ly, px, h);
      farmerFill('b');
      rect(originX + leg.x * px, ly, 2 * px, h - px);
      farmerFill('B');
      rect(originX + leg.shade * px, ly, px, h - px);
      farmerFill('#');
      rect(originX + (leg.x - (leg.outline < leg.x ? 1 : 0)) * px, ly + h - px, 3 * px, px); // boot
    }
  } else {
    // side view: the legs scissor fore and aft. Back leg first so the front one
    // overlaps it cleanly.
    const legs = [
      { x: 5, dx: -lift * 1.5, shade: true },
      { x: 6, dx: lift * 1.5, shade: false },
    ];
    for (const leg of legs) {
      const lx = originX + Math.round((leg.x + leg.dx) * px);
      const h = 3 * px;
      farmerFill('#');
      rect(lx - px, legY, 4 * px, h);       // outline block
      farmerFill(leg.shade ? 'B' : 'b');
      rect(lx, legY, 2 * px, h - px);       // trouser
    }
  }

  pop();
}

// ---------------------------------------------------------------------------
// AMBIENT LIFE
//
// The backgrounds are static images, so the motion is layered over them:
//
//  - cloud shadows drifting across the ground. The camera is top-down, so what you
//    would actually see of a passing cloud is its shadow, not the cloud itself
//  - season-appropriate motes in the air: petals in Spring, pollen in Summer,
//    leaves in Fall, snow in Winter
//  - crops swaying, and animals bobbing on the spot. Both reuse the Perlin pattern
//    the animals already wander with, at a much smaller amplitude, so the idle
//    motion has the same soft irregular feel as the walking
//  - a short particle burst when something is harvested or collected
//
// All of it is procedural: nothing here needs new art, and it sits on top of
// whatever the backgrounds become after the art pass.
// ---------------------------------------------------------------------------

const OUTDOOR_WORLDS = ['home', 'leftExtend', 'rightExtend', 'garden', 'chickenCoop',
                        'cattleCoop', 'pigCoop', 'duckPond'];

// cloud shadows only fall on the wide-open areas. A cloud is wide enough to cover
// most of a fenced pen at once, which reads as the lights dimming rather than as
// weather - the enclosed worlds get the airborne motes and nothing else.
const OPEN_SKY_WORLDS = ['home', 'leftExtend', 'rightExtend'];

const CLOUD_COUNT = 3;
const MOTE_COUNT = 18;
const MAX_PARTICLES = 90;

let clouds = [];
let motes = [];
let particles = [];

function isOutdoors(world) {
  return OUTDOOR_WORLDS.includes(world);
}

function hasOpenSky(world) {
  return OPEN_SKY_WORLDS.includes(world);
}

// motes take their look from the season
function moteStyle() {
  switch (currentSeason()) {
    case 'Spring': return { fill: [246, 186, 214], size: 5, fall: 0.22, spin: true };
    case 'Summer': return { fill: [255, 242, 186], size: 3, fall: 0.10, spin: false };
    case 'Fall':   return { fill: [222, 138, 68],  size: 6, fall: 0.32, spin: true };
    default:       return { fill: [244, 250, 255], size: 4, fall: 0.28, spin: false };
  }
}

function setupAmbient() {
  clouds = [];
  for (let i = 0; i < CLOUD_COUNT; i++) {
    clouds.push({
      x: random(-200, 900),
      y: random(80, 560),
      w: random(180, 320),
      h: random(90, 150),
      speed: random(0.12, 0.28),
      alpha: random(16, 30),
      seed: random(1000),
    });
  }

  motes = [];
  for (let i = 0; i < MOTE_COUNT; i++) {
    motes.push({
      x: random(800),
      y: random(650),
      speed: random(0.25, 0.7),
      seed: random(1000),
      scale: random(0.7, 1.3),
      spin: random(TWO_PI),
    });
  }
}

function updateAmbient() {
  if (!isOutdoors(currentWorld)) return;

  for (const cloud of hasOpenSky(currentWorld) ? clouds : []) {
    cloud.x += cloud.speed;
    if (cloud.x - cloud.w > width) {
      cloud.x = -cloud.w;
      cloud.y = random(80, 560);
    }
  }

  const style = moteStyle();
  for (const mote of motes) {
    // drift right and down, wobbling on the same noise the animals wander with
    mote.x += mote.speed + (noise(mote.seed + frameCount * 0.01) - 0.5) * 1.4;
    mote.y += style.fall + (noise(mote.seed + 50 + frameCount * 0.01) - 0.5) * 0.8;
    mote.spin += 0.02;
    if (mote.x > width + 20 || mote.y > height + 20) {
      mote.x = random(-40, width);
      mote.y = random(-40, -10);
    }
  }
}

// drawn over the background and its contents: a cloud shadow falls on everything
function drawCloudShadows() {
  if (!hasOpenSky(currentWorld)) return;
  push();
  noStroke();
  ellipseMode(CENTER);
  for (const cloud of clouds) {
    const drift = (noise(cloud.seed + frameCount * 0.004) - 0.5) * 20;
    fill(40, 46, 30, cloud.alpha);
    ellipse(cloud.x, cloud.y + drift, cloud.w, cloud.h);
    ellipse(cloud.x - cloud.w * 0.3, cloud.y + drift + cloud.h * 0.18, cloud.w * 0.6, cloud.h * 0.7);
    ellipse(cloud.x + cloud.w * 0.28, cloud.y + drift - cloud.h * 0.12, cloud.w * 0.55, cloud.h * 0.65);
  }
  pop();
}

function drawAmbientMotes() {
  if (!isOutdoors(currentWorld)) return;
  const style = moteStyle();
  push();
  noStroke();
  rectMode(CENTER);
  for (const mote of motes) {
    const s = style.size * mote.scale;
    fill(style.fill[0], style.fill[1], style.fill[2], 170);
    if (style.spin) {
      push();
      translate(mote.x, mote.y);
      rotate(mote.spin);
      ellipse(0, 0, s * 1.6, s * 0.8);
      pop();
    } else {
      ellipse(mote.x, mote.y, s, s);
    }
  }
  pop();
}

// ---- action bursts ---------------------------------------------------------

// a handful of short-lived bits thrown out from a point: gold sparks for a pickup,
// green leaf flecks for a harvest
function spawnBurst(x, y, kind) {
  const count = kind === 'leaf' ? 10 : 8;
  for (let i = 0; i < count; i++) {
    if (particles.length >= MAX_PARTICLES) break;
    const angle = random(TWO_PI);
    const speed = random(0.8, 2.4);
    particles.push({
      x, y,
      vx: cos(angle) * speed,
      vy: sin(angle) * speed - random(0.6, 1.6),
      life: 1,
      decay: random(0.018, 0.032),
      size: kind === 'leaf' ? random(4, 7) : random(3, 5),
      spin: random(TWO_PI),
      spinRate: random(-0.2, 0.2),
      kind,
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.06;        // a little gravity so they arc
    p.vx *= 0.98;
    p.spin += p.spinRate;
    p.life -= p.decay;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  push();
  noStroke();
  ellipseMode(CENTER);
  for (const p of particles) {
    const alpha = 255 * constrain(p.life, 0, 1);
    push();
    translate(p.x, p.y);
    rotate(p.spin);
    if (p.kind === 'leaf') {
      fill(126, 186, 90, alpha);
      ellipse(0, 0, p.size * 1.7, p.size * 0.85);
    } else {
      fill(255, 226, 128, alpha);
      // four-point spark
      quad(0, -p.size, p.size * 0.35, 0, 0, p.size, -p.size * 0.35, 0);
      quad(-p.size, 0, 0, p.size * 0.35, p.size, 0, 0, -p.size * 0.35);
    }
    pop();
  }
  pop();
}

// the same wandering noise the animals already use, at a fraction of the amplitude,
// so an animal standing still still breathes
function animalBobOffset(animal) {
  if (animal.bobSeed === undefined) animal.bobSeed = random(1000);
  return (noise(animal.bobSeed + frameCount * 0.02) - 0.5) * 5;
}

// ---------------------------------------------------------------------------
// ANIMAL CARE
//
// Chickens, cows and pigs used to produce on a flat random timer no matter what the
// player did. Each animal now carries a happiness stat that decays on the in-game
// clock and is topped up by feeding it, and that stat scales how fast its production
// timer runs - well fed animals produce faster, neglected ones stop entirely.
//
// These are plain helpers rather than a base class: the four animal classes are
// independent and each only needs three one-line calls (init, decay, draw mood), so
// a shared parent would be more disruption than it's worth.
//
// Ducks join the same system. They still chase breadcrumbs, but a crumb now feeds
// the same stat instead of the separate 120-frame heart timer they used to have.
// ---------------------------------------------------------------------------

const ANIMAL_START_HAPPINESS = 60;
const HAPPINESS_DECAY_PER_GAME_HOUR = 7;  // full to empty in about 14 in-game hours
const HAPPY_THRESHOLD = 70;               // heart shows above this
const HUNGRY_THRESHOLD = 30;              // hunger icon shows below this

// feeding costs one wheat - the starter crop, and the cheapest thing to buy back.
// Set FEED_COST to 0 if feeding should be free.
const FEED_ITEM = 'wheat';
const FEED_COST = 1;
const FEED_HAPPINESS = 35;

function initAnimalCare(animal, kind) {
  animal.kind = kind;
  animal.happiness = ANIMAL_START_HAPPINESS;
  animal.fedFlash = 0; // frames of the "just fed" heart pop
}

function decayAnimalCare(animal) {
  // one frame is 1/3600 of an in-game hour (1 real second = 1 in-game minute)
  animal.happiness = constrain(
    animal.happiness - HAPPINESS_DECAY_PER_GAME_HOUR / 3600, 0, 100);
  if (animal.fedFlash > 0) animal.fedFlash--;
}

// production speed multiplier: 1.6x when full, ~0.5x when nearly empty, 0 at zero
function animalProductionRate(animal) {
  if (animal.happiness <= 0) return 0;
  return 0.5 + 1.1 * (animal.happiness / 100);
}

// animals draw from their top-left corner (unlike eggs, which are centred), so
// anything positional has to go through this
function animalCenter(animal) {
  return { x: animal.x + animal.size / 2, y: animal.y + animal.size / 2 };
}

function animalsForWorld(world) {
  if (world === 'chickenCoop') return chickens;
  if (world === 'cattleCoop') return cows;
  if (world === 'pigCoop') return pigs;
  if (world === 'duckPond') return ducks;
  return null;
}

function feedAnimal(animal) {
  // don't spend feed on an animal that can't benefit
  if (animal.happiness >= 99.5) {
    questNotice = { text: `The ${animal.kind} is full`, at: millis() };
    return false;
  }

  if (FEED_COST > 0 && (inventory[FEED_ITEM] || 0) < FEED_COST) {
    questNotice = { text: `You need ${FEED_COST} ${itemLabel(FEED_ITEM)} to feed the ${animal.kind}`, at: millis() };
    console.log(`no ${FEED_ITEM} to feed the ${animal.kind}`);
    return false;
  }

  if (FEED_COST > 0) {
    inventory[FEED_ITEM] -= FEED_COST;
    if (FEED_ITEM === selectedSeed && inventory[FEED_ITEM] <= 0) selectedSeed = null;
    updateInventoryDisplay();
  }

  animal.happiness = constrain(animal.happiness + FEED_HAPPINESS, 0, 100);
  animal.fedFlash = 45;
  questStats.fed++;
  playSfx('collect');
  saveInventory();
  console.log(`Fed the ${animal.kind} (happiness ${Math.round(animal.happiness)})`);
  return true;
}

// a heart when content, a food bowl when hungry, plus a thin bar while it needs
// attention - enough to scan a coop and see who to walk to
function drawAnimalMood(animal) {
  if (animal.happiness === undefined) return;

  const c = animalCenter(animal);
  const x = c.x;
  const y = animal.y - 10;
  const happy = animal.happiness >= HAPPY_THRESHOLD;
  const hungry = animal.happiness < HUNGRY_THRESHOLD;
  const starving = animal.happiness <= 0;

  push();
  if (animal.fedFlash > 0 || happy) {
    // heart, popping briefly right after a feed
    const pop = animal.fedFlash > 0 ? 1 + 0.5 * (animal.fedFlash / 45) : 1;
    translate(x, y - (animal.fedFlash > 0 ? (45 - animal.fedFlash) * 0.25 : 0));
    scale(pop);
    noStroke();
    fill(0, 0, 0, 60);
    text('\u2665', 1, 2);
    fill(238, 104, 142);
    textAlign(CENTER, CENTER);
    textSize(18);
    text('\u2665', 0, 0);
  } else if (hungry) {
    // food bowl, reddening once production has actually stopped
    translate(x, y);
    const pulse = starving ? 1 + 0.1 * sin(frameCount * 0.15) : 1;
    scale(pulse);
    noStroke();
    fill(0, 0, 0, 60);
    ellipse(0, 3, 20, 9);
    fill(starving ? color(214, 82, 70) : color(206, 158, 92));
    arc(0, 0, 18, 14, 0, PI, CHORD);
    fill(starving ? color(240, 150, 140) : color(238, 208, 150));
    ellipse(0, 0, 18, 5);
    if (starving) {
      fill(255, 235, 120);
      textAlign(CENTER, CENTER);
      textSize(12);
      text('!', 12, -4);
    }
  }
  pop();

  // happiness bar while the animal needs attention
  if (!happy) {
    const w = 26, h = 4;
    push();
    rectMode(CENTER);
    noStroke();
    fill(0, 0, 0, 120);
    rect(x, animal.y - 1, w, h, 2);
    const frac = constrain(animal.happiness / 100, 0, 1);
    fill(starving ? color(214, 82, 70) : (hungry ? color(226, 168, 72) : color(140, 195, 110)));
    rect(x - w / 2 + (w * frac) / 2, animal.y - 1, Math.max(1, w * frac), h, 2);
    pop();
  }
}

// chickens!!
class Chicken {
  constructor(img, x, y) {
    this.img = img;
    this.x = x;
    this.y = y;
    this.noiseX = random(100);
    this.noiseY = random(200);
    this.size = 60;
    
    // egg laying timer
    this.eggTimer = 0;
    this.eggLayTime = random(30, 120);

    initAnimalCare(this, 'chicken');
  }

  move() {
    let minX = 150;
    let maxX = 600;
    let minY = 200;
    let maxY = 420;
    let speed = 1;

    this.x += map(noise(this.noiseX), 0, 1, -speed, speed);
    this.y += map(noise(this.noiseY), 0, 1, -speed, speed);

    this.noiseX += 0.01;
    this.noiseY += 0.01;

    this.x = constrain(this.x, minX, maxX);
    this.y = constrain(this.y, minY, maxY);
  }
  
  update() {
    this.move();
    decayAnimalCare(this);
    
    // increment egg timer, scaled by how well fed this chicken is
    this.eggTimer += (1/60) * animalProductionRate(this);
    
    // check if it's time to lay an egg
    if (this.eggTimer >= this.eggLayTime) {
      console.log('Egg!');
      eggs.push(new Egg(this.x, this.y));
      
      // reset timer with new random time
      this.eggTimer = 0;
      this.eggLayTime = random(15, 60);
    }
  }

  draw() {
    push();
    translate(0, animalBobOffset(this));
    image(this.img, this.x, this.y, this.size, this.size);
    drawAnimalMood(this);
    pop();
  }
}

// Duck class
class Duck {
  constructor(img, x, y) {
    this.img = img;
    this.x = x;
    this.y = y;
    this.noiseX = random(100);
    this.noiseY = random(200);
    this.size = 60;
    this.isFeeding = false;
    this.feedingTimer = 0;
    this.targetCrumb = null;

    initAnimalCare(this, 'duck');
  }

  move() {
    let minX = 150;
    let maxX = 600;
    let minY = 200;
    let maxY = 420;
    let speed = 1;

    // if duck has a target crumb, move towards it
    if (this.targetCrumb && breadCrumbs.includes(this.targetCrumb)) {
      let dx = this.targetCrumb.x - this.x;
      let dy = this.targetCrumb.y - this.y;
      let distance = dist(this.x, this.y, this.targetCrumb.x, this.targetCrumb.y);
      
      if (distance < 10) {
        // reached the crumb - eat it!
        this.isFeeding = true;
        this.feedingTimer = 60; // feed for 1 second
        // a crumb feeds the same happiness stat the other animals use
        this.happiness = constrain(this.happiness + FEED_HAPPINESS + 15, 0, 100);
        this.fedFlash = 45;
        breadCrumbs.splice(breadCrumbs.indexOf(this.targetCrumb), 1);
        this.targetCrumb = null;
      } else {
        // move towards crumb
        this.x += (dx / distance) * speed * 2;
        this.y += (dy / distance) * speed * 2;
      }
    } else {
      // find nearest bread crumb if available
      if (breadCrumbs.length > 0 && !this.targetCrumb) {
        let nearest = null;
        let nearestDist = Infinity;
        for (let crumb of breadCrumbs) {
          let d = dist(this.x, this.y, crumb.x, crumb.y);
          if (d < nearestDist) {
            nearestDist = d;
            nearest = crumb;
          }
        }
        this.targetCrumb = nearest;
      }
      
      // normal wandering behavior
      this.x += map(noise(this.noiseX), 0, 1, -speed, speed);
      this.y += map(noise(this.noiseY), 0, 1, -speed, speed);

      this.noiseX += 0.01;
      this.noiseY += 0.01;
    }

    this.x = constrain(this.x, minX, maxX);
    this.y = constrain(this.y, minY, maxY);
  }
  
  update() {
    if (this.isFeeding) {
      this.feedingTimer--;
      if (this.feedingTimer <= 0) {
        this.isFeeding = false;
      }
    } else {
      this.move();
    }
    
    decayAnimalCare(this);
  }

  draw() {
    push();
    translate(0, animalBobOffset(this));
    image(this.img, this.x, this.y, this.size, this.size);
    drawAnimalMood(this);
    pop();
  }
}

// BreadCrumb class
class BreadCrumb {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 25;
  }
  
  draw() {
    image(breadImg, this.x - this.size/2, this.y - this.size/2, this.size, this.size);
  }
}

// Egg class
class Egg {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 30;
    // track when egg was created -> expires after 120 sec
    this.spawnTime = millis(); 
    this.lifetime = 120000;
  }
  
  isExpired() {
    return millis() - this.spawnTime >= this.lifetime;
  }

  draw() {
    // draw egg image
    image(eggImg, this.x - this.size/2, this.y - this.size/2, this.size, this.size);
    
    let timeLeft = this.lifetime - (millis() - this.spawnTime);
    // warning at 15 secs left before expiry
    if (timeLeft < 15000) { 
      // red outline when egg is about to expire
      noFill();
      stroke(255, 0, 0);
      strokeWeight(2);
      ellipse(this.x, this.y, this.size + 4, this.size + 4);
      strokeWeight(1);
    }
  }
}

// cowss!!
class Cow {
  constructor(img, x, y) {
    this.img = img;
    this.x = x;
    this.y = y;
    this.noiseX = random(100);
    this.noiseY = random(200);
    this.size = 125;
    
    this.milkTimer = 0;
    this.milkProduceTime = random(30, 120);

    initAnimalCare(this, 'cow');
  }

  move() {
    let minX = 150;
    let maxX = 600;
    let minY = 200;
    let maxY = 420;
    let speed = 0.8;

    this.x += map(noise(this.noiseX), 0, 1, -speed, speed);
    this.y += map(noise(this.noiseY), 0, 1, -speed, speed);

    this.noiseX += 0.008;
    this.noiseY += 0.008;

    this.x = constrain(this.x, minX, maxX);
    this.y = constrain(this.y, minY, maxY);
  }
  
  update() {
    this.move();
    decayAnimalCare(this);
    
    this.milkTimer += (1/60) * animalProductionRate(this);
    
    if (this.milkTimer >= this.milkProduceTime) {
      console.log('Milk!');
      milks.push(new Milk(this.x, this.y));
      
      this.milkTimer = 0;
      this.milkProduceTime = random(30, 60);
    }
  }

  draw() {
    push();
    translate(0, animalBobOffset(this));
    image(this.img, this.x, this.y, this.size, this.size);
    drawAnimalMood(this);
    pop();
  }
}

// Milk class
class Milk {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 50;
    this.spawnTime = millis();
    this.lifetime = 120000;
  }
  
  isExpired() {
    return millis() - this.spawnTime >= this.lifetime;
  }

  draw() {
    image(milkImg, this.x - this.size/2, this.y - this.size/2, this.size, this.size);
    
    let timeLeft = this.lifetime - (millis() - this.spawnTime);
    if (timeLeft < 15000) {
      noFill();
      stroke(255, 0, 0);
      strokeWeight(2);
      ellipse(this.x, this.y, this.size + 4, this.size + 4);
      strokeWeight(1);
    }
  }
}

// Pig class
class Pig {
  constructor(img, x, y) {
    this.img = img;
    this.x = x;
    this.y = y;
    this.noiseX = random(100);
    this.noiseY = random(200);
    this.size = 125;
    
    this.baconTimer = 0;
    this.baconProduceTime = random(30, 60);

    initAnimalCare(this, 'pig');
  }

  move() {
    let minX = 200;
    let maxX = 550;
    let minY = 200;
    let maxY = 450;
    let speed = 0.9;

    this.x += map(noise(this.noiseX), 0, 1, -speed, speed);
    this.y += map(noise(this.noiseY), 0, 1, -speed, speed);

    this.noiseX += 0.009;
    this.noiseY += 0.009;

    this.x = constrain(this.x, minX, maxX);
    this.y = constrain(this.y, minY, maxY);
  }
  
  update() {
    this.move();
    decayAnimalCare(this);
    
    this.baconTimer += (1/60) * animalProductionRate(this);
    
    if (this.baconTimer >= this.baconProduceTime) {
      console.log('Bacon!');
      bacons.push(new Bacon(this.x, this.y));
      
      this.baconTimer = 0;
      this.baconProduceTime = random(15, 60);
    }
  }

  draw() {
    push();
    translate(0, animalBobOffset(this));
    image(this.img, this.x, this.y, this.size, this.size);
    drawAnimalMood(this);
    pop();
  }
}

// Bacon class
class Bacon {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 50;
    this.spawnTime = millis();
    this.lifetime = 120000;
  }
  
  isExpired() {
    return millis() - this.spawnTime >= this.lifetime;
  }

  draw() {
    image(baconImg, this.x - this.size/2, this.y - this.size/2, this.size, this.size);
    
    let timeLeft = this.lifetime - (millis() - this.spawnTime);
    if (timeLeft < 15000) {
      noFill();
      stroke(255, 0, 0);
      strokeWeight(2);
      ellipse(this.x, this.y, this.size + 4, this.size + 4);
      strokeWeight(1);
    }
  }
}

// ---------------------------------------------------------------------------
// SEASONS AND CROP TRAITS
//
// Every crop used to grow at the same 0.0015 and differ only by where it sat in the
// trade tree. Two traits now separate them, and they pull against each other: a crop
// that grows fast is worth less than its tier suggests, and a slow one is worth more.
// Planting everything is no longer the obvious move.
//
// Value is a MULTIPLIER on the price derived from the recipe tables rather than a
// hand-written price, so the derivation stays the single source of truth and editing
// a recipe still re-prices everything downstream.
//
// Seasons run off the day counter. Two crops are season-locked; the rest grow year
// round at a seasonal rate. A locked crop is never a hard wall - it can still be
// bought with coins - which is the reason locking one is fair at all.
// ---------------------------------------------------------------------------

const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];
const DAYS_PER_SEASON = 1; // one in-game day each, so a year is four days

// how fast things grow in each season. Winter is a slog, not a ban: a hard stop
// would idle the garden for a whole in-game day.
const SEASON_GROWTH = { Spring: 1.15, Summer: 1.0, Fall: 0.9, Winter: 0.6 };

// garden background tint per season (multiplied over gardenBg)
const SEASON_TINT = {
  Spring: [214, 255, 216],  // fresh green
  Summer: [255, 244, 186],  // bleached sun
  Fall:   [255, 196, 140],  // warm amber
  Winter: [186, 214, 255],  // cold blue
};

// growth: multiplies the crop's base growthSpeed. value: multiplies its derived
// sell price. seasons: null for year-round, or the list it will grow in.
const CROP_TRAITS = {
  wheat:      { growth: 1.35, value: 0.90, seasons: null,      note: 'Grows quickly, sells cheap' },
  radish:     { growth: 1.45, value: 0.80, seasons: null,      note: 'The fastest crop on the farm' },
  corn:       { growth: 1.15, value: 0.95, seasons: null,      note: 'Quick and dependable' },
  carrot:     { growth: 1.20, value: 0.90, seasons: null,      note: 'Quick and dependable' },
  strawberry: { growth: 1.10, value: 1.10, seasons: ['Spring'], note: 'Spring only' },
  pepper:     { growth: 0.95, value: 1.05, seasons: null,      note: 'Steady grower' },
  apple:      { growth: 0.80, value: 1.15, seasons: null,      note: 'Slow, but worth more' },
  grape:      { growth: 0.85, value: 1.15, seasons: null,      note: 'Slow, but worth more' },
  lemon:      { growth: 0.75, value: 1.20, seasons: null,      note: 'Slow, but worth more' },
  peach:      { growth: 0.70, value: 1.25, seasons: null,      note: 'Slow, but worth more' },
  pumpkin:    { growth: 0.55, value: 1.50, seasons: ['Fall'],  note: 'Fall only, slow, and the richest crop' },
};

function cropTraits(itemName) {
  return CROP_TRAITS[itemName] || { growth: 1, value: 1, seasons: null, note: '' };
}

function currentSeason() {
  const index = Math.floor((gameDay() - 1) / DAYS_PER_SEASON) % SEASONS.length;
  return SEASONS[index];
}

// in-game days until this season ends
function daysLeftInSeason() {
  const dayInSeason = (gameDay() - 1) % DAYS_PER_SEASON;
  return DAYS_PER_SEASON - dayInSeason;
}

function cropSeasons(itemName) {
  return cropTraits(itemName).seasons;
}

function canPlantInSeason(itemName, season) {
  const seasons = cropSeasons(itemName);
  return !seasons || seasons.includes(season || currentSeason());
}

// a short line for the inventory tooltip
function cropSeasonLabel(itemName) {
  const seasons = cropSeasons(itemName);
  return seasons ? `${seasons.join(', ')} only` : 'Grows year round';
}

function drawSeasonTint() {
  const rgb = SEASON_TINT[currentSeason()];
  if (rgb) tint(rgb[0], rgb[1], rgb[2]);
}

// ---------------------------------------------------------------------------
// IN-GAME CLOCK
//
// One real second is one in-game minute, so an in-game day is 24 real minutes.
// Nothing else depends on this yet - it exists so crop watering can be measured in
// in-game hours rather than raw milliseconds, and so the day/night cycle can extend
// it later instead of introducing a second, conflicting notion of time.
//
// The clock only advances while the game is open: crops don't dry out while the tab
// is closed. Total elapsed minutes ride along in the save.
// ---------------------------------------------------------------------------

const REAL_MS_PER_GAME_MINUTE = 1000;
const MINUTES_PER_GAME_HOUR = 60;
const HOURS_PER_GAME_DAY = 24;
const DAY_START_HOUR = 6; // a new farm opens at 06:00 rather than midnight

let gameMinutesElapsed = 0; // in-game minutes since this farm began
let lastClockTickMs = null;

function updateGameClock() {
  const now = millis();
  if (lastClockTickMs === null) {
    lastClockTickMs = now;
    return;
  }
  gameMinutesElapsed += (now - lastClockTickMs) / REAL_MS_PER_GAME_MINUTE;
  lastClockTickMs = now;
}

// total in-game hours since the farm began - the unit crop watering works in
function gameHours() {
  return gameMinutesElapsed / MINUTES_PER_GAME_HOUR;
}

function gameDay() {
  return Math.floor(gameMinutesElapsed / (MINUTES_PER_GAME_HOUR * HOURS_PER_GAME_DAY)) + 1;
}

function gameClockLabel() {
  const total = gameMinutesElapsed + DAY_START_HOUR * MINUTES_PER_GAME_HOUR;
  const h = Math.floor(total / MINUTES_PER_GAME_HOUR) % HOURS_PER_GAME_DAY;
  const m = Math.floor(total % MINUTES_PER_GAME_HOUR);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function drawGameClock() {
  const w = 176, h = 30;
  const x = width - 130 - 10 - w, y = 12;

  push();
  rectMode(CORNER);
  noStroke();
  fill(58, 36, 21, 220);
  rect(x + 3, y + 3, w, h, 6);
  fill(202, 160, 106);
  stroke(58, 36, 21);
  strokeWeight(3);
  rect(x, y, w, h, 6);

  noStroke();
  fill(58, 36, 21);
  textAlign(CENTER, CENTER);
  textSize(14);
  textStyle(BOLD);
  text(`${currentSeason()}  Day ${gameDay()}  ${gameClockLabel()}`, x + w / 2, y + h / 2 + 1);
  textStyle(NORMAL);
  pop();
}

// ---------------------------------------------------------------------------
// CROP CARE
//
// A planted crop does nothing until it's watered. Watering tops up a reservoir that
// drains over WATER_LASTS_HOURS; growth speed scales with how full it is, so topping
// it up often is meaningfully faster than watering once and walking away. Let it run
// dry and growth stops entirely; leave it dry past WITHER_AFTER_HOURS and the crop
// withers, blocking its plot until cleared for nothing.
// ---------------------------------------------------------------------------

const WATER_LASTS_HOURS = 8;    // in-game hours of moisture from one watering
const WITHER_AFTER_HOURS = 20;  // in-game hours dry before the crop is lost
const FRESH_GROWTH_BONUS = 0.5; // up to +50% growth speed right after watering

// crop class w/ growth stages
class Crop {
  constructor(sheet, itemName, x, y, w, h) {
    this.sheet = sheet;
    this.itemName = itemName;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.sheetW = sheet.width / 3; // 3 frames
    this.sheetH = sheet.height;
    
    // growth stages: 0 = seedling, 1 = growing, 2 = harvest
    this.growthStage = 0;
    this.growthTimer = 0;
    this.growthSpeed = 0.0015 * cropTraits(itemName).growth;

    this.swaySeed = random(1000); // per-plant offset so the field doesn't sway in lockstep

    // crop care: a crop is planted dry and grows nothing until watered
    this.plantedHour = gameHours();
    this.lastWateredHour = null; // null = never watered, so it dries from planting
    this.withered = false;
  }

  // in-game hours since this crop last had water (or since it was planted)
  hoursSinceWater() {
    const since = this.lastWateredHour === null ? this.plantedHour : this.lastWateredHour;
    return Math.max(0, gameHours() - since);
  }

  // 1 right after watering, falling to 0 as the moisture runs out.
  // A crop that has never been watered is dry from the moment it's planted - that's
  // what makes watering a required step rather than an optional boost.
  moisture() {
    if (this.withered || this.lastWateredHour === null) return 0;
    return constrain(1 - (gameHours() - this.lastWateredHour) / WATER_LASTS_HOURS, 0, 1);
  }

  // a fully grown crop is done - it stops drinking and can't be lost, so walking
  // away from a ripe harvest never destroys it. (Drop the growthStage check here and
  // in update() if ripe crops should rot too.)
  needsWater() {
    return !this.withered && this.growthStage < 2 && this.moisture() <= 0;
  }

  // how close this crop is to being lost, 0..1 - drives the warning colour
  witherProgress() {
    return constrain(this.hoursSinceWater() / WITHER_AFTER_HOURS, 0, 1);
  }

  water() {
    if (this.withered) return false;
    this.lastWateredHour = gameHours();
    return true;
  }

  draw() {
    // withered: a grey, faded husk that still occupies the plot
    if (this.withered) {
      push();
      // slumped, shrunken and drained of colour
      translate(this.x + this.w / 2, this.y + this.h);
      rotate(radians(7));
      tint(124, 104, 78, 150);
      image(this.sheet, -this.w / 2, -this.h * 0.86, this.w, this.h * 0.86,
            this.sheetW * this.growthStage, 0, this.sheetW, this.sheetH);
      noTint();
      noStroke();
      fill(74, 56, 38, 200);
      ellipse(0, -2, this.w * 0.55, this.h * 0.12);
      pop();

      this.drawWitherMarker();
      return;
    }

    // damp soil under a watered crop, so tended plots read at a glance
    const wet = this.moisture();
    if (wet > 0) {
      push();
      noStroke();
      fill(70, 45, 25, 40 + 90 * wet);
      ellipse(this.x + this.w / 2, this.y + this.h * 0.85, this.w * 0.72, this.h * 0.2);
      pop();
    }

    // draw the current growth stage, swaying from the base like a plant in wind
    push();
    translate(this.x + this.w / 2, this.y + this.h);
    rotate(radians((noise(this.swaySeed + frameCount * 0.012) - 0.5) * 6));
    image(this.sheet, -this.w / 2, -this.h, this.w, this.h,
          this.sheetW * this.growthStage, 0, this.sheetW, this.sheetH);
    pop();

    if (this.needsWater()) this.drawThirstMarker();
  }

  // a droplet above a dry crop, reddening as it gets closer to withering
  // (same escalation the egg expiry warning uses)
  drawThirstMarker() {
    const urgent = this.witherProgress() > 0.6;
    const cx = this.x + this.w / 2;
    const cy = this.y - 6;
    const pulse = 1 + 0.12 * sin(frameCount * 0.12);

    push();
    translate(cx, cy);
    scale(pulse);
    noStroke();
    fill(0, 0, 0, 70);
    ellipse(0, 2, 11, 13);
    fill(urgent ? color(226, 92, 76) : color(120, 190, 235));
    ellipse(0, 1, 9, 11);
    triangle(-3.2, -2.5, 3.2, -2.5, 0, -8);
    fill(255, 255, 255, 190);
    ellipse(-2, 2, 2.6, 3.4);
    pop();
  }

  // a small brown cross above a dead plant: unmistakably not a crop any more,
  // and a cue that the plot needs clearing
  drawWitherMarker() {
    const cx = this.x + this.w / 2;
    const cy = this.y - 5;
    push();
    translate(cx, cy);
    noStroke();
    fill(0, 0, 0, 60);
    ellipse(0, 1, 13, 13);
    fill(150, 120, 92);
    ellipse(0, 0, 12, 12);
    stroke(78, 58, 40);
    strokeWeight(2);
    line(-2.6, -2.6, 2.6, 2.6);
    line(2.6, -2.6, -2.6, 2.6);
    pop();
  }

  update() {
    if (this.withered) return;

    // dry too long and it's lost - unless it already made it to harvest
    if (this.growthStage < 2 && this.hoursSinceWater() >= WITHER_AFTER_HOURS) {
      this.withered = true;
      console.log(`${this.itemName} withered from lack of water`);
      return;
    }

    const wet = this.moisture();
    if (wet <= 0) return; // bone dry: growth stops until it's watered again

    // only grow if not fully grown
    if (this.growthStage < 2) {
      this.growthTimer += this.growthSpeed
        * (1 + FRESH_GROWTH_BONUS * wet)
        * (SEASON_GROWTH[currentSeason()] || 1);
      
      // move to next stage when timer reaches 1
      if (this.growthTimer >= 1) {
        this.growthStage++;
        this.growthTimer = 0;
        console.log(`${this.itemName} grew to stage ${this.growthStage + 1}`);
      }
    }
  }
  
  // check if ready to harvest
  isHarvestable() {
    return this.growthStage === 2 && !this.withered;
  }
  
  // harvest the crop
  harvest() {
    if (this.isHarvestable()) {
      console.log(`Harvested ${this.itemName}!`);
      playSfx('harvest');
      return true;
    }
    return false;
  }
}

// ---------------------------------------------------------------------------
// AUDIO
//
// One ambient loop per area plus a handful of short SFX, all loaded in preload()
// via p5.sound (bundled at p5/addons/p5.sound.min.js, wired up in index.html).
//
// Files live in sounds/ and were synthesized as placeholders - see
// sounds/generate-sounds.py. Every one is meant to be swapped for a real recording
// later: drop a file with the same name in and nothing else has to change.
//
// Nothing here is load-bearing. Missing files, a browser that blocks audio, or
// p5.sound failing to load all end in the same place: the game runs silently.
// ---------------------------------------------------------------------------

const SOUND_FILES = {
  sfx: {
    collect: 'sounds/sfx-collect.wav',  // egg / milk / bacon pickup
    harvest: 'sounds/sfx-harvest.wav',  // pulling a grown crop
    plant:   'sounds/sfx-plant.wav',    // seed into soil
    trade:   'sounds/sfx-trade.wav',    // barn / market trade completed
    enter:   'sounds/sfx-enter.wav',    // stepping into a hub zone
    exit:    'sounds/sfx-exit.wav',     // ...and back out
    water:   'sounds/sfx-water.wav',    // watering a crop
    wither:  'sounds/sfx-wither.wav',   // clearing a dead plant
  },
  ambient: {
    field:  'sounds/amb-field.wav',     // open air: wind, birds, warm pad
    coop:   'sounds/amb-coop.wav',      // animal pens: straw, soft clucks
    water:  'sounds/amb-water.wav',     // pond: lapping water, droplets
    indoor: 'sounds/amb-indoor.wav',    // barn / market: low hum, murmur, creaks
  },
};

// which bed plays where. Four tracks cover eleven worlds: the open-air areas share
// 'field', the three animal pens share 'coop', and the two trading interiors share
// 'indoor'. Worlds mapped to the SAME bed don't restart it when you walk between
// them - see setAmbientForWorld().
const WORLD_AMBIENT = {
  start:         'field',
  home:          'field',
  leftExtend:    'field',
  rightExtend:   'field',
  garden:        'field',
  chickenCoop:   'coop',
  cattleCoop:    'coop',
  pigCoop:       'coop',
  duckPond:      'water',
  barn:          'indoor',
  farmersMarket: 'indoor',
};

// sub-worlds you step into and back out of, which is what the whoosh marks. Walking
// between home/leftExtend/rightExtend is a plain edge transition, so it just
// crossfades the bed with no whoosh on top.
const HUB_WORLDS = ['chickenCoop', 'cattleCoop', 'pigCoop', 'duckPond', 'garden', 'barn', 'farmersMarket'];

const AMBIENT_VOLUME = 0.32;
const SFX_VOLUME = 0.55;
const AMBIENT_CROSSFADE = 1.2; // seconds

let sfxSounds = {};
let ambientSounds = {};
let currentAmbient = null;  // key of the bed currently playing
let audioMuted = false;     // persisted with the rest of the save, see saveInventory()
let audioReady = false;     // true once the browser has let the audio context start
let audioAvailable = false; // false if p5.sound never loaded

// called from preload(). loadSound gets an error callback for every file, so a
// missing or unplayable one logs a warning instead of breaking the sketch.
function preloadSounds() {
  if (typeof loadSound !== 'function') {
    console.warn('p5.sound not available - running without audio. Is p5/addons/p5.sound.min.js included in index.html?');
    return;
  }
  audioAvailable = true;

  const onError = (path) => () => {
    console.warn(`sound file missing or unplayable: ${path} - that cue will stay silent`);
  };

  for (const [name, path] of Object.entries(SOUND_FILES.sfx)) {
    sfxSounds[name] = loadSound(path, undefined, onError(path));
  }
  for (const [name, path] of Object.entries(SOUND_FILES.ambient)) {
    ambientSounds[name] = loadSound(path, undefined, onError(path));
  }
}

// browsers refuse to start audio until the player interacts with the page, so the
// first click or key press unlocks it and kicks off the ambient bed
function ensureAudioStarted() {
  if (audioReady || !audioAvailable) return;
  if (typeof userStartAudio !== 'function') return;

  userStartAudio();
  audioReady = true;
  applyMasterVolume(0);

  currentAmbient = null; // force setAmbientForWorld() to actually start a track
  setAmbientForWorld(currentWorld);
}

function applyMasterVolume(ramp = 0.2) {
  if (typeof outputVolume === 'function') outputVolume(audioMuted ? 0 : 1, ramp);
}

function isPlayable(sound) {
  return sound && typeof sound.isLoaded === 'function' && sound.isLoaded();
}

function playSfx(name) {
  if (!audioReady || audioMuted) return;
  const sound = sfxSounds[name];
  if (!isPlayable(sound)) return;
  sound.setVolume(SFX_VOLUME);
  sound.play();
}

// crossfade to the bed belonging to `world`. Worlds that share a bed are a no-op,
// so the track keeps rolling across e.g. home -> garden instead of restarting.
function setAmbientForWorld(world) {
  const key = WORLD_AMBIENT[world] || 'field';

  if (!audioReady) {
    currentAmbient = null; // remember nothing; ensureAudioStarted() will start it
    return;
  }
  if (key === currentAmbient) return;

  const outgoing = ambientSounds[currentAmbient];
  if (isPlayable(outgoing) && outgoing.isPlaying()) {
    outgoing.setVolume(0, AMBIENT_CROSSFADE);
    // stop it once it's silent, unless it has become the current bed again by then
    setTimeout(() => {
      if (ambientSounds[currentAmbient] !== outgoing) outgoing.stop();
    }, AMBIENT_CROSSFADE * 1000 + 150);
  }

  currentAmbient = key;

  const incoming = ambientSounds[key];
  if (isPlayable(incoming)) {
    incoming.setVolume(0);
    if (!incoming.isPlaying()) incoming.loop();
    incoming.setVolume(AMBIENT_VOLUME, AMBIENT_CROSSFADE);
  }
}

// whoosh when stepping into or out of a hub zone (skipped for the opening
// start -> home transition, and for plain edge walks across the overworld)
function playWorldTransitionSfx(from, to) {
  if (!from || from === 'start') return;
  if (HUB_WORLDS.includes(to)) playSfx('enter');
  else if (HUB_WORLDS.includes(from)) playSfx('exit');
}

function setMuted(muted) {
  audioMuted = muted;
  applyMasterVolume();
  updateMuteButton();
  saveInventory(); // the preference rides along with the rest of the save
  console.log(`Audio ${audioMuted ? 'muted' : 'unmuted'}`);
}

function updateMuteButton() {
  const btn = document.getElementById('mute-button');
  if (!btn) return;
  // the icon is a pixel bitmap from hud-icons.js; fall back to text if that file
  // didn't load for some reason so the button never goes blank
  if (window.setPixelIcon) {
    window.setPixelIcon(btn, audioMuted ? 'muted' : 'sound');
  } else {
    btn.textContent = audioMuted ? 'off' : 'on';
  }
  btn.title = audioMuted ? 'Sound off' : 'Sound on';
  btn.setAttribute('aria-label', audioMuted ? 'Unmute sound' : 'Mute sound');
  btn.setAttribute('aria-pressed', String(audioMuted));

  const label = document.getElementById('mute-label');
  if (label) label.textContent = audioMuted ? 'Muted' : 'Sound';
}

// Arrow keys and space drive the player, but the browser also uses them to scroll
// the page. On a short window that means the whole screen lurches every time you
// walk. Swallow those keys at the window level - there are no text inputs on the
// page, so nothing else wants them.
function preventGameKeyScroll() {
  const blocked = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Spacebar'];
  window.addEventListener('keydown', (e) => {
    if (blocked.includes(e.key)) e.preventDefault();
  }, { passive: false });
}

function preload() {
  farmBg = loadImage('farm.png');
  chickenCoopBg = loadImage('chicken-coop.png');
  gardenBg = loadImage('garden.png');
  barn = loadImage('barn.png'); 
  home = loadImage('home.png');
  startpage = loadImage('startscreen.png');
  chicken1 = loadImage('animal/chicken1.png');
  chicken2 = loadImage('animal/chicken2.png');
  eggImg = loadImage('produce/egg.png');
  duck1 = loadImage('animal/duck1.png');
  duck2 = loadImage('animal/duck2.png');
  leftArrow = loadImage('arrows/left.png');
  rightArrow = loadImage('arrows/right.png');
  backArrow = loadImage('arrows/back.png');
  guideIcon = loadImage('guide.png'); // book icon
  guideImg = loadImage('guideInstruct.png'); //make this
  leftExtendBg = loadImage('leftextend.png');
  rightExtendBg = loadImage('rightextend.png');
  cattleCoopBg = loadImage('cattle-coop.png');
  duckPondBg = loadImage('pond.png');
  farmersMarketBg = loadImage('market.png');
  pigCoopBg = loadImage('pig-coop.png');
  cowImg = loadImage('animal/cow.png');
  breadImg = loadImage('produce/bread.png');
  milkImg = loadImage('produce/milk.png');
  pigImg = loadImage('animal/pig.png');
  baconImg = loadImage('produce/bacon.png');
  pieImg = loadImage('produce/pie.png');
  cheeseImg = loadImage('produce/cheese.png');
  sandwichImg = loadImage('produce/sandwich.png');
  appleJamImg = loadImage('produce/applejam.png');
  carrotCakeImg = loadImage('produce/carrotcake.png');
  
  for (let i = 0; i < 64; i++) {
    produceImgs[i] = loadImage(producePaths[i]);
  }

  preloadSounds();
}

// the same pixel face the HTML chrome uses (see @font-face in style.css), so the
// canvas HUD and the page around it read as one thing. Text is redrawn every
// frame, so it snaps to the pixel face the moment the font finishes loading.
// (A single family name, not a stack: p5 wraps the whole string in quotes.)
const UI_FONT = 'Pixelify Sans';

function setup() {
  let canvas = createCanvas(800, 650);
  noiseDetail(24);
  canvas.parent('canvas-container');
  canvas.elt.style.border = 'none'; // rounded corners + shadow now come from CSS, see #canvas-container canvas

  textFont(UI_FONT);
  if (document.fonts && document.fonts.load) {
    document.fonts.load("16px 'Pixelify Sans'").catch(() => {});
  }

  loadInventory();

  refillQuests(); // top the board up to three goals, after any saved ones load

  setupAmbient();

  initializeInventory();
  console.log('inventory initialized');

  setupDragGhost();
  setupHudButtons();
  preventGameKeyScroll();
  
  // create chickens
  for (let i = 0; i < 5; i++) {
    chickens.push(new Chicken(chicken1, random(200, 600), random(200, 500)));
  }
  for (let i = 0; i < 4; i++) {
    chickens.push(new Chicken(chicken2, random(200, 600), random(200, 500)));
  }
  
  // create ducks
  for (let i = 0; i < 3; i++) {
    ducks.push(new Duck(duck1, random(200, 600), random(200, 500)));
  }
  for (let i = 0; i < 2; i++) {
    ducks.push(new Duck(duck2, random(200, 600), random(200, 500)));
  }

  // create player character
  player = new Player(width / 2, height / 2);

  // the animals and the player exist now, so the rest of the save can go back
  applyRestoredState();

  // setup canvas drop handling after delay
  setTimeout(() => {
    setupCanvasDropHandling();
  }, 100);
  console.log('game setup complete!');
}

// helper function to change worlds and track history
// entryX/entryY optionally place the player at a specific spot in the new world
// (used for walk-triggered transitions so the player doesn't land back on the trigger edge)
function changeWorld(newWorld, entryX, entryY) {
  previousWorld = currentWorld;
  currentWorld = newWorld;
  tutorialVisited[newWorld] = true;
  console.log(`Changed from ${previousWorld} to ${currentWorld}`);

  // clear any in-progress trade ingredient slots when leaving/entering the barn or
  // market - filledSlots is shared state, and ingredient names can collide between
  // the two trade tables (e.g. "egg"), so stale fills from one must not carry over
  filledSlots = {};
  lastSale = null;   // a sale confirmation shouldn't follow you into the next world

  // re-center player so it always starts inside the new world's walkable bounds
  if (player) {
    const bounds = worldBounds[newWorld];
    if (bounds) {
      const targetX = entryX !== undefined && entryX !== null ? entryX : player.x;
      const targetY = entryY !== undefined && entryY !== null ? entryY : player.y;
      player.x = constrain(targetX, bounds.minX, bounds.maxX);
      player.y = constrain(targetY, bounds.minY, bounds.maxY);

      // safety net: if the landing spot happens to fall inside one of the new world's
      // fenced hub zones (e.g. going "back" from a hub re-uses the player's in-hub x/y,
      // which can map onto that hub's own fence quad in the parent world), the player
      // would be stuck unable to move in any direction. Nudge them out to the nearest
      // point outside the fence instead.
      nudgeOutOfFence(bounds);
    }
  }

  // audio: whoosh for stepping in/out of a hub, then crossfade to the new area's bed
  playWorldTransitionSfx(previousWorld, newWorld);
  setAmbientForWorld(newWorld);

  // prevent instantly re-triggering another transition for a few frames
  worldChangeCooldown = 20;
}

// if the player currently sits inside a hub zone's fence quad (for currentWorld),
// push them straight out to just past the nearest edge of that quad, then re-clamp
// to the world's walkable bounds. No-ops if the player isn't inside any fence.
function nudgeOutOfFence(bounds) {
  if (!player) return;
  const zones = hubZones[currentWorld];
  if (!zones) return;

  for (const zone of zones) {
    const [x1, y1, x2, y2, x3, y3, x4, y4] = zone.quad;
    if (!isPointInQuad(player.x, player.y, x1, y1, x2, y2, x3, y3, x4, y4)) continue;

    // find the closest edge of this quad and push the player just outside it
    const corners = [[x1, y1], [x2, y2], [x3, y3], [x4, y4]];
    let bestDist = Infinity, bestX = player.x, bestY = player.y;
    for (let i = 0; i < 4; i++) {
      const [ax, ay] = corners[i];
      const [bx, by] = corners[(i + 1) % 4];
      const abx = bx - ax, aby = by - ay;
      const apx = player.x - ax, apy = player.y - ay;
      const abLenSq = abx * abx + aby * aby;
      let t = abLenSq > 0 ? (apx * abx + apy * aby) / abLenSq : 0;
      t = constrain(t, 0, 1);
      const closestX = ax + t * abx;
      const closestY = ay + t * aby;
      const d = dist(player.x, player.y, closestX, closestY);
      if (d < bestDist) {
        bestDist = d;
        bestX = closestX;
        bestY = closestY;
      }
    }

    // push 10px further out along the line from the quad's center through the closest point,
    // so the player clears the fence rather than landing exactly on its edge
    const cx = (x1 + x2 + x3 + x4) / 4;
    const cy = (y1 + y2 + y3 + y4) / 4;
    const dirX = bestX - cx, dirY = bestY - cy;
    const len = Math.hypot(dirX, dirY) || 1;
    player.x = constrain(bestX + (dirX / len) * 10, bounds.minX, bounds.maxX);
    player.y = constrain(bestY + (dirY / len) * 10, bounds.minY, bounds.maxY);
    return; // only one fence should ever apply at a time
  }
}

// check if the player has walked into an edge-transition zone (home/leftExtend/rightExtend
// border crossings), and switch worlds automatically. Hub zones (coop/barn/market/garden)
// are NOT auto-triggered here - they're fenced off; see isBlockedByFence() and
// findNearbyHubZone() / findTargetAtPoint() for click- (or space-) at-perimeter entry.
function checkWorldTransitions() {
  if (!player || worldChangeCooldown > 0) return;

  const edges = edgeTransitions[currentWorld];
  if (edges) {
    for (const edge of edges) {
      if (edge.side === 'left' && player.x <= edge.threshold) {
        changeWorld(edge.destination, edge.entryX, edge.entryY ?? player.y);
        return;
      }
      if (edge.side === 'right' && player.x >= edge.threshold) {
        changeWorld(edge.destination, edge.entryX, edge.entryY ?? player.y);
        return;
      }
    }
  }
}

// true if (x, y) falls inside a hub zone's quad for the current world - used to
// block movement, like the zone has a fence around it
function isBlockedByFence(x, y) {
  const zones = hubZones[currentWorld];
  if (!zones) return false;
  for (const zone of zones) {
    const [x1, y1, x2, y2, x3, y3, x4, y4] = zone.quad;
    if (isPointInQuad(x, y, x1, y1, x2, y2, x3, y3, x4, y4)) {
      return true;
    }
  }
  return false;
}

// how far a point is from a quad's perimeter (edges), in pixels.
// returns 0 if the point is inside or exactly on the boundary.
function distToQuadPerimeter(px, py, quad) {
  const [x1, y1, x2, y2, x3, y3, x4, y4] = quad;
  const corners = [[x1, y1], [x2, y2], [x3, y3], [x4, y4]];
  let minDist = Infinity;

  for (let i = 0; i < 4; i++) {
    const [ax, ay] = corners[i];
    const [bx, by] = corners[(i + 1) % 4];
    minDist = min(minDist, distToSegment(px, py, ax, ay, bx, by));
  }
  return minDist;
}

// distance from point (px,py) to line segment (ax,ay)-(bx,by)
function distToSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax, aby = by - ay;
  const apx = px - ax, apy = py - ay;
  const abLenSq = abx * abx + aby * aby;
  let t = abLenSq > 0 ? (apx * abx + apy * aby) / abLenSq : 0;
  t = constrain(t, 0, 1);
  const closestX = ax + t * abx;
  const closestY = ay + t * aby;
  return dist(px, py, closestX, closestY);
}

// find the nearest hub zone whose perimeter the player is standing next to
// (within PERIMETER_RANGE), in the current world. Used by space bar to enter.
const PERIMETER_RANGE = 40;
function findNearbyHubZone() {
  if (!player) return null;
  const zones = hubZones[currentWorld];
  if (!zones) return null;

  let best = null;
  for (const zone of zones) {
    const d = distToQuadPerimeter(player.x, player.y, zone.quad);
    if (d <= PERIMETER_RANGE && (!best || d < best.dist)) {
      best = { zone, dist: d };
    }
  }
  return best ? best.zone : null;
}

function draw() {
  updateGameClock();

  // START SCREEN
  if (currentWorld === 'start') {
    image(startpage, 0, 0, width, height);
    drawStartScreenControls();
    setHoverCursor(!newFarmConfirm || getNewFarmConfirmButtons().some(b => pointInRect(mouseX, mouseY, b)));
    return; // do NOT draw the home button on start
  }

  // move player (unless an overlay is blocking input)
  if (!showGuide && !questBoardOpen && !mapOpen && player) {
    player.handleMovement();
    checkWorldTransitions();
  }

  if (worldChangeCooldown > 0) worldChangeCooldown--;

  // update chickens and crops in all worlds
  for (let c of chickens) c.update();
  for (let d of ducks) d.update();
  for (let c of cows) c.update();
  for (let p of pigs) p.update();
  for (let row = 0; row < gardenGrid.length; row++) {
    for (let col = 0; col < gardenGrid[row].length; col++) {
      if (gardenGrid[row][col] !== null) gardenGrid[row][col].update();
    }
  }
  
  // remove expired eggs
  for (let i = eggs.length - 1; i >= 0; i--) {
    if (eggs[i].isExpired()) {
      console.log('Egg expired and removed');
      eggs.splice(i, 1);
    }
  }
  
  // remove expired milk
  for (let i = milks.length - 1; i >= 0; i--) {
    if (milks[i].isExpired()) {
      console.log('Milk expired and removed');
      milks.splice(i, 1);
    }
  }
  
  // remove expired bacon
  for (let i = bacons.length - 1; i >= 0; i--) {
    if (bacons[i].isExpired()) {
      console.log('Bacon expired and removed');
      bacons.splice(i, 1);
    }
  }

  updateQuests();
  updateTutorial();
  updateAmbient();
  updateParticles();

  // display world
  if (currentWorld === 'home') {
    image(farmBg, 0, 0, width, height);
    drawQuestBoard();
  } else if (currentWorld === 'leftExtend') {
    image(leftExtendBg, 0, 0, width, height);
  } else if (currentWorld === 'rightExtend') {
    image(rightExtendBg, 0, 0, width, height);
  } else if (currentWorld === 'pigCoop') {
    image(pigCoopBg, 0, 0, width, height);
    for (let p of pigs) p.draw();
    for (let bacon of bacons) bacon.draw();
  } else if (currentWorld === 'cattleCoop') {
    image(cattleCoopBg, 0, 0, width, height);
    for (let c of cows) c.draw();
    for (let milk of milks) milk.draw();
  } else if (currentWorld === 'duckPond') {
    image(duckPondBg, 0, 0, width, height);
    for (let crumb of breadCrumbs) crumb.draw();
    for (let d of ducks) d.draw();
  } else if (currentWorld === 'farmersMarket') {
    image(farmersMarketBg, 0, 0, width, height);
    drawMarketStock();
    drawMarketTradeArea();
  } else if (currentWorld === 'chickenCoop') {
    image(chickenCoopBg, 0, 0, width, height);
    for (let c of chickens) c.draw();
    for (let egg of eggs) egg.draw();
  } else if (currentWorld === 'garden') {
    push();
    drawSeasonTint();
    image(gardenBg, 0, 0, width, height);
    pop();
    drawGardenGrid();
  } else if (currentWorld === 'barn') {
    image(barn, 0, 0, width, height);
    drawBarnStock();
    drawTradeArea();
  }

  drawCloudShadows(); // a passing cloud darkens everything under it

  // draw player character (in any world that has walkable bounds defined)
  if (player && worldBounds[currentWorld]) {
    player.draw();
    drawInteractPrompt();
  }

  // in-the-air layers sit above everything in the world, below the HUD
  drawAmbientMotes();
  drawParticles();

  // Back button (only in sub-worlds) and the zone sign next to it
  drawBackButton();
  drawZoneLabel();
  drawGameClock();
  drawCoinPurse();
  updateHudCursor();
  syncHudButtonStates();
  if (mapOpen) {
    drawFarmMap();
  }
  if (questBoardOpen) {
    drawQuestPanel();
  }
  drawTutorialBanner();
  drawQuestNotice(); // after the panel, so a payout toast isn't dimmed by the overlay
  drawTutorialFlash();
  if (showGuide) {
    drawGuideOverlay();
}
}

// small rotated "flag" sign in the top-left showing the current zone name, so the
// player can tell at a glance where they are - matches the scrapbook sign aesthetic
// of the title/inventory banner in the HTML chrome
const HUB_WORLDS_WITH_BACK = ['cattleCoop', 'duckPond', 'farmersMarket', 'chickenCoop', 'garden', 'barn', 'pigCoop'];

function hasBackButton() {
  return HUB_WORLDS_WITH_BACK.includes(currentWorld);
}

// one rect for both drawing and hit-testing, so the two can never drift apart
function getBackButtonRect() {
  return { x: 12, y: 12, w: 82, h: 30 };
}

// a wooden "< Back" button in the top-left of every hub, in the same plank style as
// the clock and coin purse. Replaces the blue circular arrow, which was the only
// piece of HUD not drawn in the wood-and-parchment language.
function drawBackButton() {
  if (!hasBackButton()) return;
  const r = getBackButtonRect();
  const hovered = pointInRect(mouseX, mouseY, r) && !mapOpen && !questBoardOpen && !showGuide;

  push();
  rectMode(CORNER);
  noStroke();
  fill(58, 36, 21, 220);
  rect(r.x + 3, r.y + 3, r.w, r.h, 6);
  fill(hovered ? color(214, 175, 128) : color(202, 160, 106));
  stroke(58, 36, 21);
  strokeWeight(3);
  rect(r.x, r.y, r.w, r.h, 6);

  // pixel arrow: a 3px-wide shaft with a chunky head, drawn from rects so it stays crisp
  noStroke();
  fill(58, 36, 21);
  const ax = r.x + 12, ay = r.y + r.h / 2;
  rect(ax + 4, ay - 2, 12, 4);        // shaft
  rect(ax + 2, ay - 4, 4, 8);         // head, widest column
  rect(ax, ay - 2, 4, 4);             // tip
  rect(ax + 4, ay - 6, 4, 4);         // upper barb
  rect(ax + 4, ay + 2, 4, 4);         // lower barb

  textAlign(LEFT, CENTER);
  textSize(15);
  textStyle(BOLD);
  text('Back', ax + 22, ay + 1);
  textStyle(NORMAL);
  pop();
}

// hanging wooden sign in the top-left naming the current zone, so the player can
// tell at a glance where they are - same plank as the clock and coin purse
function drawZoneLabel() {
  const label = worldLabels[currentWorld];
  if (!label) return;

  // sits just right of the Back button when one is shown, otherwise hugs the corner
  const signX = hasBackButton() ? getBackButtonRect().x + getBackButtonRect().w + 12 : 12;
  const signY = 12;

  textSize(16);
  textStyle(BOLD);
  const textW = textWidth(label);
  textStyle(NORMAL);
  const padX = 14;
  const signW = textW + padX * 2;
  const signH = 30;

  push();
  rectMode(CORNER);
  noStroke();
  fill(58, 36, 21, 220);
  rect(signX + 3, signY + 3, signW, signH, 6);
  fill(202, 160, 106);
  stroke(58, 36, 21);
  strokeWeight(3);
  rect(signX, signY, signW, signH, 6);

  // two nail heads, like the title sign above the screen
  noStroke();
  fill(58, 36, 21);
  rect(signX + 5, signY + 5, 3, 3);
  rect(signX + signW - 8, signY + 5, 3, 3);

  fill(58, 36, 21);
  textAlign(CENTER, CENTER);
  textSize(16);
  textStyle(BOLD);
  text(label, signX + signW / 2, signY + signH / 2 + 1);
  textStyle(NORMAL);
  pop();
}

// the pointer becomes a hand over anything clickable in the HUD or the trading
// screens. World targets (crops, eggs, animals, zone entrances) are handled by
// drawInteractPrompt(); this covers the rest, and runs after it each frame.
function updateHudCursor() {
  const overlayOpen = mapOpen || questBoardOpen || showGuide;
  let clickable = !overlayOpen && worldTargetHovered;
  worldTargetHovered = false;

  if (!overlayOpen) {
    if (hasBackButton() && pointInRect(mouseX, mouseY, getBackButtonRect())) clickable = true;

    if (currentWorld === 'barn') {
      if (getStockCellRects(barnItems).some(c => pointInRect(mouseX, mouseY, c))) clickable = true;
      if (selectedStockItem && pointInRect(mouseX, mouseY, getBuyButtonRect(tradeRect))) clickable = true;
    } else if (currentWorld === 'farmersMarket') {
      if (marketMode === 'buy' && getStockCellRects(marketItems).some(c => pointInRect(mouseX, mouseY, c))) clickable = true;
      if (getMarketTabRects().some(c => pointInRect(mouseX, mouseY, c))) clickable = true;
      if (marketMode === 'buy' && selectedMarketItem && pointInRect(mouseX, mouseY, getBuyButtonRect(marketTradeRect))) clickable = true;
    }
  } else if (showGuide) {
    if (getTutorialButtons().some(b => pointInRect(mouseX, mouseY, b))) clickable = true;
  }

  setHoverCursor(clickable);
}

// keep the HTML stump buttons' pressed state in step with the overlays, whichever
// way they were opened or closed (button, key, click-to-dismiss)
let hudStateCache = { guide: null, map: null };

function syncHudButtonStates() {
  if (hudStateCache.guide !== showGuide) {
    hudStateCache.guide = showGuide;
    const btn = document.getElementById('guide-button');
    if (btn) btn.setAttribute('aria-pressed', String(showGuide));
  }
  if (hudStateCache.map !== mapOpen) {
    hudStateCache.map = mapOpen;
    const btn = document.getElementById('map-button');
    if (btn) btn.setAttribute('aria-pressed', String(mapOpen));
  }
}

// note: home/guide buttons used to be drawn on the canvas (drawHomeButton(),
// drawGuideIcon(), drawWoodStumpButton()) but were moved to real HTML buttons
// outside the game screen - see #home-button/#guide-button in index.html, their
// CSS in style.css, and the click wiring in setupHudButtons() below.

//instruction overlay
function drawGardenGrid() {
  // quad coordinates
  let x1 = 195, y1 = 150, x2 = 600, y2 = 150, x3 = 600, y3 = 475, x4 = 195, y4 = 475;
  let rows = 6, cols = 8;
  let gapReduction = 1.1;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let t = col / (cols - 1);
      let s = row / (rows - 1);
      // interpolation for position inside quad
      let ax = lerp(x1, x2, t);
      let ay = lerp(y1, y2, t);
      let bx = lerp(x4, x3, t);
      let by = lerp(y4, y3, t);
      let px = lerp(ax, bx, s);
      let py = lerp(ay, by, s);
      // size of each cell
      let cellW = abs(x2 - x1) / cols * gapReduction;
      let cellH = abs(y4 - y1) / rows * gapReduction;
      
      // draw crop if assigned ->  else draw empty cell
      if (gardenGrid[row][col] !== null) {
        let crop = gardenGrid[row][col];
        // update crop position
        crop.x = px - cellW/2;
        crop.y = py - cellH/2;
        crop.w = cellW;
        crop.h = cellH;
        
        // draw the crop 
        crop.draw();
      } else {
        drawEmptyPlot(px - cellW/2, py - cellH/2, cellW, cellH, row, col);
      }
    }
  }
}

// an empty plot is drawn as a faint tilled square so the field visibly has 48
// places to plant, instead of reading as one flat sheet of dirt. While a seed is
// selected the tiles brighten, and the one under the cursor gets an outline: gold
// when the player is close enough to plant, grey when they need to walk over.
function drawEmptyPlot(x, y, w, h, row, col) {
  const inset = 4;
  const seedReady = !!selectedSeed && currentWorld === 'garden';
  const hoveredCell = seedReady ? getGridCoordinates(mouseX, mouseY) : null;
  const hovered = hoveredCell && hoveredCell.row === row && hoveredCell.col === col;

  push();
  rectMode(CORNER);
  noStroke();
  // darker furrow with a lighter top-left edge, like turned soil
  fill(0, 0, 0, seedReady ? 42 : 24);
  rect(x + inset, y + inset, w - inset * 2, h - inset * 2, 3);
  fill(255, 235, 200, seedReady ? 34 : 18);
  rect(x + inset, y + inset, w - inset * 2, 2);
  rect(x + inset, y + inset, 2, h - inset * 2);

  if (hovered) {
    const cell = getCellRect(row, col);
    const near = player && dist(player.x, player.y, cell.cx, cell.cy) <= INTERACT_RANGE;
    noFill();
    stroke(near ? color(255, 210, 90) : color(230, 230, 230, 170));
    strokeWeight(3);
    rect(x + inset - 1, y + inset - 1, w - inset * 2 + 2, h - inset * 2 + 2, 4);
  }
  pop();
}

// ---------------------------------------------------------------------------
// SHARED UI PIECES
//
// The canvas screens borrow the same wood-and-parchment language as the HTML chrome
// around them: a dark frame, a lighter face, an inset well, one warm accent. These
// helpers keep that consistent instead of every panel inventing its own grey box.
// ---------------------------------------------------------------------------

const UI_FRAME  = [58, 36, 21];
const UI_FACE   = [146, 104, 62];
const UI_INSET  = [120, 84, 48];
const UI_WELL   = [92, 62, 34];
const UI_TEXT   = [246, 231, 205];
const UI_MUTED  = [214, 188, 152];
const UI_ACCENT = [255, 210, 90];

// draw an image scaled to FIT its box rather than stretched to fill it, centred.
// Sprites here range from 325x279 to 1200x1200, so forcing them all into a square
// squashed half of them - see ART_DIRECTION.md.
function drawFittedImage(img, x, y, w, h, sx, sy, sw, sh) {
  if (!img || !img.width || !img.height) return;
  const srcW = sw === undefined ? img.width : sw;
  const srcH = sh === undefined ? img.height : sh;
  if (!srcW || !srcH) return;

  const scale = Math.min(w / srcW, h / srcH);
  const dw = srcW * scale, dh = srcH * scale;
  const dx = x + (w - dw) / 2, dy = y + (h - dh) / 2;

  if (sw === undefined) image(img, dx, dy, dw, dh);
  else image(img, dx, dy, dw, dh, sx, sy, sw, sh);
}

// the harvest frame of a crop's 3-frame sheet, or the plain image for everything else
function drawItemArt(itemName, x, y, w, h) {
  const imgIndex = producePaths.findIndex(p => p.includes(itemName));
  if (imgIndex !== -1 && produceImgs[imgIndex]) {
    const sheet = produceImgs[imgIndex];
    const frameW = sheet.width / 3;
    drawFittedImage(sheet, x, y, w, h, frameW * 2, 0, frameW, sheet.height);
    return true;
  }
  const direct = {
    egg: eggImg, milk: milkImg, bacon: baconImg, bread: breadImg, cheese: cheeseImg,
    pie: pieImg, sandwich: sandwichImg, applejam: appleJamImg, carrotcake: carrotCakeImg,
    cow: cowImg, pig: pigImg,
  }[itemName];
  if (direct) {
    drawFittedImage(direct, x, y, w, h);
    return true;
  }
  return false;
}

// the standard framed panel: drop shadow, dark frame, face, inset
function drawWoodPanel(box, title) {
  push();
  rectMode(CORNER);
  noStroke();
  fill(0, 0, 0, 60);
  rect(box.x + 4, box.y + 5, box.w, box.h, 12);
  fill(UI_FRAME[0], UI_FRAME[1], UI_FRAME[2]);
  rect(box.x - 3, box.y - 3, box.w + 6, box.h + 6, 12);
  fill(UI_FACE[0], UI_FACE[1], UI_FACE[2]);
  rect(box.x, box.y, box.w, box.h, 10);
  fill(UI_INSET[0], UI_INSET[1], UI_INSET[2]);
  rect(box.x + 8, box.y + 8, box.w - 16, box.h - 16, 8);

  if (title) {
    noStroke();
    fill(UI_TEXT[0], UI_TEXT[1], UI_TEXT[2]);
    textAlign(CENTER, CENTER);
    textSize(13);
    textStyle(BOLD);
    text(title, box.x + box.w / 2, box.y + 26);
    textStyle(NORMAL);
  }
  pop();
}

// a recessed well for a piece of art, ringed when selected or filled
function drawItemWell(x, y, w, h, opts) {
  const { selected = false, filled = false, hovered = false } = opts || {};
  push();
  rectMode(CORNER);
  noStroke();
  fill(UI_WELL[0], UI_WELL[1], UI_WELL[2], 235);
  rect(x, y, w, h, 7);

  noFill();
  if (selected) {
    stroke(UI_ACCENT[0], UI_ACCENT[1], UI_ACCENT[2]);
    strokeWeight(3);
  } else if (filled) {
    stroke(150, 210, 140);
    strokeWeight(3);
  } else {
    stroke(UI_FRAME[0], UI_FRAME[1], UI_FRAME[2], hovered ? 230 : 150);
    strokeWeight(2);
  }
  rect(x, y, w, h, 7);
  pop();
}

// the name strip across the bottom of a well
function drawItemCaption(label, x, y, w, h) {
  push();
  rectMode(CORNER);
  noStroke();
  fill(UI_FRAME[0], UI_FRAME[1], UI_FRAME[2], 210);
  rect(x + 2, y + h - 19, w - 4, 17, 0, 0, 6, 6);
  fill(UI_TEXT[0], UI_TEXT[1], UI_TEXT[2]);
  textAlign(CENTER, CENTER);
  textSize(w < 70 ? 8 : 9);
  text(label, x + w / 2, y + h - 10);
  pop();
}

// one shared grid for the barn and market catalogues, so the click targets in
// mousePressed() can never drift away from what is drawn
function getStockCellRects(items) {
  const colW = 80, rowH = 80, gapX = 20, gapY = 14;
  const startX = 100, startY = 40;
  return items.map((name, i) => ({
    name,
    x: startX + (i % 2) * (colW + gapX),
    y: startY + Math.floor(i / 2) * (rowH + gapY),
    w: colW,
    h: rowH,
  }));
}

function drawStockGrid(items, selectedName) {
  push();
  for (const cell of getStockCellRects(items)) {
    const selected = selectedName === cell.name;
    const hovered = pointInRect(mouseX, mouseY, cell);
    drawItemWell(cell.x, cell.y, cell.w, cell.h, { selected, hovered });
    drawItemArt(cell.name, cell.x + 5, cell.y + 3, cell.w - 10, cell.h - 22);
    drawItemCaption(itemLabel(cell.name), cell.x, cell.y, cell.w, cell.h);
  }
  pop();
}

// the shared header of a trade panel: the item's art in a well, its name, and a
// line saying what to do next
function drawTradePanelHeader(itemName, box, subtitle) {
  const wellX = box.x + 18, wellY = box.y + 20, wellW = 66, wellH = 72;
  drawItemWell(wellX, wellY, wellW, wellH, {});
  drawItemArt(itemName, wellX + 5, wellY + 5, wellW - 10, wellH - 10);

  push();
  noStroke();
  textAlign(LEFT, CENTER);
  fill(UI_TEXT[0], UI_TEXT[1], UI_TEXT[2]);
  textSize(18);
  textStyle(BOLD);
  text(itemLabel(itemName), wellX + wellW + 14, wellY + 26);
  textStyle(NORMAL);
  fill(UI_MUTED[0], UI_MUTED[1], UI_MUTED[2]);
  textSize(11);
  text(subtitle, wellX + wellW + 14, wellY + 48);
  pop();
}

function drawEmptyTradePanel(box, line) {
  push();
  noStroke();
  textAlign(CENTER, CENTER);
  fill(UI_MUTED[0], UI_MUTED[1], UI_MUTED[2]);
  textSize(15);
  text(line, box.x + box.w / 2, box.y + box.h / 2);
  pop();
}

function drawBarnStock() {
  drawStockGrid(barnItems, selectedStockItem);
}

// ! trade requirements for each item
const tradeRequirements = {
  wheat: { egg: 1 },
  corn: { wheat: 10 },
  carrot: { corn: 5, wheat: 10 },
  radish: { wheat: 5, carrot: 5, corn: 10 },
  apple: { corn: 2, radish: 5, carrot: 10 },
  strawberry: { carrot: 3, apple: 5, radish: 10 },
  pepper: { radish: 4, strawberry: 5, apple: 10 },
  lemon: { pepper: 5, strawberry: 10 },
  peach: { lemon: 5, pepper: 10 },
  grape: { pepper: 3, peach: 5, lemon: 10 },
  pumpkin: { pepper: 3, lemon: 5,grape: 5, peach: 10 }
};

// farmers market trade requirements
const marketTradeRequirements = {
  bread: { wheat: 5 },
  cow: { egg: 25 },
  pig: { wheat: 25 },
  pie: { bread: 2, milk: 3, strawberry: 5 },
  cheese: { milk: 5 },
  sandwich: { bread: 2, egg: 2, bacon: 2, cheese: 1 },
  applejam: { apple: 5 },
  carrotcake: { carrot: 5, egg: 1 }
};

// ingredient slots: tracks which required ingredients have been dragged in for the
// currently selected barn/market item. Keyed by ingredient name -> true once filled.
// Reset whenever the selected item changes or a trade completes.

// ---------------------------------------------------------------------------
// COIN ECONOMY
//
// Pure bartering leaves a thin inventory stuck: carrot needs corn and wheat, corn
// needs wheat, and a new farm only has wheat and eggs. Coins are the way out - sell
// anything you own at the Farmers Market, and buy any barn/market item outright.
//
// Prices are DERIVED from the two recipe tables rather than hand-listed, so editing
// a recipe re-prices everything downstream automatically. Two things to know:
//
//  1. The raw tree value explodes. Each tier needs 5-10 of the tier below, so a
//     pumpkin's raw cost is ~10^9 "eggs". Prices are therefore compressed through a
//     power curve, which keeps them human (3 to ~7000) while preserving the order.
//  2. Because of that compression, crafting something and selling it nets less than
//     selling its ingredients. That's deliberate: it means there is no buy-craft-sell
//     money loop. Growing crops is the intended income - seeds multiply, coins don't.
//
// Buying is always priced above the coin value of the ingredients you'd otherwise
// hand over, so bartering stays the cheaper route and coins are the convenient one.
// ---------------------------------------------------------------------------

// the three things no recipe produces - you collect them from animals, so they
// anchor the whole price tree
const BASE_ITEM_VALUES = { egg: 1, milk: 2, bacon: 3 };

const CRAFT_MARGIN   = 1.15; // a crafted item is worth a little more than its parts
const PRICE_SCALE    = 3;    // coins for the cheapest item
const PRICE_COMPRESS = 0.38; // power curve that tames the exponential recipe tree
const BUY_MARKUP     = 3;    // buying costs this much more than selling...
const BUY_PREMIUM    = 1.25; // ...and never less than this over the ingredient value

const rawValueCache = {};

// what an item is "worth" in raw egg-equivalents, walking the recipe tree
function rawItemValue(itemName, seen) {
  if (BASE_ITEM_VALUES[itemName] !== undefined) return BASE_ITEM_VALUES[itemName];
  if (rawValueCache[itemName] !== undefined) return rawValueCache[itemName];

  seen = seen || new Set();
  if (seen.has(itemName)) return 1; // cyclic recipe: bail rather than recurse forever
  seen.add(itemName);

  const recipe = tradeRequirements[itemName] || marketTradeRequirements[itemName];
  if (!recipe) return 1; // something with no recipe and no base value

  let total = 0;
  for (const [ingredient, qty] of Object.entries(recipe)) {
    total += qty * rawItemValue(ingredient, seen);
  }
  return (rawValueCache[itemName] = total * CRAFT_MARGIN);
}

// what the market pays you for one of these. The recipe tree sets the tier; the
// crop's own value trait tilts it within that tier, so fast crops pay less than
// their position suggests and slow ones pay more.
function sellPrice(itemName) {
  const base = PRICE_SCALE * Math.pow(rawItemValue(itemName), PRICE_COMPRESS);
  return Math.max(1, Math.round(base * cropTraits(itemName).value));
}

// what the ingredients for one of these would fetch if you sold them instead
function ingredientCoinValue(itemName) {
  const recipe = tradeRequirements[itemName] || marketTradeRequirements[itemName];
  if (!recipe) return 0;
  return Object.entries(recipe)
    .reduce((total, [ingredient, qty]) => total + qty * sellPrice(ingredient), 0);
}

// what it costs to skip the bartering and just buy one
function buyPrice(itemName) {
  return Math.max(Math.ceil(sellPrice(itemName) * BUY_MARKUP),
                  Math.ceil(ingredientCoinValue(itemName) * BUY_PREMIUM));
}

// only the goods that have an inventory slot can be sold - this keeps livestock
// (cow/pig, which become animals rather than stock) out of the sell box
function isSellable(itemName) {
  return INVENTORY_CATEGORIES.some(category => category.items.includes(itemName))
      && typeof inventory[itemName] === 'number';
}

// anything either trade table can produce is buyable for coins
function isBuyable(itemName) {
  return !!(tradeRequirements[itemName] || marketTradeRequirements[itemName]);
}

function addCoins(amount) {
  coins = Math.max(0, coins + amount);
}

// sell one of `itemName` at the market
function sellOneItem(itemName) {
  if (!isSellable(itemName) || inventory[itemName] <= 0) {
    console.log(`nothing to sell: ${itemName}`);
    return false;
  }
  const price = sellPrice(itemName);
  inventory[itemName]--;
  addCoins(price);
  questStats.sold++;
  if (itemName === selectedSeed && inventory[itemName] <= 0) selectedSeed = null;

  lastSale = { text: `Sold 1 ${itemLabel(itemName)} for ${price} coins`, at: millis() };
  playSfx('trade');
  updateInventoryDisplay();
  saveInventory();
  console.log(`Sold 1 ${itemName} for ${price} coins (balance: ${coins})`);
  return true;
}

// buy one of `itemName` outright, bypassing its ingredient slots
function buyItemWithCoins(itemName) {
  if (!isBuyable(itemName)) return false;

  const price = buyPrice(itemName);
  if (coins < price) {
    lastSale = { text: `Need ${price - coins} more coins`, at: millis() };
    console.log(`not enough coins for ${itemName}: have ${coins}, need ${price}`);
    return false;
  }

  addCoins(-price);
  lastSale = { text: `Bought 1 ${itemLabel(itemName)} for ${price} coins`, at: millis() };

  // hand off to the same grant-the-output path a completed barter uses, so buying a
  // cow still puts a cow in the coop
  if (currentWorld === 'barn') executeBarnTrade();
  else executeMarketTrade();

  console.log(`Bought 1 ${itemName} for ${price} coins (balance: ${coins})`);
  return true;
}

// ---- coin HUD --------------------------------------------------------------

function drawCoinPurse() {
  const w = 116, h = 30;
  const x = width - w - 14, y = 12;

  push();
  rectMode(CORNER);
  noStroke();
  fill(58, 36, 21, 220);
  rect(x + 3, y + 3, w, h, 6);
  fill(202, 160, 106);
  stroke(58, 36, 21);
  strokeWeight(3);
  rect(x, y, w, h, 6);

  // coin
  noStroke();
  fill(240, 196, 60);
  ellipse(x + 20, y + h / 2, 18, 18);
  fill(198, 150, 30);
  ellipse(x + 20, y + h / 2, 11, 11);

  fill(58, 36, 21);
  textAlign(LEFT, CENTER);
  textSize(15);
  textStyle(BOLD);
  text(coins, x + 36, y + h / 2 + 1);
  textStyle(NORMAL);
  pop();
}

// ---- market buy/sell tabs --------------------------------------------------

function getMarketTabRects() {
  const box = marketTradeRect;
  const h = 32, gap = 6;
  const w = (box.w - gap) / 2;
  const y = box.y - h - 8;
  return [
    { mode: 'buy',  label: 'BUY',  x: box.x,             y, w, h },
    { mode: 'sell', label: 'SELL', x: box.x + w + gap,   y, w, h },
  ];
}

function drawMarketModeTabs() {
  push();
  rectMode(CORNER);
  textAlign(CENTER, CENTER);
  textSize(13);
  for (const tab of getMarketTabRects()) {
    const active = marketMode === tab.mode;
    const hovered = !active && pointInRect(mouseX, mouseY, tab);
    noStroke();
    fill(UI_FRAME[0], UI_FRAME[1], UI_FRAME[2], 190);
    rect(tab.x + 2, tab.y + 3, tab.w, tab.h, 7);
    fill(active ? color(UI_ACCENT[0], UI_ACCENT[1], UI_ACCENT[2])
                : color(UI_FACE[0], UI_FACE[1], UI_FACE[2], hovered ? 255 : 210));
    rect(tab.x, tab.y, tab.w, tab.h, 7);
    noFill();
    stroke(UI_FRAME[0], UI_FRAME[1], UI_FRAME[2]);
    strokeWeight(2);
    rect(tab.x, tab.y, tab.w, tab.h, 7);

    noStroke();
    fill(active ? color(UI_FRAME[0], UI_FRAME[1], UI_FRAME[2])
                : color(UI_TEXT[0], UI_TEXT[1], UI_TEXT[2]));
    textStyle(active ? BOLD : NORMAL);
    text(tab.label, tab.x + tab.w / 2, tab.y + tab.h / 2 + 1);
    textStyle(NORMAL);
  }
  pop();
}

// ---- sell panel ------------------------------------------------------------

function getSellDropBox() {
  const box = marketTradeRect;
  return { x: box.x + 14, y: box.y + 46, w: box.w - 28, h: 108 };
}

function drawSellPanel() {
  const box = marketTradeRect;
  const drop = getSellDropBox();
  const armed = isDragging && draggedItem && isSellable(draggedItem);

  push();
  rectMode(CORNER);
  textAlign(CENTER, CENTER);

  noStroke();
  fill(UI_TEXT[0], UI_TEXT[1], UI_TEXT[2]);
  textSize(15);
  textStyle(BOLD);
  text('Sell anything', box.x + box.w / 2, box.y + 28);
  textStyle(NORMAL);

  // the drop target, lit up while something sellable is dragged over it
  noStroke();
  fill(armed ? color(96, 148, 88, 235) : color(UI_WELL[0], UI_WELL[1], UI_WELL[2], 235));
  rect(drop.x, drop.y, drop.w, drop.h, 8);
  noFill();
  stroke(armed ? color(176, 226, 160) : color(UI_FRAME[0], UI_FRAME[1], UI_FRAME[2], 150));
  strokeWeight(armed ? 3 : 2);
  rect(drop.x, drop.y, drop.w, drop.h, 8);

  noStroke();
  if (armed) {
    fill(UI_TEXT[0], UI_TEXT[1], UI_TEXT[2]);
    textSize(13);
    text(`Drop to sell 1 ${itemLabel(draggedItem)}`, drop.x + drop.w / 2, drop.y + drop.h / 2 - 12);
    fill(UI_ACCENT[0], UI_ACCENT[1], UI_ACCENT[2]);
    textSize(17);
    textStyle(BOLD);
    text(`+${sellPrice(draggedItem)} coins`, drop.x + drop.w / 2, drop.y + drop.h / 2 + 14);
    textStyle(NORMAL);
  } else {
    fill(UI_TEXT[0], UI_TEXT[1], UI_TEXT[2]);
    textSize(13);
    text('Drag an item here', drop.x + drop.w / 2, drop.y + drop.h / 2 - 10);
    fill(UI_MUTED[0], UI_MUTED[1], UI_MUTED[2]);
    textSize(11);
    text('from your satchel', drop.x + drop.w / 2, drop.y + drop.h / 2 + 10);
    text('hover an item to see its price', drop.x + drop.w / 2, drop.y + drop.h / 2 + 26);
  }
  pop();
}

// short-lived confirmation under the trade box, shared by selling and buying
const SALE_MESSAGE_MS = 2600;

function drawSaleMessage() {
  if (!lastSale) return;
  if (millis() - lastSale.at > SALE_MESSAGE_MS) {
    lastSale = null;
    return;
  }
  const box = currentWorld === 'barn' ? tradeRect : marketTradeRect;
  push();
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(13);
  fill(255, 215, 0);
  text(lastSale.text, box.x + box.w / 2, box.y + box.h + 62);
  pop();
}

// ---- "buy for N coins" button ----------------------------------------------

function getBuyButtonRect(box) {
  return { x: box.x, y: box.y + box.h + 10, w: box.w, h: 32 };
}

function drawBuyButton(itemName, box) {
  if (!itemName || !isBuyable(itemName)) return;

  const rect_ = getBuyButtonRect(box);
  const price = buyPrice(itemName);
  const affordable = coins >= price;
  const hovered = affordable && pointInRect(mouseX, mouseY, rect_);

  push();
  rectMode(CORNER);
  noStroke();
  fill(58, 36, 21, 200);
  rect(rect_.x + 2, rect_.y + 2, rect_.w, rect_.h, 6);
  if (affordable) fill(hovered ? color(120, 180, 100) : color(90, 150, 80));
  else fill(70, 70, 70);
  rect(rect_.x, rect_.y, rect_.w, rect_.h, 6);
  noFill();
  stroke(affordable ? color(180, 230, 160) : color(120));
  strokeWeight(2);
  rect(rect_.x, rect_.y, rect_.w, rect_.h, 6);

  noStroke();
  fill(affordable ? 255 : 160);
  textAlign(CENTER, CENTER);
  textSize(14);
  text(`Buy for ${price} coins`, rect_.x + rect_.w / 2, rect_.y + rect_.h / 2 + 1);

  if (!affordable) {
    fill(200, 120, 120);
    textSize(11);
    text(`you have ${coins}`, rect_.x + rect_.w / 2, rect_.y + rect_.h + 12);
  }
  pop();
}

function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// click handling for the buy button / market tabs, called from mousePressed()
function handleEconomyClick(mx, my) {
  if (currentWorld === 'farmersMarket') {
    for (const tab of getMarketTabRects()) {
      if (pointInRect(mx, my, tab)) {
        marketMode = tab.mode;
        lastSale = null;
        console.log(`market mode: ${marketMode}`);
        return true;
      }
    }
  }

  const box = currentWorld === 'barn' ? tradeRect : marketTradeRect;
  const selected = currentWorld === 'barn' ? selectedStockItem : selectedMarketItem;
  const buyingAllowed = currentWorld === 'barn' || marketMode === 'buy';

  if (buyingAllowed && selected && pointInRect(mx, my, getBuyButtonRect(box))) {
    buyItemWithCoins(selected);
    return true;
  }

  return false;
}

// drop handling for the sell box, called from handleCanvasDrop()
function trySellDrop(canvasX, canvasY) {
  if (currentWorld !== 'farmersMarket' || marketMode !== 'sell') return false;
  if (!draggedItem || !pointInRect(canvasX, canvasY, getSellDropBox())) return false;

  if (!isSellable(draggedItem)) {
    lastSale = { text: `${itemLabel(draggedItem)} can't be sold here`, at: millis() };
    return true;
  }
  sellOneItem(draggedItem);
  return true;
}


let filledSlots = {};

// lays out one square slot per ingredient in `requirements`, left-to-right, inside
// the given trade box. Shared by barn and farmers market since both boxes are the
// same size (tradeRect/marketTradeRect are both { x:500, y:200, w:250, h:220 }).
function getIngredientSlotRects(requirements, box) {
  const names = Object.keys(requirements);
  const gap = 10;
  const padding = 15;
  // shrink the slots to fit the panel rather than running past its right edge -
  // sandwich needs four of them, which at the old fixed 70px overflowed the box
  const available = box.w - padding * 2 - gap * (names.length - 1);
  const slotSize = Math.min(70, available / Math.max(1, names.length));
  const startX = box.x + padding;
  const startY = box.y + 110;
  return names.map((name, i) => ({
    name,
    x: startX + i * (slotSize + gap),
    y: startY,
    w: slotSize,
    h: slotSize,
  }));
}

// true once every ingredient required for `itemName` has a filled slot
function areAllSlotsFilled(itemName, requirements) {
  return Object.keys(requirements).every(name => filledSlots[name]);
}

function drawTradeArea() {
  drawWoodPanel(tradeRect);

  if (selectedStockItem && tradeRequirements[selectedStockItem]) {
    drawTradePanelHeader(selectedStockItem, tradeRect, 'Fill every slot to trade');
    drawIngredientSlots(tradeRequirements[selectedStockItem], tradeRect);
    drawBuyButton(selectedStockItem, tradeRect);   // ...or skip the bartering
  } else {
    drawEmptyTradePanel(tradeRect, 'Pick something to make');
  }

  drawSaleMessage();
}

// draws one slot per required ingredient: icon + qty when empty, filled highlight
// + checkmark when that ingredient has been dragged in. Shared by barn and market.
function drawIngredientSlots(requirements, box) {
  const slots = getIngredientSlotRects(requirements, box);
  push();
  textAlign(CENTER, CENTER);
  for (const slot of slots) {
    const filled = !!filledSlots[slot.name];
    const captionH = Math.min(18, slot.h * 0.34);

    drawItemWell(slot.x, slot.y, slot.w, slot.h, { filled });
    drawItemArt(slot.name, slot.x + 4, slot.y + 3, slot.w - 8, slot.h - captionH - 4);

    noStroke();
    rectMode(CORNER);
    fill(UI_FRAME[0], UI_FRAME[1], UI_FRAME[2], 210);
    rect(slot.x + 2, slot.y + slot.h - captionH - 1, slot.w - 4, captionH, 0, 0, 6, 6);

    fill(filled ? color(176, 226, 160) : color(UI_TEXT[0], UI_TEXT[1], UI_TEXT[2]));
    textSize(slot.w < 60 ? 9 : 10);
    text(`${requirements[slot.name]} ${itemLabel(slot.name)}`,
         slot.x + slot.w / 2, slot.y + slot.h - captionH / 2 - 1);

    if (filled) {
      // a soft wash over the art, and the tick as a badge in the corner. Drawn across
      // the art it was pale wheat on pale wheat and vanished.
      noStroke();
      fill(120, 200, 110, 60);
      rect(slot.x + 2, slot.y + 2, slot.w - 4, slot.h - 4, 6);

      const bx = slot.x + slot.w - 12, by = slot.y + 12;
      fill(58, 36, 21);
      ellipse(bx, by, 20, 20);
      fill(126, 196, 112);
      ellipse(bx, by, 16, 16);
      fill(255);
      textSize(11);
      textStyle(BOLD);
      text('\u2713', bx, by + 1);
      textStyle(NORMAL);
    }
  }
  pop();
}

function drawMarketStock() {
  // in sell mode the buy catalogue is inert - dim it so it reads as disabled
  push();
  if (marketMode === 'sell') drawingContext.globalAlpha = 0.3;
  drawStockGrid(marketItems, marketMode === 'sell' ? null : selectedMarketItem);
  pop();
}

function drawMarketTradeArea() {
  // BUY / SELL tabs sit above the panel; both modes share the same frame
  drawMarketModeTabs();
  drawWoodPanel(marketTradeRect);

  if (marketMode === 'sell') {
    drawSellPanel();
    drawSaleMessage();
    return;
  }

  if (selectedMarketItem && marketTradeRequirements[selectedMarketItem]) {
    drawTradePanelHeader(selectedMarketItem, marketTradeRect, 'Fill every slot to trade');
    drawIngredientSlots(marketTradeRequirements[selectedMarketItem], marketTradeRect);
    drawBuyButton(selectedMarketItem, marketTradeRect);
  } else {
    drawEmptyTradePanel(marketTradeRect, 'Pick something to buy');
  }

  drawSaleMessage();
}

// find the nearest collectible/harvestable thing to the player in the current world
// returns { type, item, dist } or null if nothing is in range
// ---------------------------------------------------------------------------
// TUTORIAL
//
// Six steps that a first-time player completes by actually doing the thing, not by
// clicking Next. Each step reads a counter that already exists - questStats, the
// current world, distance walked - and ticks itself off when that counter moves.
//
// A step's target is captured the moment it becomes current, so a returning player
// with fifty eggs in the bag still has to collect one more to clear that step.
//
// The overlay is a card you read and dismiss; while it's closed a slim banner keeps
// the current objective on screen. `showGuide` still means "the overlay is open",
// so movement blocking and the guide button carry on working unchanged. Once the
// tutorial is finished the same overlay becomes a read-only checklist, which is
// what the guide button reopens.
// ---------------------------------------------------------------------------

let tutorialActive = false;
let tutorialStep = 0;
let hasSeenTutorial = false;
let tutorialBaseline = 0;        // the step's counter value when it became current
let tutorialDoneFlash = null;    // { text, at } - brief tick when a step clears

// small trackers the tutorial needs that nothing else counts
let tutorialWalked = 0;          // pixels walked, for the "move around" step
let tutorialVisited = {};        // worlds entered since the game loaded

const TUTORIAL_STEPS = [
  {
    id: 'move',
    title: 'Find your feet',
    body: 'Walk around with the arrow keys. Everything else is the mouse: you click what you want to act on.',
    goal: 'Walk a little way',
    target: 140,
    count: () => tutorialWalked,
  },
  {
    id: 'garden',
    title: 'Step into the Garden',
    body: 'Fenced areas are doorways. Walk up to the garden fence south of Home and click it to go in.',
    goal: 'Enter the Garden',
    target: 1,
    count: () => (tutorialVisited.garden ? 1 : 0),
  },
  {
    id: 'plant',
    title: 'Plant something',
    body: 'Click a seed in your satchel to select it, then click an empty plot. New plots start dry, so click it again to water it - nothing grows until you do.',
    goal: 'Plant a seed',
    target: 1,
    count: () => questStats.planted,
  },
  {
    id: 'harvest',
    title: 'Bring in a crop',
    body: 'Keep it watered and it will grow through three stages. Click it once it is ripe to harvest it.',
    goal: 'Harvest a crop',
    target: 1,
    count: totalHarvested,
  },
  {
    id: 'egg',
    title: 'Collect an egg',
    body: 'Head back to Home and into the Chicken Coop. Eggs appear under the hens - click one to pick it up before it spoils.',
    goal: 'Collect an egg',
    target: 1,
    count: () => questStats.collected.egg || 0,
  },
  {
    id: 'trade',
    title: 'Make a trade',
    body: 'In the Barn, click an item you want, then drag each ingredient from your satchel into its slot. Short on ingredients? Buy it with coins instead.',
    goal: 'Complete a trade',
    target: 1,
    count: () => questStats.trades,
  },
];

function currentTutorialStep() {
  return TUTORIAL_STEPS[tutorialStep] || null;
}

// progress on the current step, measured from where it started
function tutorialStepProgress() {
  const step = currentTutorialStep();
  if (!step) return 0;
  return constrain(step.count() - tutorialBaseline, 0, step.target);
}

function beginTutorialStep(index) {
  tutorialStep = index;
  const step = currentTutorialStep();
  tutorialBaseline = step ? step.count() : 0;
}

function startTutorial(fromScratch) {
  tutorialActive = true;
  tutorialWalked = 0;
  if (fromScratch) beginTutorialStep(0);
  else beginTutorialStep(constrain(tutorialStep, 0, TUTORIAL_STEPS.length - 1));
  showGuide = true;
}

function finishTutorial(skipped) {
  tutorialActive = false;
  hasSeenTutorial = true;
  showGuide = false;
  tutorialDoneFlash = {
    text: skipped ? 'Tutorial skipped - reopen it any time with the book' : 'Tutorial complete. Nice work.',
    at: millis(),
  };
  saveInventory();
  console.log(skipped ? 'Tutorial skipped' : 'Tutorial complete');
}

// checked every frame while the tutorial is running
function updateTutorial() {
  if (!tutorialActive) return;
  const step = currentTutorialStep();
  if (!step) return;
  if (tutorialStepProgress() < step.target) return;

  playSfx('collect');
  console.log(`Tutorial step done: ${step.goal}`);

  if (tutorialStep + 1 >= TUTORIAL_STEPS.length) {
    finishTutorial(false);
    showGuide = true; // the final card explains that it's done
    return;
  }

  tutorialDoneFlash = { text: `${step.goal} \u2713`, at: millis() };
  beginTutorialStep(tutorialStep + 1);
  saveInventory();
}

// ---- the overlay -----------------------------------------------------------

function getTutorialPanel() {
  const w = 470, h = tutorialActive ? 268 : 322;
  return { x: (width - w) / 2, y: (height - h) / 2 - 20, w, h };
}

function getTutorialButtons() {
  const box = getTutorialPanel();
  const h = 34, gap = 12;
  const y = box.y + box.h - h - 18;
  if (!tutorialActive) {
    return [{ id: 'close', label: 'Close', x: box.x + box.w / 2 - 70, y, w: 140, h }];
  }
  const w = (box.w - 48 - gap) / 2;
  return [
    { id: 'gotit', label: 'Got it', x: box.x + 24, y, w, h },
    { id: 'skip', label: 'Skip tutorial', x: box.x + 24 + w + gap, y, w, h },
  ];
}

// replaces the old static guide image: the live tutorial card while it's running,
// a read-only checklist once it's done
function drawGuideOverlay() {
  const box = getTutorialPanel();

  push();
  rectMode(CORNER);
  noStroke();
  fill(0, 180);
  rect(0, 0, width, height);

  fill(58, 36, 21);
  rect(box.x - 4, box.y - 4, box.w + 8, box.h + 8, 12);
  fill(146, 104, 62);
  rect(box.x, box.y, box.w, box.h, 10);
  fill(120, 84, 48);
  rect(box.x + 12, box.y + 12, box.w - 24, box.h - 24, 8);

  if (tutorialActive) drawTutorialStepCard(box);
  else drawTutorialChecklist(box);

  for (const button of getTutorialButtons()) {
    const hovered = pointInRect(mouseX, mouseY, button);
    noStroke();
    fill(58, 36, 21, 190);
    rect(button.x + 2, button.y + 2, button.w, button.h, 6);
    fill(button.id === 'skip' ? color(104, 78, 52) : (hovered ? color(120, 180, 100) : color(90, 150, 80)));
    rect(button.x, button.y, button.w, button.h, 6);
    noFill();
    stroke(button.id === 'skip' ? color(150, 122, 90) : color(180, 230, 160));
    strokeWeight(2);
    rect(button.x, button.y, button.w, button.h, 6);
    noStroke();
    fill(246, 231, 205);
    textAlign(CENTER, CENTER);
    textSize(13);
    text(button.label, button.x + button.w / 2, button.y + button.h / 2 + 1);
  }
  pop();
}

function drawTutorialStepCard(box) {
  const step = currentTutorialStep();
  if (!step) return;

  noStroke();
  fill(232, 210, 175);
  textAlign(LEFT, CENTER);
  textSize(11);
  text(`GETTING STARTED  \u00b7  STEP ${tutorialStep + 1} OF ${TUTORIAL_STEPS.length}`, box.x + 26, box.y + 36);

  // step dots
  const dotY = box.y + 36;
  for (let i = 0; i < TUTORIAL_STEPS.length; i++) {
    const dx = box.x + box.w - 26 - (TUTORIAL_STEPS.length - 1 - i) * 16;
    noStroke();
    if (i < tutorialStep) fill(140, 195, 110);
    else if (i === tutorialStep) fill(255, 210, 90);
    else fill(92, 62, 34);
    ellipse(dx, dotY, 9, 9);
  }

  fill(246, 231, 205);
  textAlign(LEFT, TOP);
  textSize(20);
  textStyle(BOLD);
  text(step.title, box.x + 26, box.y + 56);
  textStyle(NORMAL);

  textSize(13);
  fill(238, 220, 192);
  text(step.body, box.x + 26, box.y + 92, box.w - 52);

  // objective line with its own progress
  const have = tutorialStepProgress();
  const barY = box.y + box.h - 96;
  noStroke();
  fill(92, 62, 34, 170);
  rect(box.x + 24, barY, box.w - 48, 34, 6);
  fill(255, 210, 90);
  textAlign(LEFT, CENTER);
  textSize(13);
  text(step.goal, box.x + 38, barY + 17);
  fill(232, 210, 175);
  textAlign(RIGHT, CENTER);
  textSize(12);
  text(step.target > 1 ? `${Math.floor(have)} / ${step.target}` : (have >= step.target ? 'done' : 'not yet'),
       box.x + box.w - 38, barY + 17);
}

function drawTutorialChecklist(box) {
  noStroke();
  fill(246, 231, 205);
  textAlign(CENTER, CENTER);
  textSize(20);
  textStyle(BOLD);
  text('Getting Started', box.x + box.w / 2, box.y + 40);
  textStyle(NORMAL);
  textSize(12);
  fill(232, 210, 175);
  text('Arrow keys move. Mouse does everything else.', box.x + box.w / 2, box.y + 62);

  let y = box.y + 86;
  textAlign(LEFT, CENTER);
  for (const step of TUTORIAL_STEPS) {
    noStroke();
    fill(140, 195, 110);
    textSize(14);
    text('\u2713', box.x + 30, y + 8);
    fill(238, 220, 192);
    textSize(13);
    text(step.goal, box.x + 50, y + 8);
    y += 24;
  }

  fill(202, 160, 106);
  textAlign(CENTER, CENTER);
  textSize(11);
  text('M opens the farm map  \u00b7  the board in Home lists your goals',
       box.x + box.w / 2, box.y + box.h - 78);
}

// slim reminder of the current objective while the card is dismissed
function drawTutorialBanner() {
  if (!tutorialActive || showGuide) return;
  const step = currentTutorialStep();
  if (!step) return;

  const label = `Step ${tutorialStep + 1}/${TUTORIAL_STEPS.length}  \u00b7  ${step.goal}`;
  push();
  rectMode(CENTER);
  noStroke();
  textSize(13);
  const w = textWidth(label) + 40;
  fill(58, 36, 21, 225);
  rect(width / 2, 96, w, 28, 8);
  noFill();
  stroke(202, 160, 106);
  strokeWeight(2);
  rect(width / 2, 96, w, 28, 8);
  noStroke();
  fill(246, 231, 205);
  textAlign(CENTER, CENTER);
  text(label, width / 2, 97);
  pop();
}

const TUTORIAL_FLASH_MS = 2800;

function drawTutorialFlash() {
  if (!tutorialDoneFlash) return;
  if (millis() - tutorialDoneFlash.at > TUTORIAL_FLASH_MS) {
    tutorialDoneFlash = null;
    return;
  }
  push();
  rectMode(CENTER);
  noStroke();
  textSize(14);
  const w = textWidth(tutorialDoneFlash.text) + 36;
  fill(58, 36, 21, 230);
  rect(width / 2, 130, w, 30, 8);
  noFill();
  stroke(140, 195, 110);
  strokeWeight(2);
  rect(width / 2, 130, w, 30, 8);
  noStroke();
  fill(190, 235, 165);
  textAlign(CENTER, CENTER);
  text(tutorialDoneFlash.text, width / 2, 131);
  pop();
}

// click handling for the overlay's buttons, called from mousePressed()
function handleTutorialClick(mx, my) {
  if (!showGuide) return false;
  for (const button of getTutorialButtons()) {
    if (!pointInRect(mx, my, button)) continue;
    if (button.id === 'skip') finishTutorial(true);
    else showGuide = false;   // "Got it" and "Close" both just dismiss the card
    return true;
  }
  // a click anywhere else on the overlay dismisses it too
  showGuide = false;
  return true;
}

// ---------------------------------------------------------------------------
// FARM MAP
//
// A node diagram of the whole farm, built from worldLabels, edgeTransitions and
// hubZones at draw time. Nothing about the layout is hand-placed: add a hub zone or
// a new edge transition and it shows up here on its own.
//
// The shape falls out of the two kinds of connection the game already has:
//   - edgeTransitions link the overworld areas left-to-right, so those become a
//     horizontal spine, ordered by walking the 'left' links to the far end and then
//     following 'right' back across
//   - hubZones are the fenced sub-worlds you step into, so each hangs beneath the
//     area it's entered from
//
// It's a reference, not a fast-travel menu: clicking a node doesn't take you there,
// because walking between areas is the whole navigation model.
// ---------------------------------------------------------------------------

let mapOpen = false;

// the overworld areas, in left-to-right order, derived from edgeTransitions
function mapSpineOrder() {
  const links = {}; // world -> { left: world, right: world }
  for (const [from, edges] of Object.entries(edgeTransitions)) {
    links[from] = links[from] || {};
    for (const edge of edges) links[from][edge.side] = edge.destination;
  }

  const worlds = Object.keys(links);
  if (!worlds.length) return [];

  // start anywhere, walk left until there's no further left, then sweep right
  let leftmost = worlds[0];
  const guard = new Set([leftmost]);
  while (links[leftmost] && links[leftmost].left && !guard.has(links[leftmost].left)) {
    leftmost = links[leftmost].left;
    guard.add(leftmost);
  }

  const order = [leftmost];
  const seen = new Set(order);
  let cursor = leftmost;
  while (links[cursor] && links[cursor].right && !seen.has(links[cursor].right)) {
    cursor = links[cursor].right;
    order.push(cursor);
    seen.add(cursor);
  }
  return order;
}

// the full node/edge model: spine areas across the top, their hub zones beneath
function buildFarmMap(box) {
  const spine = mapSpineOrder();
  const childrenOf = {};
  for (const world of spine) {
    childrenOf[world] = (hubZones[world] || []).map(zone => zone.destination);
  }

  // any world that is neither on the spine nor a child of one still gets a place,
  // so nothing silently vanishes from the map
  const placed = new Set([...spine, ...Object.values(childrenOf).flat()]);
  const orphans = Object.keys(worldLabels).filter(w => !placed.has(w));

  // columns are weighted by how many children each spine area has
  const weights = spine.map(w => Math.max(1, childrenOf[w].length));
  const totalWeight = weights.reduce((a, b) => a + b, 0) + (orphans.length ? 1 : 0);

  const nodes = [];
  const links = [];
  const nodeH = 34;
  const spineY = box.y + 74;
  const childY = spineY + 96;
  const usable = box.w - 48;

  // nodes are sized to the tightest column so a busy area (Home has three hub
  // zones) can't overlap its neighbours. Labels wrap to two lines to suit.
  const columnWidths = weights.map(wt => (wt / totalWeight) * usable);
  const tightestStep = Math.min(...spine.map((world, i) =>
    columnWidths[i] / Math.max(1, childrenOf[world].length)));
  const nodeW = constrain(tightestStep - 10, 62, 104);

  let cursorX = box.x + 24;
  spine.forEach((world, i) => {
    const colW = columnWidths[i];
    const centerX = cursorX + colW / 2;
    nodes.push({ world, x: centerX, y: spineY, w: nodeW, h: nodeH, kind: 'area' });

    const kids = childrenOf[world];
    kids.forEach((child, j) => {
      const step = colW / kids.length;
      const kx = cursorX + step * (j + 0.5);
      nodes.push({ world: child, x: kx, y: childY, w: nodeW, h: nodeH, kind: 'zone' });
      links.push({ from: world, to: child, kind: 'enter' });
    });

    if (i > 0) links.push({ from: spine[i - 1], to: world, kind: 'walk' });
    cursorX += colW;
  });

  if (orphans.length) {
    const colW = (1 / totalWeight) * usable;
    orphans.forEach((world, j) => {
      nodes.push({ world, x: cursorX + colW / 2, y: childY + (j * (nodeH + 10)),
                   w: nodeW, h: nodeH, kind: 'zone' });
    });
  }

  const byWorld = {};
  for (const node of nodes) byWorld[node.world] = node;
  return { nodes, links, byWorld };
}

function drawFarmMap() {
  const box = { x: 50, y: 90, w: width - 100, h: 0 };

  // lay out once to find how deep the diagram actually is, then size the panel to
  // it and lay out again - otherwise the panel is mostly empty space, and it would
  // stop fitting if a hub zone were added
  const probe = buildFarmMap(box);
  const depth = probe.nodes.reduce((lowest, n) => Math.max(lowest, n.y + n.h / 2), box.y);
  box.h = (depth - box.y) + 86;          // room for the legend and close hint
  box.y = Math.max(70, (height - box.h) / 2);

  const map = buildFarmMap(box);

  push();
  rectMode(CORNER);
  noStroke();
  fill(0, 180);
  rect(0, 0, width, height);

  // panel
  fill(58, 36, 21);
  rect(box.x - 4, box.y - 4, box.w + 8, box.h + 8, 12);
  fill(146, 104, 62);
  rect(box.x, box.y, box.w, box.h, 10);
  fill(120, 84, 48);
  rect(box.x + 12, box.y + 12, box.w - 24, box.h - 24, 8);

  fill(246, 231, 205);
  textAlign(CENTER, CENTER);
  textSize(20);
  textStyle(BOLD);
  text('Farm Map', box.x + box.w / 2, box.y + 38);
  textStyle(NORMAL);

  // links first, so nodes sit on top of them
  for (const link of map.links) {
    const a = map.byWorld[link.from];
    const b = map.byWorld[link.to];
    if (!a || !b) continue;

    if (link.kind === 'walk') {
      stroke(214, 186, 140);
      strokeWeight(3);
      line(a.x + a.w / 2, a.y, b.x - b.w / 2, b.y);
      // little double arrow: these cross by walking either way
      noStroke();
      fill(214, 186, 140);
      const midX = (a.x + a.w / 2 + b.x - b.w / 2) / 2;
      triangle(midX - 9, a.y - 4, midX - 9, a.y + 4, midX - 15, a.y);
      triangle(midX + 9, a.y - 4, midX + 9, a.y + 4, midX + 15, a.y);
    } else {
      stroke(176, 142, 100);
      strokeWeight(2);
      line(a.x, a.y + a.h / 2, b.x, b.y - b.h / 2);
    }
  }

  // nodes
  for (const node of map.nodes) {
    const here = node.world === currentWorld;
    push();
    rectMode(CENTER);
    noStroke();
    fill(0, 0, 0, 60);
    rect(node.x + 2, node.y + 3, node.w, node.h, 6);

    if (here) fill(255, 210, 90);
    else if (node.kind === 'area') fill(104, 72, 42);
    else fill(92, 62, 34);
    rect(node.x, node.y, node.w, node.h, 6);

    noFill();
    stroke(here ? color(255, 255, 210) : color(176, 142, 100));
    strokeWeight(here ? 3 : 1.5);
    rect(node.x, node.y, node.w, node.h, 6);

    noStroke();
    fill(here ? color(58, 36, 21) : color(246, 231, 205));
    textAlign(CENTER, CENTER);
    if (here) textStyle(BOLD);
    drawMapNodeLabel(worldLabels[node.world] || node.world, node.x, node.y,
                     node.w - 10, node.kind === 'area' ? 13 : 11);
    textStyle(NORMAL);
    pop();
  }

  // legend + close hint
  const legendY = box.y + box.h - 46;
  push();
  textAlign(LEFT, CENTER);
  textSize(11);
  noStroke();
  fill(232, 210, 175);
  stroke(214, 186, 140);
  strokeWeight(3);
  line(box.x + 30, legendY, box.x + 58, legendY);
  noStroke();
  fill(232, 210, 175);
  text('walk between', box.x + 66, legendY);

  stroke(176, 142, 100);
  strokeWeight(2);
  line(box.x + 172, legendY - 8, box.x + 172, legendY + 8);
  noStroke();
  text('step inside', box.x + 182, legendY);

  fill(255, 210, 90);
  rectMode(CENTER);
  rect(box.x + 280, legendY, 14, 12, 3);
  fill(232, 210, 175);
  textAlign(LEFT, CENTER);
  text('you are here', box.x + 294, legendY);
  pop();

  fill(232, 210, 175);
  textAlign(CENTER, CENTER);
  textSize(12);
  text('Click anywhere or press M to close', box.x + box.w / 2, box.y + box.h - 20);
  pop();
}

// fit a world name inside its node: one line if it fits, otherwise split at the
// space that best balances the two halves, shrinking the type as a last resort
function drawMapNodeLabel(label, x, y, maxW, size) {
  textSize(size);
  if (textWidth(label) <= maxW) {
    text(label, x, y + 1);
    return;
  }

  const words = label.split(' ');
  if (words.length > 1) {
    let best = null;
    for (let i = 1; i < words.length; i++) {
      const top = words.slice(0, i).join(' ');
      const bottom = words.slice(i).join(' ');
      const widest = Math.max(textWidth(top), textWidth(bottom));
      if (!best || widest < best.widest) best = { top, bottom, widest };
    }
    let lineSize = size;
    while (best.widest > maxW && lineSize > 8) {
      lineSize -= 1;
      textSize(lineSize);
      best.widest = Math.max(textWidth(best.top), textWidth(best.bottom));
    }
    text(best.top, x, y - 7);
    text(best.bottom, x, y + 7);
    return;
  }

  // single long word: shrink until it fits
  let lineSize = size;
  while (textWidth(label) > maxW && lineSize > 8) {
    lineSize -= 1;
    textSize(lineSize);
  }
  text(label, x, y + 1);
}

function toggleFarmMap() {
  mapOpen = !mapOpen;
  if (mapOpen) {
    questBoardOpen = false;
    showGuide = false;
  }
  const btn = document.getElementById('map-button');
  if (btn) btn.setAttribute('aria-pressed', String(mapOpen));
}

// ---------------------------------------------------------------------------
// QUEST BOARD
//
// Three goals at a time on a board in Home: walk up, click it, see what's on the
// list. Finish one and it pays out in coins and a fresh goal takes its place.
//
// Goals read from questStats, a set of lifetime counters bumped at the points where
// things already happen (the interaction dispatcher, the trade functions, selling).
// Inventory counts alone can't carry this: they go DOWN when you spend, so "harvest
// 5 crops" would un-complete itself the moment you traded them away.
//
// Each active goal stores the counter value it started from, so a goal handed to a
// player who already has 40 eggs still asks for ten more rather than arriving done.
// ---------------------------------------------------------------------------

const ACTIVE_QUEST_COUNT = 3;

// lifetime tallies - only ever increase, persisted with the save
let questStats = {
  harvested: {},  // per crop
  collected: {},  // egg / milk / bacon
  made: {},       // per item produced by a barn or market trade
  planted: 0,
  watered: 0,
  fed: 0,
  trades: 0,
  sold: 0,
};

let activeQuests = [];     // [{ id, baseline }]
let questsCompleted = 0;
let questBoardOpen = false;
let questNotice = null;    // { text, at } - "goal complete" toast, any world

function totalHarvested() {
  return Object.values(questStats.harvested).reduce((a, b) => a + b, 0);
}
function totalCollected() {
  return Object.values(questStats.collected).reduce((a, b) => a + b, 0);
}

// The goal catalogue. `count` reads a lifetime tally; the board subtracts the value
// it held when the goal was handed out.
const QUEST_POOL = [
  { id: 'collect-eggs',    text: 'Collect 10 eggs',              target: 10, reward: 40,  count: () => questStats.collected.egg || 0 },
  { id: 'collect-milk',    text: 'Collect 3 milk',               target: 3,  reward: 35,  count: () => questStats.collected.milk || 0 },
  { id: 'collect-bacon',   text: 'Collect 3 bacon',              target: 3,  reward: 40,  count: () => questStats.collected.bacon || 0 },
  { id: 'collect-any',     text: 'Collect 15 animal products',   target: 15, reward: 60,  count: totalCollected },
  { id: 'plant-seeds',     text: 'Plant 6 seeds',                target: 6,  reward: 30,  count: () => questStats.planted },
  { id: 'water-crops',     text: 'Water 8 crops',                target: 8,  reward: 30,  count: () => questStats.watered },
  { id: 'feed-animals',    text: 'Feed 5 animals',               target: 5,  reward: 35,  count: () => questStats.fed },
  { id: 'harvest-any',     text: 'Harvest 5 crops',              target: 5,  reward: 45,  count: totalHarvested },
  { id: 'harvest-carrot',  text: 'Harvest 3 carrots',            target: 3,  reward: 55,  count: () => questStats.harvested.carrot || 0 },
  { id: 'harvest-apple',   text: 'Harvest 2 apples',             target: 2,  reward: 90,  count: () => questStats.harvested.apple || 0 },
  { id: 'harvest-pumpkin', text: 'Harvest a pumpkin',            target: 1,  reward: 250, count: () => questStats.harvested.pumpkin || 0 },
  { id: 'trade-any',       text: 'Complete 2 trades',            target: 2,  reward: 60,  count: () => questStats.trades },
  { id: 'make-bread',      text: 'Get 2 bread from the market',  target: 2,  reward: 45,  count: () => questStats.made.bread || 0 },
  { id: 'make-cheese',     text: 'Get 1 cheese from the market', target: 1,  reward: 45,  count: () => questStats.made.cheese || 0 },
  { id: 'sell-goods',      text: 'Sell 5 goods at the market',   target: 5,  reward: 35,  count: () => questStats.sold },
];

function questById(id) {
  return QUEST_POOL.find(q => q.id === id);
}

function questProgress(active) {
  const def = questById(active.id);
  if (!def) return 0;
  return constrain(def.count() - active.baseline, 0, def.target);
}

function isQuestComplete(active) {
  const def = questById(active.id);
  return !!def && questProgress(active) >= def.target;
}

// hand out a goal that isn't already on the board, preferring ones not seen recently
function drawNewQuest() {
  const onBoard = new Set(activeQuests.map(q => q.id));
  const candidates = QUEST_POOL.filter(q => !onBoard.has(q.id));
  if (!candidates.length) return null;
  const def = candidates[Math.floor(random(candidates.length))];
  return { id: def.id, baseline: def.count() };
}

// top up the board to ACTIVE_QUEST_COUNT - called at startup and after a completion
function refillQuests() {
  while (activeQuests.length < ACTIVE_QUEST_COUNT) {
    const next = drawNewQuest();
    if (!next) break;
    activeQuests.push(next);
  }
}

// checked every frame: cheap, and it means a goal pays out the instant it's met
// wherever the player happens to be
function updateQuests() {
  for (let i = activeQuests.length - 1; i >= 0; i--) {
    const active = activeQuests[i];
    if (!isQuestComplete(active)) continue;

    const def = questById(active.id);
    activeQuests.splice(i, 1);
    questsCompleted++;
    addCoins(def.reward);
    questNotice = { text: `Goal complete: ${def.text}  +${def.reward} coins`, at: millis() };
    playSfx('trade');
    console.log(`Quest complete: ${def.text} (+${def.reward} coins)`);

    refillQuests();
    saveInventory();
  }
}

// ---- the board in Home -----------------------------------------------------

// on the grass to the right of the garden fence, clear of the pond in farm.png and
// of every hub-zone quad, so the player can walk right up to it
const QUEST_BOARD = { x: 600, y: 430, w: 84, h: 70 };

function questBoardCenter() {
  return { x: QUEST_BOARD.x + QUEST_BOARD.w / 2, y: QUEST_BOARD.y + QUEST_BOARD.h / 2 };
}

function drawQuestBoard() {
  const b = QUEST_BOARD;
  push();
  rectMode(CORNER);
  noStroke();

  // posts
  fill(94, 64, 38);
  rect(b.x + 12, b.y + b.h - 6, 8, 26, 2);
  rect(b.x + b.w - 20, b.y + b.h - 6, 8, 26, 2);

  // board
  fill(58, 36, 21);
  rect(b.x - 3, b.y - 3, b.w + 6, b.h + 6, 5);
  fill(146, 104, 62);
  rect(b.x, b.y, b.w, b.h, 4);

  // pinned notes
  fill(242, 232, 205);
  const done = activeQuests.length === 0;
  for (let i = 0; i < Math.max(1, activeQuests.length); i++) {
    const nx = b.x + 8 + (i % 2) * 38;
    const ny = b.y + 8 + Math.floor(i / 2) * 30;
    push();
    translate(nx + 16, ny + 11);
    rotate(radians(i === 1 ? 4 : -3));
    rect(-16, -11, 32, 22, 2);
    fill(120, 95, 60);
    rect(-11, -6, 22, 2);
    rect(-11, -1, 18, 2);
    rect(-11, 4, 20, 2);
    fill(242, 232, 205);
    pop();
  }

  // label
  noStroke();
  fill(58, 36, 21, 200);
  rectMode(CENTER);
  rect(b.x + b.w / 2, b.y - 14, 74, 16, 4);
  fill(246, 231, 205);
  textAlign(CENTER, CENTER);
  textSize(10);
  text(done ? 'ALL DONE' : 'GOALS', b.x + b.w / 2, b.y - 13);
  pop();
}

// ---- the panel -------------------------------------------------------------

function drawQuestPanel() {
  const w = 520, h = 330;
  const x = (width - w) / 2, y = (height - h) / 2;

  push();
  rectMode(CORNER);
  noStroke();
  fill(0, 170);
  rect(0, 0, width, height);

  fill(58, 36, 21);
  rect(x - 4, y - 4, w + 8, h + 8, 12);
  fill(146, 104, 62);
  rect(x, y, w, h, 10);
  fill(120, 84, 48);
  rect(x + 12, y + 12, w - 24, h - 24, 8);

  fill(246, 231, 205);
  textAlign(CENTER, CENTER);
  textSize(22);
  textStyle(BOLD);
  text('Farm Goals', x + w / 2, y + 40);
  textStyle(NORMAL);
  textSize(12);
  fill(232, 210, 175);
  text(`${questsCompleted} completed  |  ${coins} coins`, x + w / 2, y + 62);

  // one row per active goal
  const rowH = 64;
  const rowX = x + 30, rowW = w - 60;
  let rowY = y + 84;

  if (!activeQuests.length) {
    textAlign(CENTER, CENTER);
    textSize(14);
    fill(246, 231, 205);
    text('Every goal on the board is done. Nice farming.', x + w / 2, y + h / 2);
  }

  for (const active of activeQuests) {
    const def = questById(active.id);
    if (!def) continue;
    const have = questProgress(active);
    const frac = constrain(have / def.target, 0, 1);

    noStroke();
    fill(92, 62, 34, 170);
    rect(rowX, rowY, rowW, rowH - 10, 6);

    fill(246, 231, 205);
    textAlign(LEFT, CENTER);
    textSize(15);
    text(def.text, rowX + 14, rowY + 17);

    textAlign(RIGHT, CENTER);
    fill(255, 215, 0);
    textSize(13);
    text(`+${def.reward} coins`, rowX + rowW - 14, rowY + 17);

    // progress bar
    const barX = rowX + 14, barY = rowY + 32, barW = rowW - 28, barH = 12;
    noStroke();
    fill(58, 36, 21, 200);
    rect(barX, barY, barW, barH, 6);
    fill(130, 190, 105);
    if (frac > 0) rect(barX, barY, Math.max(barH, barW * frac), barH, 6);

    fill(246, 231, 205);
    textAlign(LEFT, CENTER);
    textSize(11);
    text(`${have} / ${def.target}`, barX + 6, barY + barH / 2 + 1);

    rowY += rowH;
  }

  fill(232, 210, 175);
  textAlign(CENTER, CENTER);
  textSize(12);
  text('Click anywhere to close', x + w / 2, y + h - 22);
  pop();
}

// brief "goal complete" toast, shown in whatever world the player is standing in
const QUEST_NOTICE_MS = 3600;

function drawQuestNotice() {
  if (!questNotice) return;
  if (millis() - questNotice.at > QUEST_NOTICE_MS) {
    questNotice = null;
    return;
  }

  push();
  rectMode(CENTER);
  noStroke();
  textSize(14);
  const w = textWidth(questNotice.text) + 34;
  fill(58, 36, 21, 230);
  rect(width / 2, 62, w, 30, 8);
  noFill();
  stroke(255, 215, 0);
  strokeWeight(2);
  rect(width / 2, 62, w, 30, 8);
  noStroke();
  fill(255, 231, 150);
  textAlign(CENTER, CENTER);
  text(questNotice.text, width / 2, 63);
  pop();
}

// ---------------------------------------------------------------------------
// INTERACTION TARGETING
//
// Mouse click is the primary way to act on something (movement stays on the arrow
// keys, targeting and using things is mouse-driven). Space is a convenience
// shortcut that acts on whatever happens to be nearest.
//
//   findTargetAtPoint(x, y)    -> the specific thing under the cursor   (mouse)
//   findNearestInteractable()  -> the closest thing to the player       (space)
//   performInteraction(target) -> executes it, whichever finder found it
//
// Both finders return the same target shape:
//   { type: 'egg' | 'milk' | 'bacon' | 'crop' | 'plant' | 'zone', item, inRange }
// performInteraction() is the single dispatcher for acting on a target - any new
// interaction (energy cost, watering, quests, animal feeding) belongs there, so it
// works with both input methods without being wired up twice.
// ---------------------------------------------------------------------------

// extra pixels of slack around a sprite so small things stay easy to click
const CLICK_PADDING = 6;

// which collectible list, if any, belongs to a world
function collectiblesForWorld(world) {
  if (world === 'chickenCoop') return { type: 'egg',   list: eggs };
  if (world === 'cattleCoop')  return { type: 'milk',  list: milks };
  if (world === 'pigCoop')     return { type: 'bacon', list: bacons };
  return null;
}

// on-screen rect of a garden cell - mirrors drawGardenGrid()'s quad math so the
// clickable area lines up with what's actually drawn
function getCellRect(row, col) {
  const x1 = 195, y1 = 150, x2 = 600, y2 = 150, x3 = 600, y3 = 475, x4 = 195, y4 = 475;
  const rows = 6, cols = 8;
  const gapReduction = 1.1;

  const t = col / (cols - 1);
  const s = row / (rows - 1);
  const ax = lerp(x1, x2, t), ay = lerp(y1, y2, t);
  const bx = lerp(x4, x3, t), by = lerp(y4, y3, t);
  const cx = lerp(ax, bx, s), cy = lerp(ay, by, s);
  const w = abs(x2 - x1) / cols * gapReduction;
  const h = abs(y4 - y1) / rows * gapReduction;

  return { x: cx - w / 2, y: cy - h / 2, w, h, cx, cy };
}

// is the player standing close enough to act on this target?
// (INTERACT_RANGE for items/crops/plots, PERIMETER_RANGE for hub zones)
function isTargetInRange(target) {
  if (!player || !target) return false;

  if (target.type === 'zone') {
    return distToQuadPerimeter(player.x, player.y, target.item.quad) <= PERIMETER_RANGE;
  }
  if (target.type === 'feed') {
    const c = animalCenter(target.item);
    return dist(player.x, player.y, c.x, c.y) <= INTERACT_RANGE;
  }
  if (target.type === 'quests') {
    const c = questBoardCenter();
    return dist(player.x, player.y, c.x, c.y) <= INTERACT_RANGE;
  }
  if (target.type === 'crop' || target.type === 'water' || target.type === 'clear') {
    const crop = target.item.crop;
    return dist(player.x, player.y, crop.x + crop.w / 2, crop.y + crop.h / 2) <= INTERACT_RANGE;
  }
  if (target.type === 'plant') {
    const cell = getCellRect(target.item.row, target.item.col);
    return dist(player.x, player.y, cell.cx, cell.cy) <= INTERACT_RANGE;
  }
  return dist(player.x, player.y, target.item.x, target.item.y) <= INTERACT_RANGE;
}

function withRange(target) {
  target.inRange = isTargetInRange(target);
  return target;
}

// MOUSE (primary): what is under (x, y)?
// Returns a target whether or not the player is close enough - the caller reads
// target.inRange, so an out-of-reach click can say "too far" instead of silently
// doing nothing. Same priority order as the space bar: collectibles/crops, then an
// empty plot to plant in, then hub-zone entrances.
function findTargetAtPoint(x, y) {
  if (!player) return null;

  const collectible = collectiblesForWorld(currentWorld);
  if (collectible) {
    // back to front, since later items are drawn on top of earlier ones
    for (let i = collectible.list.length - 1; i >= 0; i--) {
      const item = collectible.list[i];
      if (dist(x, y, item.x, item.y) <= item.size / 2 + CLICK_PADDING) {
        return withRange({ type: collectible.type, item });
      }
    }
  }

  // animals, checked after the collectibles above so a dropped egg sitting on a
  // chicken is still picked up rather than feeding the bird
  const herd = animalsForWorld(currentWorld);
  if (herd) {
    for (let i = herd.length - 1; i >= 0; i--) {
      const animal = herd[i];
      if (x >= animal.x && x <= animal.x + animal.size &&
          y >= animal.y && y <= animal.y + animal.size) {
        return withRange({ type: 'feed', item: animal });
      }
    }
  }

  if (currentWorld === 'garden') {
    for (let row = 0; row < gardenGrid.length; row++) {
      for (let col = 0; col < gardenGrid[row].length; col++) {
        const crop = gardenGrid[row][col];
        if (crop === null) continue;
        if (x >= crop.x - CLICK_PADDING && x <= crop.x + crop.w + CLICK_PADDING &&
            y >= crop.y - CLICK_PADDING && y <= crop.y + crop.h + CLICK_PADDING) {
          const type = cropTargetType(crop);
          if (!type) continue; // growing along fine with water in the soil
          return withRange({ type, item: { crop, row, col } });
        }
      }
    }

    // empty plot while a seed is selected in the inventory -> plant it there
    if (selectedSeed) {
      const cell = getGridCoordinates(x, y);
      if (cell && gardenGrid[cell.row][cell.col] === null) {
        return withRange({ type: 'plant', item: cell });
      }
    }
  }

  if (currentWorld === 'home' &&
      pointInRect(x, y, { x: QUEST_BOARD.x - CLICK_PADDING, y: QUEST_BOARD.y - CLICK_PADDING,
                          w: QUEST_BOARD.w + CLICK_PADDING * 2, h: QUEST_BOARD.h + CLICK_PADDING * 2 })) {
    return withRange({ type: 'quests', item: QUEST_BOARD });
  }

  const zones = hubZones[currentWorld];
  if (zones) {
    for (const zone of zones) {
      const [x1, y1, x2, y2, x3, y3, x4, y4] = zone.quad;
      if (isPointInQuad(x, y, x1, y1, x2, y2, x3, y3, x4, y4) ||
          distToQuadPerimeter(x, y, zone.quad) <= CLICK_PADDING) {
        return withRange({ type: 'zone', item: zone });
      }
    }
  }

  return null;
}

// what (if anything) a planted crop wants from the player right now. Clearing a
// dead plant comes first, then harvesting, then watering - the same order the space
// bar walks, so mouse and keyboard always agree.
function cropTargetType(crop) {
  if (crop.withered) return 'clear';
  if (crop.isHarvestable()) return 'crop';
  if (crop.needsWater()) return 'water';
  return null;
}

// SPACE (fallback): the nearest thing to the player, ignoring where the mouse is.
// Anything it returns is in range by construction.
function findNearestInteractable() {
  if (!player) return null;
  let best = null;

  function consider(type, item, x, y) {
    const d = dist(player.x, player.y, x, y);
    if (d <= INTERACT_RANGE && (!best || d < best.dist)) {
      best = { type, item, dist: d, inRange: true };
    }
  }

  const collectible = collectiblesForWorld(currentWorld);
  if (collectible) {
    for (const item of collectible.list) consider(collectible.type, item, item.x, item.y);
  } else if (currentWorld === 'garden') {
    // withered first, then harvestable, then thirsty - so a ripe crop is never
    // shadowed by a neighbour that merely wants water
    for (const wanted of ['clear', 'crop', 'water']) {
      for (let row = 0; row < gardenGrid.length; row++) {
        for (let col = 0; col < gardenGrid[row].length; col++) {
          const crop = gardenGrid[row][col];
          if (crop !== null && cropTargetType(crop) === wanted) {
            consider(wanted, { crop, row, col }, crop.x + crop.w / 2, crop.y + crop.h / 2);
          }
        }
      }
      if (best) break;
    }
  }

  // animals are only considered once nothing collectible is in reach
  if (!best) {
    const herd = animalsForWorld(currentWorld);
    if (herd) {
      for (const animal of herd) {
        const c = animalCenter(animal);
        consider('feed', animal, c.x, c.y);
      }
    }
  }

  if (best) return best;

  if (selectedSeed) {
    const cell = findPlantableGridCell();
    if (cell) return { type: 'plant', item: cell, dist: 0, inRange: true };
  }

  if (currentWorld === 'home') {
    const c = questBoardCenter();
    if (dist(player.x, player.y, c.x, c.y) <= INTERACT_RANGE) {
      return { type: 'quests', item: QUEST_BOARD, dist: 0, inRange: true };
    }
  }

  const zone = findNearbyHubZone();
  if (zone) return { type: 'zone', item: zone, dist: 0, inRange: true };

  return null;
}

// short name for a target, for logs and messages
function describeTarget(target) {
  if (!target) return 'that';
  switch (target.type) {
    case 'crop':
    case 'water':
    case 'clear': return target.item.crop.itemName;
    case 'plant': return `${selectedSeed} seed`;
    case 'zone':   return target.item.label;
    case 'feed':   return target.item.kind;
    case 'quests': return 'goal board';
    default:       return target.type;
  }
}

// hint text - mouse first, space noted as the shortcut
function promptLabelFor(target) {
  switch (target.type) {
    case 'egg':
    case 'milk':
    case 'bacon': return `Click to collect ${target.type}`;
    case 'crop':  return `Click to harvest ${itemLabel(target.item.crop.itemName)}`;
    case 'water': return `Click to water ${itemLabel(target.item.crop.itemName)}`;
    case 'clear': return `Click to clear withered ${itemLabel(target.item.crop.itemName)}`;
    case 'plant':
      return canPlantInSeason(selectedSeed)
        ? `Click to plant ${itemLabel(selectedSeed)}`
        : `Wrong season for ${itemLabel(selectedSeed)} (${cropSeasons(selectedSeed).join(', ')} only)`;
    case 'zone':  return `Click to enter ${target.item.label}`;
    case 'quests': return 'Click to read the goal board';
    case 'feed': {
      const a = target.item;
      const name = a.kind.charAt(0).toUpperCase() + a.kind.slice(1);
      if (a.happiness >= 99.5) return `${name} is full`;
      // square brackets, so the cost doesn't nest inside the "(or SPACE)" suffix
      return FEED_COST > 0
        ? `Click to feed ${name} [${FEED_COST} ${itemLabel(FEED_ITEM)}]`
        : `Click to feed ${name}`;
    }
    default:      return 'Click to interact';
  }
}

// THE DISPATCHER - every interaction runs through here, whether a mouse click or
// the space bar picked the target. New interactions hook in here.
function performInteraction(target) {
  if (!target) return false;

  if (!target.inRange) {
    console.log(`${describeTarget(target)} is out of reach - walk closer`);
    return false;
  }

  const success = applyInteraction(target);

  // visible feedback: a brief scale-up on the player for anything that worked.
  // Entering a hub zone is skipped - the world swaps on the same frame, so the
  // pop would never be seen.
  if (success && player && target.type !== 'zone') player.triggerPop();

  return success;
}

// the actual effects of each interaction type, split out so performInteraction()
// stays the one place that handles range, feedback, and anything else that should
// apply to every action
function applyInteraction(target) {
  switch (target.type) {
    case 'egg':
    case 'milk':
    case 'bacon': {
      const lists = { egg: eggs, milk: milks, bacon: bacons };
      const list = lists[target.type];
      const index = list.indexOf(target.item);
      if (index === -1) return false; // already picked up / expired this frame
      const spot = { x: target.item.x, y: target.item.y };
      list.splice(index, 1);
      inventory[target.type]++;
      questStats.collected[target.type] = (questStats.collected[target.type] || 0) + 1;
      spawnBurst(spot.x, spot.y, 'sparkle');
      updateInventoryDisplay();
      playSfx('collect');
      console.log(`Collected ${target.type}`);
      return true;
    }

    case 'crop': {
      const { crop, row, col } = target.item;
      if (!crop.harvest()) return false;
      if (inventory[crop.itemName] !== undefined) {
        inventory[crop.itemName] += 3;
        console.log(`Harvested ${crop.itemName} (+3) to inventory. New count: ${inventory[crop.itemName]}`);
        updateInventoryDisplay();
      }
      questStats.harvested[crop.itemName] = (questStats.harvested[crop.itemName] || 0) + 1;
      spawnBurst(crop.x + crop.w / 2, crop.y + crop.h / 2, 'leaf');
      gardenGrid[row][col] = null;
      saveInventory();
      return true;
    }

    case 'water': {
      const { crop } = target.item;
      if (!crop.water()) return false;
      questStats.watered++;
      playSfx('water');
      console.log(`Watered ${crop.itemName}`);
      return true;
    }

    case 'clear': {
      const { crop, row, col } = target.item;
      gardenGrid[row][col] = null; // no yield - the crop was lost
      playSfx('wither');
      console.log(`Cleared withered ${crop.itemName} - no yield`);
      saveInventory();
      return true;
    }

    case 'feed':
      return feedAnimal(target.item);

    case 'quests':
      questBoardOpen = true;
      console.log('Opened the goal board');
      return true;

    case 'plant':
      return plantSeedAt(target.item.row, target.item.col);

    case 'zone': {
      const zone = target.item;
      const bounds = worldBounds[zone.destination];
      const centerX = bounds ? (bounds.minX + bounds.maxX) / 2 : undefined;
      const centerY = bounds ? (bounds.minY + bounds.maxY) / 2 : undefined;
      changeWorld(zone.destination, centerX, centerY);
      console.log(`Entered ${zone.label}`);
      return true;
    }
  }

  return false;
}

// hint bubble above the player. It follows the mouse: if the cursor is over a
// target, that target is outlined and described, otherwise it falls back to
// whatever the space bar would act on.
// The floating label over the player is for things the player hasn't learned yet, or
// for something the click won't do. Once the tutorial is behind them, "Click to enter
// Garden" is noise on every approach - the hand cursor and the glow already say it.
// These still speak up: out of reach, wrong season, and what feeding costs.
function promptIsWorthShowing(target) {
  if (!target) return false;
  if (!target.inRange) return true;
  if (target.type === 'feed') return true;
  if (target.type === 'plant' && selectedSeed && !canPlantInSeason(selectedSeed)) return true;
  return tutorialActive || !hasSeenTutorial;
}

function drawInteractPrompt() {
  if (!player) return;

  const hovered = findTargetAtPoint(mouseX, mouseY);
  worldTargetHovered = !!(hovered && hovered.inRange); // updateHudCursor() reads this

  if (hovered) {
    drawTargetHighlight(hovered);
    if (promptIsWorthShowing(hovered)) {
      drawPromptBubble(hovered.inRange
        ? promptLabelFor(hovered)
        : `Too far - walk closer to that ${describeTarget(hovered)}`);
    }
    return;
  }

  const nearest = findNearestInteractable();
  if (nearest && promptIsWorthShowing(nearest)) {
    drawPromptBubble(`${promptLabelFor(nearest)} (or SPACE)`);
  }
}

// outline whatever the cursor is over, so it is obvious what a click will act on
// A soft glow behind whatever the cursor is over, instead of a hard outline box.
// The old version drew a rectangle around the target - around a whole hub-zone quad
// that meant a grey or yellow box across half the screen. Out-of-reach targets get
// nothing at all, and neither do hub zones: the cursor is the affordance there.
function drawTargetHighlight(target) {
  if (!target || !target.inRange) return;
  if (target.type === 'zone') return;

  let cx, cy, r;
  if (target.type === 'quests') {
    const c = questBoardCenter();
    cx = c.x; cy = c.y; r = QUEST_BOARD.w * 0.8;
  } else if (target.type === 'feed') {
    const c = animalCenter(target.item);
    cx = c.x; cy = c.y; r = target.item.size * 0.8;
  } else if (target.type === 'crop' || target.type === 'water' || target.type === 'clear') {
    const crop = target.item.crop;
    cx = crop.x + crop.w / 2; cy = crop.y + crop.h / 2; r = Math.max(crop.w, crop.h) * 0.9;
  } else if (target.type === 'plant') {
    const cell = getCellRect(target.item.row, target.item.col);
    cx = cell.cx; cy = cell.cy; r = Math.max(cell.w, cell.h) * 0.9;
  } else {
    cx = target.item.x; cy = target.item.y; r = (target.item.size || 30) * 1.1;
  }

  const pulse = 0.78 + 0.22 * sin(frameCount * 0.11);
  push();
  noStroke();
  ellipseMode(CENTER);
  for (let ring = 3; ring >= 1; ring--) {
    fill(255, 228, 150, (34 / ring) * pulse);
    ellipse(cx, cy, r * (1 + ring * 0.26), r * (1 + ring * 0.26));
  }
  pop();
}

// swap the pointer over anything clickable, the way a web page would. This carries
// most of the weight now that the hover outline is gone.
let hoverCursorOn = null;
let worldTargetHovered = false; // set by drawInteractPrompt() each frame, read by updateHudCursor()

function setHoverCursor(clickable) {
  if (clickable === hoverCursorOn) return;
  hoverCursorOn = clickable;
  cursor(clickable ? HAND : ARROW);
}

function drawPromptBubble(label) {
  push();
  noStroke();
  textSize(13);
  const w = Math.max(130, textWidth(label) + 24);

  // sits just above the hat, and stays inside the screen near the top edge
  const by = Math.max(24, player.y - player.size - 16);
  const bx = constrain(player.x, w / 2 + 4, width - w / 2 - 4);

  fill(35, 22, 12, 210);
  rectMode(CENTER);
  rect(bx, by, w, 24, 4);
  noFill();
  stroke(202, 160, 106, 180);
  strokeWeight(1);
  rect(bx, by, w - 4, 20, 3);

  noStroke();
  fill(246, 231, 205);
  textAlign(CENTER, CENTER);
  text(label, bx, by + 1);
  pop();
}

// garden grid layout (mirrors the quad/cell math used elsewhere for the garden) -
// finds which empty grid cell, if any, the player is currently standing on/near
function findPlantableGridCell() {
  if (!player || currentWorld !== 'garden') return null;

  const gridCoords = getGridCoordinates(player.x, player.y);
  if (!gridCoords) return null;
  if (gardenGrid[gridCoords.row][gridCoords.col] !== null) return null;

  return gridCoords;
}

// plants selectedSeed at the given grid cell, mirroring the math previously used
// by the drag-and-drop drop handler
function plantSeedAt(row, col) {
  const itemIndex = producePaths.findIndex(path => path.includes(selectedSeed));
  if (itemIndex === -1) return false;

  // out-of-season crops refuse loudly rather than doing nothing
  if (!canPlantInSeason(selectedSeed)) {
    const seasons = cropSeasons(selectedSeed).join(' or ');
    questNotice = {
      text: `${itemLabel(selectedSeed)} only grows in ${seasons} - it's ${currentSeason()}`,
      at: millis(),
    };
    console.log(`cannot plant ${selectedSeed} in ${currentSeason()}`);
    return false;
  }

  let x1 = 150, y1 = 150, x2 = 630, y2 = 150, x3 = 630, y3 = 515, x4 = 150, y4 = 515;
  let rows = 6, cols = 8;

  let t = col / (cols - 1);
  let s = row / (rows - 1);
  let ax = lerp(x1, x2, t);
  let ay = lerp(y1, y2, t);
  let bx = lerp(x4, x3, t);
  let by = lerp(y4, y3, t);
  let px = lerp(ax, bx, s);
  let py = lerp(ay, by, s);
  let cellW = abs(x2 - x1) / cols;
  let cellH = abs(y4 - y1) / rows;

  const crop = new Crop(
    produceImgs[itemIndex],
    selectedSeed,
    px - cellW / 2,
    py - cellH / 2,
    cellW,
    cellH
  );

  gardenGrid[row][col] = crop;
  questStats.planted++;
  inventory[selectedSeed]--;
  console.log(`Planted ${selectedSeed} at (${row},${col})`);
  playSfx('plant');

  if (inventory[selectedSeed] <= 0) selectedSeed = null; // auto-deselect once out of seeds
  updateInventoryDisplay();
  saveInventory();
  return true;
}

// space bar: convenience shortcut - acts on whatever is nearest to the player.
// Clicking a specific target with the mouse is the primary path (see mousePressed()
// -> findTargetAtPoint()); both end up in performInteraction().
function interact() {
  const target = findNearestInteractable();
  if (!target) {
    console.log('Nothing in range to interact with');
    return false;
  }
  return performInteraction(target);
}

// leave the current hub for the world it was entered from. Shared by the on-screen
// Back button (mousePressed) and the Escape key (keyPressed). Returns false when
// there is nowhere to go back to.
function goBack() {
  if (currentWorld === 'start' || currentWorld === 'home') return false;
  if (!previousWorld || previousWorld === 'start') return false;

  console.log(`Navigating back to ${previousWorld}`);
  // spawn at the center of the world being returned to, rather than reusing the
  // player's in-hub x/y - that raw position can land inside that hub's own fence
  // quad in the parent world, leaving the player stuck unable to move.
  const target = previousWorld;
  const bounds = worldBounds[target];
  const centerX = bounds ? (bounds.minX + bounds.maxX) / 2 : undefined;
  const centerY = bounds ? (bounds.minY + bounds.maxY) / 2 : undefined;
  changeWorld(target, centerX, centerY);
  previousWorld = null; // clear history after going back
  return true;
}

// the start screen's click, shared with Enter/Space so keyboard players can begin
function startGame() {
  // drop back into the world the save left off in, standing where you stood
  const resume = restoredWorld();
  const spot = (restoredState && restoredState.player) || {};
  changeWorld(resume, spot.x, spot.y);
  // a first-time player is walked through the basics; everyone else just plays.
  // The saved step decides fresh-vs-resume, so this doesn't depend on anything
  // setup() may or may not have done first.
  if (!hasSeenTutorial) startTutorial(tutorialStep === 0);
}

function keyPressed() {
  ensureAudioStarted(); // a key press unlocks audio too, for keyboard-first players

  // Enter or Space on the title screen starts the game
  if (currentWorld === 'start') {
    if (newFarmConfirm) {
      if (keyCode === ESCAPE) newFarmConfirm = false;
      return;
    }
    if (keyCode === ENTER || key === ' ') startGame();
    return;
  }

  // M toggles the farm map from anywhere
  if (key === 'm' || key === 'M') {
    toggleFarmMap();
    return;
  }

  if (key === ' ' || keyCode === ESCAPE) {
    // close whichever overlay is open first, otherwise interact
    if (mapOpen) {
      toggleFarmMap();
      return;
    }
    if (questBoardOpen) {
      questBoardOpen = false;
      return;
    }
    if (showGuide) {
      showGuide = false;
      return;
    }
    if (key === ' ') interact();
    else goBack(); // Escape with nothing open steps out of the current hub
  }
}

function mousePressed() {
  console.log(`Mouse clicked at (${mouseX}, ${mouseY}) in world: ${currentWorld}`);

  // browsers only allow audio to start from a user gesture, so the first click
  // anywhere on the canvas is what actually turns the sound on
  ensureAudioStarted();

  // CLICK TO START GAME
  if (currentWorld === 'start') {
    // the New Farm button and its confirmation sit on top of the start screen
    if (handleStartScreenClick(mouseX, mouseY)) return;
    startGame();
    return;
  }

  // Back button (top left corner of every hub) - see drawBackButton()
  if (hasBackButton() && pointInRect(mouseX, mouseY, getBackButtonRect())) {
    if (goBack()) return;
  }

  if (mapOpen) {
    // the map is a reference, not a fast-travel menu - any click just closes it
    toggleFarmMap();
    return;
  }

  if (questBoardOpen) {
    // close the goal board when clicking anywhere on the canvas
    questBoardOpen = false;
    return;
  }

  if (showGuide) {
    // the tutorial card has buttons now - "Got it"/"Close" dismiss, "Skip" ends it,
    // and a click anywhere else still just dismisses
    handleTutorialClick(mouseX, mouseY);
    return;
  }

  // note: home/guide buttons are now real HTML buttons outside the canvas - see
  // setupHudButtons(). Clicking them no longer goes through mousePressed() at all.

  // note: world-to-world navigation (arrows + hub zones) is now walk-triggered \u2014
  // see checkWorldTransitions(), edgeTransitions, and hubZones. Mouse clicks no
  // longer drive movement between worlds, only menus/buttons/trading below.

  // world interactions (primary input): click directly on a harvestable crop, an
  // egg/milk/bacon, an empty plot while a seed is selected, or a hub-zone entrance.
  // findTargetAtPoint() enforces INTERACT_RANGE / the zone perimeter, and
  // performInteraction() is the shared dispatcher the space bar uses too.
  // This sits ahead of the barn/market menus below on purpose: those worlds have no
  // player character, so findTargetAtPoint() returns null there and clicks fall
  // through to the trading UI untouched.
  if (player) {
    const clicked = findTargetAtPoint(mouseX, mouseY);
    if (clicked) {
      performInteraction(clicked);
      return; // the click landed on a target, in range or not - do not fall through
    }
  }

  // select stock item in the barn
  if (currentWorld === 'barn') {
    for (const cell of getStockCellRects(barnItems)) {
      if (pointInRect(mouseX, mouseY, cell)) {
        selectedStockItem = cell.name;
        filledSlots = {}; // switching target item clears any in-progress ingredient slots
        console.log(`Selected stock item: ${selectedStockItem}`);
        return;
      }
    }

    // click a filled ingredient slot to undo it and return the item to inventory
    if (selectedStockItem) {
      const requirements = tradeRequirements[selectedStockItem];
      const slots = getIngredientSlotRects(requirements, tradeRect);
      for (const slot of slots) {
        if (filledSlots[slot.name] &&
            mouseX >= slot.x && mouseX <= slot.x + slot.w &&
            mouseY >= slot.y && mouseY <= slot.y + slot.h) {
          inventory[slot.name] += requirements[slot.name];
          filledSlots[slot.name] = false;
          updateInventoryDisplay();
          console.log(`Returned ${requirements[slot.name]}x ${slot.name} from slot`);
          return;
        }
      }
    }
  }

  // BUY/SELL tabs and the "buy with coins" button, in both trading worlds
  if (currentWorld === 'barn' || currentWorld === 'farmersMarket') {
    if (handleEconomyClick(mouseX, mouseY)) return;
  }

  // select market item in the farmers market (buy mode only - the catalogue is
  // inert while selling, see drawMarketStock())
  if (currentWorld === 'farmersMarket' && marketMode === 'buy') {
    for (const cell of getStockCellRects(marketItems)) {
      if (pointInRect(mouseX, mouseY, cell)) {
        selectedMarketItem = cell.name;
        filledSlots = {}; // switching target item clears any in-progress ingredient slots
        console.log(`Selected market item: ${selectedMarketItem}`);
        return;
      }
    }

    // click a filled ingredient slot to undo it and return the item to inventory
    if (selectedMarketItem) {
      const requirements = marketTradeRequirements[selectedMarketItem];
      const slots = getIngredientSlotRects(requirements, marketTradeRect);
      for (const slot of slots) {
        if (filledSlots[slot.name] &&
            mouseX >= slot.x && mouseX <= slot.x + slot.w &&
            mouseY >= slot.y && mouseY <= slot.y + slot.h) {
          inventory[slot.name] += requirements[slot.name];
          filledSlots[slot.name] = false;
          updateInventoryDisplay();
          console.log(`Returned ${requirements[slot.name]}x ${slot.name} from slot`);
          return;
        }
      }
    }
  }

  // note: crops/eggs/hub zones are handled by the click dispatcher above.
}

// to check if a point is inside a quadrilateral
function isPointInQuad(px, py, x1, y1, x2, y2, x3, y3, x4, y4) {
  function sign(p1x, p1y, p2x, p2y, p3x, p3y) {
    return (p1x - p3x) * (p2y - p3y) - (p2x - p3x) * (p1y - p3y);
  }
  
  // check if point is inside by testing against all four edges
  let d1 = sign(px, py, x1, y1, x2, y2);
  let d2 = sign(px, py, x2, y2, x3, y3);
  let d3 = sign(px, py, x3, y3, x4, y4);
  let d4 = sign(px, py, x4, y4, x1, y1);
  
  let hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0) || (d4 < 0);
  let hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0) || (d4 > 0);
  
  return !(hasNeg && hasPos);
}

// ---------------------------------------------------------------------------
// SAVE / LOAD
//
// One versioned object under one localStorage key. Everything the farm is made of
// goes in: inventory, coins, the clock, quests, tutorial progress, the garden, the
// animals and where you were standing.
//
// Every field is read through a checked reader that falls back to the value already
// in memory, so a save missing a field - an old one, a hand-edited one, a corrupt
// one - loads the parts it does have and defaults the rest. That is the whole
// migration strategy: version 1 saves have no `version` key and simply lack most
// fields, which the readers already handle. The version number is recorded so a
// future change that genuinely can't be expressed as "missing field" has somewhere
// to branch.
//
// Animals and the player can't be restored at load time because setup() hasn't
// built them yet, so that part of the save is parked in `restoredState` and applied
// by applyRestoredState() once it has.
// ---------------------------------------------------------------------------

const SAVE_KEY = 'farmInventory';  // unchanged, so saves made before today still load
const SAVE_VERSION = 2;

let restoredState = null;

// ---- checked readers -------------------------------------------------------
// each takes the raw value and what to fall back to, and never throws

function readNumber(value, fallback, opts) {
  const { min = -Infinity, max = Infinity, integer = false } = opts || {};
  if (typeof value !== 'number' || !isFinite(value)) return fallback;
  const clamped = Math.min(Math.max(value, min), max);
  return integer ? Math.floor(clamped) : clamped;
}

function readBool(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

function readOneOf(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function readArray(value) {
  return Array.isArray(value) ? value : [];
}

// an index into a fixed-size thing (a garden row, a column). Out of range is
// REJECTED rather than clamped: clamping an address silently moves the item
// somewhere valid, which is how a crop saved at row 99 ends up in row 5.
function readIndex(value, length) {
  if (typeof value !== 'number' || !isFinite(value)) return -1;
  const i = Math.floor(value);
  return i >= 0 && i < length ? i : -1;
}

function readObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

// ---- writing ---------------------------------------------------------------

function serializeCrops() {
  const crops = [];
  for (let row = 0; row < gardenGrid.length; row++) {
    for (let col = 0; col < gardenGrid[row].length; col++) {
      const crop = gardenGrid[row][col];
      if (!crop) continue;
      crops.push({
        row, col,
        itemName: crop.itemName,
        growthStage: crop.growthStage,
        growthTimer: crop.growthTimer,
        plantedHour: crop.plantedHour,
        lastWateredHour: crop.lastWateredHour,
        withered: crop.withered,
      });
    }
  }
  return crops;
}

function serializeHerd(herd) {
  return herd.map(a => ({
    x: a.x, y: a.y,
    happiness: typeof a.happiness === 'number' ? a.happiness : ANIMAL_START_HAPPINESS,
  }));
}

function buildSaveState() {
  return {
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),

    inventory: Object.assign({}, inventory),
    coins: coins,
    gameMinutesElapsed: gameMinutesElapsed,
    audioMuted: audioMuted,

    // where the player was, so a refresh puts them back rather than at the farmhouse
    world: currentWorld === 'start' ? 'home' : currentWorld,
    player: player ? { x: player.x, y: player.y, facing: player.facing } : null,

    questStats: questStats,
    activeQuests: activeQuests,
    questsCompleted: questsCompleted,

    hasSeenTutorial: hasSeenTutorial,
    tutorialStep: tutorialStep,

    gardenCrops: serializeCrops(),

    // counts come from the arrays now; cowsCount/pigsCount are still read on load
    // for saves written before this
    animals: {
      chickens: serializeHerd(chickens),
      ducks: serializeHerd(ducks),
      cows: serializeHerd(cows),
      pigs: serializeHerd(pigs),
    },
  };
}

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(buildSaveState()));
  } catch (err) {
    // a full or blocked localStorage shouldn't take the game down mid-harvest
    console.warn('could not save:', err && err.message);
  }
}

// every call site still says saveInventory(); it saves the whole farm now
function saveInventory() {
  saveGame();
}

// ---- reading ---------------------------------------------------------------

function readSaveState() {
  let raw;
  try {
    raw = localStorage.getItem(SAVE_KEY);
  } catch (err) {
    console.warn('could not read the save:', err && err.message);
    return null;
  }
  if (!raw) return null;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.warn('the save is not valid JSON - starting fresh');
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

  // the oldest format of all was the bare inventory object, with counts at the top
  // level and no `inventory` key
  if (!parsed.inventory && Object.keys(inventory).some(k => typeof parsed[k] === 'number')) {
    return { version: 0, inventory: parsed };
  }

  parsed.version = readNumber(parsed.version, 1, { min: 0, integer: true });
  return parsed;
}

function loadGame() {
  const state = readSaveState();
  if (!state) {
    console.log('No saved game state found');
    restoredState = null;
    return;
  }
  console.log(`Loading save (version ${state.version})`);

  // inventory: only keys the game knows about, and only sane numbers
  const savedInventory = readObject(state.inventory);
  for (const key of Object.keys(inventory)) {
    inventory[key] = readNumber(savedInventory[key], inventory[key], { min: 0, integer: true });
  }

  // the clock first - crop watering times are measured against it
  gameMinutesElapsed = readNumber(state.gameMinutesElapsed, gameMinutesElapsed, { min: 0 });
  coins = readNumber(state.coins, coins, { min: 0, integer: true });
  audioMuted = readBool(state.audioMuted, audioMuted);

  // tutorial: a save with no flag at all belongs to someone who has never seen it
  hasSeenTutorial = state.hasSeenTutorial === true;
  tutorialStep = readNumber(state.tutorialStep, 0,
    { min: 0, max: TUTORIAL_STEPS.length - 1, integer: true });

  // quests
  const savedStats = readObject(state.questStats);
  for (const key of Object.keys(questStats)) {
    if (typeof questStats[key] === 'number') {
      questStats[key] = readNumber(savedStats[key], questStats[key], { min: 0 });
    } else {
      questStats[key] = readObject(savedStats[key]);
    }
  }
  activeQuests = readArray(state.activeQuests)
    .filter(q => q && questById(q.id))                       // drop retired goals
    .map(q => ({ id: q.id, baseline: readNumber(q.baseline, 0, { min: 0 }) }));
  questsCompleted = readNumber(state.questsCompleted, 0, { min: 0, integer: true });

  loadGardenCrops(readArray(state.gardenCrops));

  // animals and the player don't exist yet - setup() builds them, then
  // applyRestoredState() puts the saved values back
  restoredState = {
    world: readOneOf(state.world, Object.keys(worldLabels), null),
    player: readObject(state.player),
    animals: normalizeSavedAnimals(state),
  };

  console.log('Game state loaded');
}

// saves before version 2 stored only a count of cows and pigs
function normalizeSavedAnimals(state) {
  const animals = readObject(state.animals);
  const fromCount = (count) => {
    const n = readNumber(count, 0, { min: 0, max: 200, integer: true });
    return Array.from({ length: n }, () => ({}));
  };
  return {
    chickens: readArray(animals.chickens),
    ducks: readArray(animals.ducks),
    cows: animals.cows ? readArray(animals.cows) : fromCount(state.cowsCount),
    pigs: animals.pigs ? readArray(animals.pigs) : fromCount(state.pigsCount),
  };
}

function loadGardenCrops(saved) {
  for (const savedCrop of saved) {
    if (!savedCrop || typeof savedCrop !== 'object') continue;
    const row = readIndex(savedCrop.row, gardenGrid.length);
    const col = readIndex(savedCrop.col, gardenGrid[0].length);
    if (row < 0 || col < 0) continue;

    const itemIndex = producePaths.findIndex(p => p.includes(savedCrop.itemName));
    if (itemIndex === -1) continue; // a crop that no longer exists in the game

    const crop = new Crop(produceImgs[itemIndex], savedCrop.itemName, 0, 0, 0, 0);
    crop.growthStage = readNumber(savedCrop.growthStage, 0, { min: 0, max: 2, integer: true });
    crop.growthTimer = readNumber(savedCrop.growthTimer, 0, { min: 0, max: 1 });

    // crops saved before watering existed come back freshly watered rather than
    // instantly parched
    crop.plantedHour = readNumber(savedCrop.plantedHour, gameHours(), { min: 0 });
    crop.lastWateredHour = savedCrop.lastWateredHour === undefined
      ? gameHours()
      : readNumber(savedCrop.lastWateredHour, gameHours(), { min: 0 });
    crop.withered = readBool(savedCrop.withered, false);

    gardenGrid[row][col] = crop;
  }
  console.log(`Loaded ${saved.length} crops`);
}

// called from setup() once the animals and the player exist
function applyRestoredState() {
  if (!restoredState) return;

  const herds = { chickens, ducks, cows, pigs };
  for (const [name, herd] of Object.entries(herds)) {
    const saved = restoredState.animals[name] || [];

    // cows and pigs are bought, so the save decides how many there are; chickens
    // and ducks are a fixed flock, so only their state is restored
    if ((name === 'cows' || name === 'pigs') && saved.length > herd.length) {
      const img = name === 'cows' ? cowImg : pigImg;
      const Species = name === 'cows' ? Cow : Pig;
      while (herd.length < saved.length) {
        herd.push(new Species(img, random(200, 600), random(200, 500)));
      }
    }

    herd.forEach((animal, i) => {
      const entry = readObject(saved[i]);
      animal.x = readNumber(entry.x, animal.x);
      animal.y = readNumber(entry.y, animal.y);
      animal.happiness = readNumber(entry.happiness, ANIMAL_START_HAPPINESS, { min: 0, max: 100 });
    });
  }

  if (player) {
    player.x = readNumber(restoredState.player.x, player.x);
    player.y = readNumber(restoredState.player.y, player.y);
    player.facing = readOneOf(restoredState.player.facing, ['up', 'down', 'left', 'right'], player.facing);
  }
}

// the world to drop the player into when they click past the start screen
function restoredWorld() {
  return (restoredState && restoredState.world) || 'home';
}

// every call site still says loadInventory()
function loadInventory() {
  loadGame();
}

// ---- new farm --------------------------------------------------------------

// wipes the save and resets everything in memory, back to the start screen. The
// audio preference is deliberately kept: it's a setting, not farm progress.
function startNewFarm() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (err) {
    console.warn('could not clear the save:', err && err.message);
  }

  for (const key of Object.keys(inventory)) inventory[key] = DEFAULT_INVENTORY[key] || 0;
  coins = 0;
  gameMinutesElapsed = 0;
  lastClockTickMs = null;

  gardenGrid = Array(6).fill().map(() => Array(8).fill(null));
  eggs = []; milks = []; bacons = []; breadCrumbs = [];
  cows = []; pigs = [];
  for (const animal of [...chickens, ...ducks]) {
    animal.happiness = ANIMAL_START_HAPPINESS;
    animal.fedFlash = 0;
  }

  questStats = { harvested: {}, collected: {}, made: {}, planted: 0, watered: 0, fed: 0, trades: 0, sold: 0 };
  activeQuests = [];
  questsCompleted = 0;
  refillQuests();

  hasSeenTutorial = false;
  tutorialActive = false;
  tutorialStep = 0;
  tutorialWalked = 0;
  tutorialVisited = {};

  selectedSeed = null;
  selectedStockItem = null;
  selectedMarketItem = null;
  filledSlots = {};
  marketMode = 'buy';
  particles = [];
  lastSale = null;
  questNotice = null;
  tutorialDoneFlash = null;

  showGuide = false;
  questBoardOpen = false;
  mapOpen = false;
  newFarmConfirm = false;

  restoredState = null;
  if (player) {
    player.x = width / 2;
    player.y = height / 2;
    player.facing = 'down';
  }

  previousWorld = null;
  currentWorld = 'start';
  setAmbientForWorld('start');
  updateInventoryDisplay();
  console.log('Started a new farm');
}

function hasExistingSave() {
  try {
    return !!localStorage.getItem(SAVE_KEY);
  } catch (err) {
    return false;
  }
}

// ---- the start screen's New Farm button ------------------------------------

let newFarmConfirm = false;

function getNewFarmButton() {
  return { x: width - 172, y: height - 56, w: 152, h: 36 };
}

function getNewFarmConfirmButtons() {
  const box = getNewFarmPanel();
  const w = (box.w - 48 - 12) / 2;
  const y = box.y + box.h - 52;
  return [
    { id: 'confirm', label: 'Erase and start over', x: box.x + 24, y, w, h: 34 },
    { id: 'cancel', label: 'Keep my farm', x: box.x + 24 + w + 12, y, w, h: 34 },
  ];
}

function getNewFarmPanel() {
  const w = 420, h = 180;
  return { x: (width - w) / 2, y: (height - h) / 2, w, h };
}

function drawStartScreenControls() {
  drawStartScreenHint();
  if (!hasExistingSave()) return;

  const button = getNewFarmButton();
  const hovered = !newFarmConfirm && pointInRect(mouseX, mouseY, button);

  push();
  rectMode(CORNER);
  noStroke();
  fill(58, 36, 21, 200);
  rect(button.x + 3, button.y + 3, button.w, button.h, 8);
  fill(hovered ? color(176, 130, 84) : color(146, 104, 62));
  rect(button.x, button.y, button.w, button.h, 8);
  noFill();
  stroke(58, 36, 21);
  strokeWeight(3);
  rect(button.x, button.y, button.w, button.h, 8);
  noStroke();
  fill(246, 231, 205);
  textAlign(CENTER, CENTER);
  textSize(14);
  text('New Farm', button.x + button.w / 2, button.y + button.h / 2 + 1);
  pop();

  if (newFarmConfirm) drawNewFarmConfirm();
}

// a plank under the START button that says how to begin and, for a returning
// player, that their farm is still here - the New Farm button sits to its right
function drawStartScreenHint() {
  if (newFarmConfirm) return;
  const resuming = hasExistingSave();
  const line1 = resuming ? 'Click START or press Enter to continue your farm'
                         : 'Click START or press Enter to begin';
  const line2 = 'Arrow keys walk  ·  the mouse does everything else';

  push();
  textSize(14);
  textStyle(BOLD);
  const w = Math.max(textWidth(line1), textWidth(line2)) + 40;
  textStyle(NORMAL);
  const h = 50;
  const x = resuming ? 20 : (width - w) / 2;
  const y = height - h - 16;

  rectMode(CORNER);
  noStroke();
  fill(58, 36, 21, 220);
  rect(x + 3, y + 3, w, h, 6);
  fill(202, 160, 106);
  stroke(58, 36, 21);
  strokeWeight(3);
  rect(x, y, w, h, 6);

  noStroke();
  fill(58, 36, 21);
  textAlign(CENTER, CENTER);
  textSize(14);
  textStyle(BOLD);
  text(line1, x + w / 2, y + 16);
  textStyle(NORMAL);
  textSize(13);
  fill(92, 62, 34);
  text(line2, x + w / 2, y + 35);
  pop();
}

function drawNewFarmConfirm() {
  const box = getNewFarmPanel();
  push();
  rectMode(CORNER);
  noStroke();
  fill(0, 190);
  rect(0, 0, width, height);

  fill(58, 36, 21);
  rect(box.x - 4, box.y - 4, box.w + 8, box.h + 8, 12);
  fill(146, 104, 62);
  rect(box.x, box.y, box.w, box.h, 10);
  fill(120, 84, 48);
  rect(box.x + 12, box.y + 12, box.w - 24, box.h - 24, 8);

  fill(246, 231, 205);
  textAlign(CENTER, CENTER);
  textSize(18);
  textStyle(BOLD);
  text('Start a new farm?', box.x + box.w / 2, box.y + 48);
  textStyle(NORMAL);
  textSize(13);
  fill(238, 220, 192);
  text('Your crops, coins, animals and goals will be erased.\nThis cannot be undone.',
       box.x + box.w / 2, box.y + 84);

  for (const button of getNewFarmConfirmButtons()) {
    const hovered = pointInRect(mouseX, mouseY, button);
    noStroke();
    fill(58, 36, 21, 190);
    rect(button.x + 2, button.y + 2, button.w, button.h, 6);
    fill(button.id === 'confirm'
      ? (hovered ? color(196, 96, 82) : color(168, 76, 64))
      : (hovered ? color(120, 180, 100) : color(90, 150, 80)));
    rect(button.x, button.y, button.w, button.h, 6);
    noFill();
    stroke(button.id === 'confirm' ? color(232, 160, 150) : color(180, 230, 160));
    strokeWeight(2);
    rect(button.x, button.y, button.w, button.h, 6);
    noStroke();
    fill(246, 231, 205);
    textAlign(CENTER, CENTER);
    textSize(12);
    text(button.label, button.x + button.w / 2, button.y + button.h / 2 + 1);
  }
  pop();
}

// returns true when the click was consumed by the start-screen controls
function handleStartScreenClick(mx, my) {
  if (newFarmConfirm) {
    for (const button of getNewFarmConfirmButtons()) {
      if (!pointInRect(mx, my, button)) continue;
      if (button.id === 'confirm') startNewFarm();
      newFarmConfirm = false;
      return true;
    }
    return true; // the dialog is modal: clicks elsewhere do nothing
  }

  if (hasExistingSave() && pointInRect(mx, my, getNewFarmButton())) {
    newFarmConfirm = true;
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// INVENTORY PANEL
//
// The tray is grouped rather than one flat run of slots. Each group gets a label
// and its own small grid; every item keeps a fixed slot whether or not you own any,
// so the layout never reflows as counts change.
//
// The per-slot DOM is deliberately unchanged from the flat version:
//   .inventory-slot[data-item]  >  .inventory-item[data-item][draggable]
//                                    >  .inventory-count
// handleDragStart() reads the inline background off .inventory-item, handleSeedClick()
// and refreshSeedSelectionHighlight() both key off data-item, and
// updateInventoryDisplay() finds a slot with querySelector('[data-item=...]') - which
// resolves to the slot because it always precedes its own item in the DOM. Keeping
// that shape is what makes this a layout pass and not a mechanics change.
// ---------------------------------------------------------------------------

const INVENTORY_CATEGORIES = [
  { id: 'crops',   label: 'Seeds & Crops',    columns: 4,
    items: ['wheat', 'corn', 'carrot', 'radish', 'apple', 'strawberry',
            'pepper', 'lemon', 'peach', 'grape', 'pumpkin'] },
  { id: 'animal',  label: 'Animal Products',  columns: 4,
    items: ['egg', 'milk', 'bacon'] },
  { id: 'crafted', label: 'Crafted Goods',    columns: 4,
    items: ['bread', 'cheese', 'pie', 'sandwich', 'applejam', 'carrotcake'] },
];

// display names for the items whose keys are run-together words
const ITEM_LABELS = {
  applejam: 'Apple Jam',
  carrotcake: 'Carrot Cake',
};

function itemLabel(itemName) {
  return ITEM_LABELS[itemName] || itemName.charAt(0).toUpperCase() + itemName.slice(1);
}

// crop art is a 3-frame growth sprite sheet, so the inventory shows the last frame.
// Everything else (eggs, milk, crafted goods) is a single image. Plantable === crop
// here, which is why isPlantableSeed() is the test.
function usesCropSpriteSheet(itemName) {
  return isPlantableSeed(itemName);
}

// every inventory key gets a slot somewhere, even one added later that nobody
// remembered to categorize
function inventoryGroups() {
  const groups = INVENTORY_CATEGORIES.map(c => ({ ...c, items: c.items.filter(i => i in inventory) }));
  const placed = new Set(groups.flatMap(g => g.items));
  const leftovers = Object.keys(inventory).filter(i => !placed.has(i));
  if (leftovers.length) {
    groups.push({ id: 'other', label: 'Other', columns: Math.min(4, leftovers.length), items: leftovers });
  }
  return groups;
}

// builds one item card: the draggable icon plus its count badge
function createInventoryItem(itemName) {
  const item = document.createElement('div');
  item.className = 'inventory-item';
  item.style.backgroundImage = `url('produce/${itemName}.png')`;

  if (usesCropSpriteSheet(itemName)) {
    item.style.backgroundSize = '300% 100%';   // 3x width...
    item.style.backgroundPosition = 'right center'; // ...cropped to the ripe frame
  } else {
    item.style.backgroundSize = 'cover';
    item.style.backgroundPosition = 'center';
  }

  item.setAttribute('data-item', itemName);

  const count = document.createElement('div');
  count.className = 'inventory-count';
  count.textContent = inventory[itemName];
  item.appendChild(count);

  attachInventoryItemHandlers(item, itemName);
  if (itemName === selectedSeed) item.classList.add('selected');

  return item;
}

// ---- hover tooltip ---------------------------------------------------------
// Lives on document.body rather than inside the tray, because #console-body clips
// its overflow and the tooltip needs to float above the canvas.

function getInventoryTooltip() {
  let tip = document.getElementById('inventory-tooltip');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'inventory-tooltip';
    tip.setAttribute('role', 'tooltip');
    document.body.appendChild(tip);
  }
  return tip;
}

// recipes that consume this item, from either trade table
function findTradeUses(itemName) {
  const uses = [];
  for (const [output, requirements] of Object.entries(tradeRequirements)) {
    if (requirements[itemName]) uses.push({ output, qty: requirements[itemName], where: 'Barn' });
  }
  for (const [output, requirements] of Object.entries(marketTradeRequirements)) {
    if (requirements[itemName]) uses.push({ output, qty: requirements[itemName], where: 'Market' });
  }
  return uses;
}

// the recipe that produces this item, if it is craftable at all
function findItemRecipe(itemName) {
  if (tradeRequirements[itemName]) return { requirements: tradeRequirements[itemName], where: 'Barn' };
  if (marketTradeRequirements[itemName]) return { requirements: marketTradeRequirements[itemName], where: 'Market' };
  return null;
}

const TOOLTIP_MAX_USES = 5;

function buildTooltipHtml(itemName) {
  const owned = inventory[itemName] || 0;
  const rows = [
    `<div class="tt-head"><span class="tt-name">${itemLabel(itemName)}</span>` +
    `<span class="tt-owned">have ${owned}</span></div>`
  ];

  if (isSellable(itemName)) {
    rows.push(`<div class="tt-row"><span class="tt-label">Sells for</span> ${sellPrice(itemName)} coins <span class="tt-where">(Market)</span></div>`);
  }

  const recipe = findItemRecipe(itemName);
  if (recipe) {
    const parts = Object.entries(recipe.requirements)
      .map(([ing, qty]) => `${qty} ${itemLabel(ing)}`)
      .join(', ');
    rows.push(`<div class="tt-row"><span class="tt-label">Made from</span> ${parts} ` +
              `<span class="tt-where">(${recipe.where})</span><br>` +
              `<span class="tt-where">or buy for ${buyPrice(itemName)} coins</span></div>`);
  }

  const uses = findTradeUses(itemName);
  if (uses.length) {
    const shown = uses.slice(0, TOOLTIP_MAX_USES)
      .map(u => `${u.qty} &rarr; ${itemLabel(u.output)} <span class="tt-where">(${u.where})</span>`)
      .join('<br>');
    const more = uses.length > TOOLTIP_MAX_USES
      ? `<br><span class="tt-where">+${uses.length - TOOLTIP_MAX_USES} more</span>` : '';
    rows.push(`<div class="tt-row"><span class="tt-label">Trade for</span><br>${shown}${more}</div>`);
  }

  if (isPlantableSeed(itemName)) {
    const traits = cropTraits(itemName);
    const inSeason = canPlantInSeason(itemName);
    rows.push(
      `<div class="tt-row"><span class="tt-label">Grows</span> ${cropSeasonLabel(itemName)}` +
      (inSeason ? '' : ` <span class="tt-warn">&mdash; not this season</span>`) +
      (traits.note ? `<br><span class="tt-where">${traits.note}</span>` : '') +
      `</div>`);
    rows.push('<div class="tt-row tt-hint">Click to select, then click a garden plot to plant</div>');
  }

  return rows.join('');
}

function showItemTooltip(el, itemName) {
  if (isDragging) return;
  const tip = getInventoryTooltip();
  tip.innerHTML = buildTooltipHtml(itemName);
  tip.style.display = 'block';

  // position above the card, centered, then nudge back inside the viewport
  const card = el.getBoundingClientRect();
  const box = tip.getBoundingClientRect();
  const margin = 8;
  let left = card.left + card.width / 2 - box.width / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - box.width - margin));
  let top = card.top - box.height - 10;
  if (top < margin) top = card.bottom + 10; // no room above: flip below

  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
}

function hideItemTooltip() {
  const tip = document.getElementById('inventory-tooltip');
  if (tip) tip.style.display = 'none';
}

function isPlantableSeed(itemName) {
  return barnItems.includes(itemName);
}

// click handler for a plantable seed's inventory slot: toggles it as the selected seed
function handleSeedClick(e) {
  const itemName = e.target.getAttribute('data-item');
  if (inventory[itemName] <= 0) return;

  if (selectedSeed === itemName) {
    selectedSeed = null; // clicking the already-selected seed deselects it
  } else {
    selectedSeed = itemName;
  }
  console.log(`selectedSeed is now: ${selectedSeed}`);
  refreshSeedSelectionHighlight();
}

// re-applies the .selected CSS class to whichever inventory item matches selectedSeed
function refreshSeedSelectionHighlight() {
  document.querySelectorAll('.inventory-item').forEach(el => {
    el.classList.toggle('selected', el.getAttribute('data-item') === selectedSeed);
  });
}

// wires up the right interaction listeners for one inventory item element,
// depending on whether it's a plantable seed or some other good
function attachInventoryItemHandlers(item, itemName) {
  // plantable crops (wheat, corn, carrot, etc.) double as trade ingredients in the
  // barn/market, so they get both: click to select for planting, AND draggable to
  // drop into a trade ingredient slot. Goods that aren't plantable (egg, milk, bacon,
  // bread, etc.) are drag-only since they're never planted.
  if (isPlantableSeed(itemName)) {
    item.addEventListener('click', handleSeedClick);
  }
  item.setAttribute('draggable', 'true');
  item.addEventListener('dragstart', handleDragStart);
  item.addEventListener('dragend', handleDragEnd);

  // hover tooltip - hidden while dragging so it never covers the drop target
  item.addEventListener('mouseenter', () => showItemTooltip(item, itemName));
  item.addEventListener('mouseleave', hideItemTooltip);
  item.addEventListener('dragstart', hideItemTooltip);
}

// build the grouped inventory panel
function initializeInventory() {
  console.log('initializing inventory panel...');
  const inventoryGrid = document.getElementById('inventory-grid');
  if (!inventoryGrid) {
    console.log('inventory grid element not found!');
    return;
  }

  inventoryGrid.innerHTML = '';
  hideItemTooltip(); // any tooltip still showing now points at a removed element

  for (const group of inventoryGroups()) {
    const groupEl = document.createElement('div');
    groupEl.className = 'inventory-group';
    groupEl.setAttribute('data-group', group.id);

    const label = document.createElement('div');
    label.className = 'inventory-group-label';
    label.textContent = group.label;
    groupEl.appendChild(label);

    const slots = document.createElement('div');
    slots.className = 'inventory-group-slots';
    slots.style.gridTemplateColumns = `repeat(${group.columns}, var(--slot-size))`;

    for (const itemName of group.items) {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      slot.setAttribute('data-item', itemName);
      // an owned item gets a card; an empty slot stays as a placeholder so the
      // grid keeps its shape
      if (inventory[itemName] > 0) slot.appendChild(createInventoryItem(itemName));
      slots.appendChild(slot);
    }

    groupEl.appendChild(slots);
    inventoryGrid.appendChild(groupEl);
  }
}

// wires up the real HTML home/guide buttons (#home-button, #guide-button in
// index.html - see style.css for their wood-stump styling) that now live outside
// the game canvas, replacing the old canvas-drawn drawHomeButton()/drawGuideIcon().
// Called once from setup().
function setupHudButtons() {
  const homeBtn = document.getElementById('home-button');
  if (homeBtn) {
    homeBtn.addEventListener('click', () => changeWorld('home'));
  }

  const guideBtn = document.getElementById('guide-button');
  if (guideBtn) {
    guideBtn.addEventListener('click', () => {
      showGuide = !showGuide;
      if (showGuide) {
        mapOpen = false;
        questBoardOpen = false;
      }
    });
  }

  const mapBtn = document.getElementById('map-button');
  if (mapBtn) {
    mapBtn.addEventListener('click', toggleFarmMap);
  }

  const muteBtn = document.getElementById('mute-button');
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      ensureAudioStarted(); // a click on this button is itself a valid unlock gesture
      setMuted(!audioMuted);
    });
  }
  updateMuteButton(); // reflect the preference restored by loadInventory()
}

// creates the floating icon that follows the cursor while an inventory item is
// being dragged toward the canvas, and wires up the document-wide dragover listener
// that keeps it positioned at the mouse. Called once from setup().
function setupDragGhost() {
  if (document.getElementById('drag-ghost')) return;

  const ghost = document.createElement('div');
  ghost.id = 'drag-ghost';
  document.body.appendChild(ghost);

  // dragover fires continuously on whatever element is under the cursor during a
  // drag, including the canvas and the gaps around it, so listening on the document
  // (with the capture phase) reliably tracks the cursor across the whole page.
  document.addEventListener('dragover', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const g = document.getElementById('drag-ghost');
    if (g) {
      g.style.left = `${e.clientX}px`;
      g.style.top = `${e.clientY}px`;
    }
  }, true);
}

// handle drag start
function handleDragStart(e) {
  const itemName = e.target.getAttribute('data-item');
  console.log(`starting to drag: ${itemName}`);

  if (inventory[itemName] <= 0) {
    console.log(`cannot drag ${itemName} - inventory count is 0`);
    e.preventDefault();
    return;
  }

  console.log(`current ${itemName} count: ${inventory[itemName]}`);
  isDragging = true;
  draggedItem = itemName;
  draggedElement = e.target;

  e.dataTransfer.setData('text/plain', itemName);
  e.dataTransfer.effectAllowed = 'move';

  // hide the default browser drag ghost image - we render our own floating icon
  // instead (see #drag-ghost / setupDragGhost()) so it can follow the cursor
  // smoothly over the canvas too, which the native ghost can't do reliably.
  let img = new Image();
  img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  e.dataTransfer.setDragImage(img, 0, 0);

  // show our custom floating icon, positioned at the drag's starting point
  const ghost = document.getElementById('drag-ghost');
  if (ghost) {
    ghost.style.backgroundImage = e.target.style.backgroundImage;
    ghost.style.backgroundSize = e.target.style.backgroundSize || 'cover';
    ghost.style.backgroundPosition = e.target.style.backgroundPosition || 'center';
    ghost.style.left = `${e.clientX}px`;
    ghost.style.top = `${e.clientY}px`;
    ghost.style.display = 'block';
  }

  e.target.style.opacity = '0.5';
  e.target.classList.add('dragging');

  console.log('drag started successfully');
}

// handle drag end
function handleDragEnd(e) {
  console.log('drag ended');

  // restoring visual state
  if (e.target) {
    e.target.style.opacity = '1';
    e.target.classList.remove('dragging');
  }

  // hide the floating drag icon regardless of whether the drop landed on a valid target
  const ghost = document.getElementById('drag-ghost');
  if (ghost) ghost.style.display = 'none';

  isDragging = false;
  draggedItem = null;
  draggedElement = null;
}

// update inventory display
function updateInventoryDisplay() {
  Object.keys(inventory).forEach(itemName => {
    const slot = document.querySelector(`[data-item="${itemName}"]`);
    if (!slot) return;
    
    const existingItem = slot.querySelector('.inventory-item');
    
    if (inventory[itemName] > 0) {
      if (!existingItem) {
        // first of this item: build its card into the slot that was already there
        slot.appendChild(createInventoryItem(itemName));
      } else {
        // update count
        const countElement = existingItem.querySelector('.inventory-count');
        if (countElement) {
          countElement.textContent = inventory[itemName];
        }
      }
    } else {
      // count hit 0: strip the card but keep the empty slot, so the grid holds shape
      if (existingItem) {
        if (itemName === selectedSeed) selectedSeed = null; // deselect if it runs out
        existingItem.remove();
        hideItemTooltip(); // the card the cursor was over no longer exists
      }
    }
  });
  
  saveInventory();
}

// add drop event listeners to canvas
function setupCanvasDropHandling() {
  const canvas = document.querySelector('canvas');
  if (!canvas) return;

  canvas.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  });

  canvas.addEventListener('drop', handleCanvasDrop);
}

// completes the barn trade: called once every ingredient slot is filled. Ingredients
// were already deducted from inventory as they were dragged into their slots, so this
// just grants the output item and resets for the next trade.
function executeBarnTrade() {
  inventory[selectedStockItem]++;
  questStats.trades++;
  questStats.made[selectedStockItem] = (questStats.made[selectedStockItem] || 0) + 1;
  playSfx('trade');
  filledSlots = {};
  updateInventoryDisplay();
  saveInventory();
  console.log(`Traded for 1 ${selectedStockItem}.`);
}

// completes the farmers market trade: called once every ingredient slot is filled.
// Ingredients were already deducted from inventory as they were dragged into their
// slots, so this just grants the output item (plus cow/pig spawn side effects) and
// resets for the next trade.
function executeMarketTrade() {
  // cow/pig have no inventory slot of their own (they become animals in the coops),
  // so seed the key rather than incrementing undefined into NaN
  if (typeof inventory[selectedMarketItem] !== 'number') inventory[selectedMarketItem] = 0;
  inventory[selectedMarketItem]++;
  questStats.trades++;
  questStats.made[selectedMarketItem] = (questStats.made[selectedMarketItem] || 0) + 1;
  playSfx('trade');

  // if the item is a cow, add it to the cattle coop
  if (selectedMarketItem === 'cow') {
    cows.push(new Cow(cowImg, random(200, 600), random(200, 500)));
    console.log('New cow added to cattle coop!');
  }

  // if the item is a pig, add it to the pig coop
  if (selectedMarketItem === 'pig') {
    pigs.push(new Pig(pigImg, random(200, 600), random(200, 500)));
    console.log('New pig added to pig coop!');
  }

  filledSlots = {};
  updateInventoryDisplay();
  saveInventory();
  console.log(`Traded for 1 ${selectedMarketItem}.`);
}

// attempts to drop `draggedItem` into one of the ingredient slots for the currently
// selected barn/market item. Returns true if the drop was handled (whether or not it
// matched a slot), so the caller knows not to fall through to other drop handling.
function tryFillIngredientSlot(canvasX, canvasY) {
  let selectedItem, requirements, box;

  if (currentWorld === 'barn' && selectedStockItem) {
    selectedItem = selectedStockItem;
    requirements = tradeRequirements[selectedStockItem];
    box = tradeRect;
  } else if (currentWorld === 'farmersMarket' && marketMode === 'buy' && selectedMarketItem) {
    selectedItem = selectedMarketItem;
    requirements = marketTradeRequirements[selectedMarketItem];
    box = marketTradeRect;
  } else {
    return false;
  }

  const slots = getIngredientSlotRects(requirements, box);
  for (const slot of slots) {
    const insideSlot =
      canvasX >= slot.x && canvasX <= slot.x + slot.w &&
      canvasY >= slot.y && canvasY <= slot.y + slot.h;
    if (!insideSlot) continue;

    if (slot.name !== draggedItem) {
      console.log(`${draggedItem} doesn't belong in the ${slot.name} slot`);
      return true;
    }
    if (filledSlots[slot.name]) {
      console.log(`${slot.name} slot is already filled`);
      return true;
    }
    const needed = requirements[slot.name];
    if (inventory[draggedItem] < needed) {
      console.log(`Not enough ${draggedItem}. Need ${needed}, have ${inventory[draggedItem]}`);
      return true;
    }

    inventory[draggedItem] -= needed;
    filledSlots[slot.name] = true;
    updateInventoryDisplay();
    console.log(`Filled ${slot.name} slot with ${needed}x ${draggedItem}`);

    if (areAllSlotsFilled(selectedItem, requirements)) {
      if (currentWorld === 'barn') executeBarnTrade();
      else executeMarketTrade();
    }
    return true;
  }
  return false;
}

function handleCanvasDrop(e) {
  e.preventDefault();
  // the canvas may be shrunk with CSS on narrow windows (see style.css), so map
  // from its on-screen size back to the 800x650 drawing space, as p5 does for mouseX
  const rect = e.target.getBoundingClientRect();
  const scaleX = rect.width ? width / rect.width : 1;
  const scaleY = rect.height ? height / rect.height : 1;
  const canvasX = (e.clientX - rect.left) * scaleX;
  const canvasY = (e.clientY - rect.top) * scaleY;

  // Farmers Market, sell mode: drop anything sellable into the sell box for coins
  if (currentWorld === 'farmersMarket' && marketMode === 'sell' && draggedItem) {
    if (trySellDrop(canvasX, canvasY)) return;
  }

  // Barn/Farmers Market: drag a required ingredient into its slot in the trade box
  if ((currentWorld === 'barn' || currentWorld === 'farmersMarket') && draggedItem) {
    if (tryFillIngredientSlot(canvasX, canvasY)) return;
  }

  // Duck Pond: drop bread to feed ducks
  if (currentWorld === 'duckPond' && draggedItem === 'bread') {
    // check if drop is in valid duck pond area
    if (canvasX >= 150 && canvasX <= 600 && canvasY >= 200 && canvasY <= 450) {
      breadCrumbs.push(new BreadCrumb(canvasX, canvasY));
      inventory.bread--;
      updateInventoryDisplay();
      console.log(`Dropped bread at (${canvasX}, ${canvasY})`);
      return;
    }
  }

  // note: garden planting is no longer handled via drag-and-drop - click a seed in
  // the inventory to select it, then press SPACE near an empty garden cell to plant
  // (see selectedSeed, findPlantableGridCell(), and plantSeedAt())
}

// convert canvas coordinates to grid row/col
// Uses the same cell rects that drawGardenGrid() draws (via getCellRect), so the
// plot you click is the plot that lights up. The old version used a separate,
// wider quad whose cells were up to 15px off from the drawn ones.
function getGridCoordinates(canvasX, canvasY) {
  const rows = 6, cols = 8;
  const pad = 1.5; // the drawn cells nearly tile; this closes the hairline gaps between them
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const c = getCellRect(row, col);
      if (canvasX >= c.x - pad && canvasX <= c.x + c.w + pad &&
          canvasY >= c.y - pad && canvasY <= c.y + c.h + pad) {
        return { row, col };
      }
    }
  }
  return null;
}
