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

let homeSize = 100;
let backArrowSize = 60;
let currentWorld = 'start'; // start, home, chickenCoop, barn, garden, leftExtend, rightExtend, cattleCoop, duckPond, farmersMarket, pigCoop
let previousWorld = null; // track previous world for back navigation

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

// drag and drop variables
let isDragging = false;
let draggedItem = null;
let draggedElement = null;

// guide overlay
let showGuide = false;

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
    
    // increment egg timer
    this.eggTimer += 1/60;
    
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
    image(this.img, this.x, this.y, this.size, this.size);
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
    this.happiness = 0;
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
        this.happiness = 120; // happy for 2 seconds
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
    
    if (this.happiness > 0) {
      this.happiness--;
    }
  }

  draw() {
    image(this.img, this.x, this.y, this.size, this.size);
    
    // show heart if happy
    if (this.happiness > 0) {
      fill(255, 100, 150);
      noStroke();
      textSize(20);
      text('♥', this.x + this.size/2 - 5, this.y - 5);
    }
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
    
    this.milkTimer += 1/60;
    
    if (this.milkTimer >= this.milkProduceTime) {
      console.log('Milk!');
      milks.push(new Milk(this.x, this.y));
      
      this.milkTimer = 0;
      this.milkProduceTime = random(30, 60);
    }
  }

  draw() {
    image(this.img, this.x, this.y, this.size, this.size);
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
    
    this.baconTimer += 1/60;
    
    if (this.baconTimer >= this.baconProduceTime) {
      console.log('Bacon!');
      bacons.push(new Bacon(this.x, this.y));
      
      this.baconTimer = 0;
      this.baconProduceTime = random(15, 60);
    }
  }

  draw() {
    image(this.img, this.x, this.y, this.size, this.size);
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
    this.growthSpeed = 0.0015;
  }
  
  draw() {
    // draw the current growth stage
    image(this.sheet, this.x, this.y, this.w, this.h, 
          this.sheetW * this.growthStage, 0, this.sheetW, this.sheetH);
  }
  
  update() {
    // only grow if not fully grown
    if (this.growthStage < 2) {
      this.growthTimer += this.growthSpeed;
      
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
    return this.growthStage === 2;
  }
  
  // harvest the crop
  harvest() {
    if (this.isHarvestable()) {
      console.log(`Harvested ${this.itemName}!`);
      return true;
    }
    return false;
  }
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
}

function setup() {
  let canvas = createCanvas(800, 650);
  noiseDetail(24);
  canvas.parent('canvas-container');
  canvas.elt.style.border = '5px solid darkgreen';
  
  loadInventory();
  
  initializeInventory();
  console.log('inventory initialized');
  
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
  
  // setup canvas drop handling after delay
  setTimeout(() => {
    setupCanvasDropHandling();
  }, 100);
  console.log('game setup complete!');
}

// helper function to change worlds and track history
function changeWorld(newWorld) {
  previousWorld = currentWorld;
  currentWorld = newWorld;
  console.log(`Changed from ${previousWorld} to ${currentWorld}`);
}

function draw() {
  // START SCREEN
  if (currentWorld === 'start') {
    image(startpage, 0, 0, width, height);
    return; // do NOT draw the home button on start
  }

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

  // display world
  if (currentWorld === 'home') {
    image(farmBg, 0, 0, width, height);
    // draw navigation arrows
    image(leftArrow, 20, height/2 - 60, 90, 120);
    image(rightArrow, width - 110, height/2 - 60, 90, 120);
  } else if (currentWorld === 'leftExtend') {
    image(leftExtendBg, 0, 0, width, height);
    // draw right arrow to return to home
    image(rightArrow, width - 110, height/2 - 60, 90, 120);
  } else if (currentWorld === 'rightExtend') {
    image(rightExtendBg, 0, 0, width, height);
    // draw left arrow to return to home
    image(leftArrow, 20, height/2 - 60, 90, 120);
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
    image(gardenBg, 0, 0, width, height);
    drawGardenGrid();
  } else if (currentWorld === 'barn') {
    image(barn, 0, 0, width, height);
    drawBarnStock();
    drawTradeArea();
  }

  // draw back arrow (only in sub-worlds)
  const subWorlds = ['cattleCoop', 'duckPond', 'farmersMarket', 'chickenCoop', 'garden', 'barn', 'pigCoop'];
  if (subWorlds.includes(currentWorld)) {
    image(backArrow, 10, 10, backArrowSize, backArrowSize);
  }

  drawHomeButton();
  drawGuideIcon();
  if (showGuide) {
    drawGuideOverlay();
}
}

function drawHomeButton() {
  image(home, 5, height - homeSize - 5, homeSize, homeSize);
}

function drawGuideIcon() {
  let size = 80;
  let padding = 10;
  let x = width - size - padding;
  let y = height - size - padding;

  image(guideIcon, x, y, size, size);
}

//instruction overlay
function drawGuideOverlay() {
  // dark background overlay
  fill(0, 180);
  rect(0, 0, width, height);

  // center guide image
  let imgW = width * 0.8;
  let imgH = height * 0.8;

  image(
    guideImg, 
    (width - imgW) / 2,
    (height - imgH) / 2,
    imgW,
    imgH
  );

  // close hint
  fill(255);
  textAlign(CENTER);
  textSize(14);
  text("Click anywhere to close", width / 2, height - 30);
}

// 6x8 grid
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
        // grid lines (*removed*)
        fill(0,0,0,0);
        noStroke();
        rect(px - cellW/2, py - cellH/2, cellW, cellH);
      }
    }
  }
}

function drawBarnStock() {
  //  stock grid
  const colW = 80, rowH = 80;
  const startX = 100, startY = 40;

  for (let i = 0; i < barnItems.length; i++) {
    const k = barnItems[i];
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = startX + col * (colW + 20);
    const y = startY + row * (rowH + 14);

    // frame
    noFill();
    stroke(200);
    rect(x, y, colW, rowH, 6);

    // sprite sheet harvest frame (right 1/3)
    const imgIndex = producePaths.findIndex(p => p.includes(k));
    if (imgIndex !== -1) {
      const sheet = produceImgs[imgIndex];
      const frameW = sheet.width / 3;
      image(sheet, x, y, colW, rowH, frameW * 2, 0, frameW, sheet.height);
    }

    // show item name
    noStroke();
    fill(255);
    textSize(12);
    text(`${k}`, x, y + rowH + 12);

    // highlight item if selected
    if (selectedStockItem === k) {
      noFill();
      stroke(255, 215, 0);
      strokeWeight(3);
      rect(x - 2, y - 2, colW + 4, rowH + 4, 8);
      strokeWeight(1);
    }
  }
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

function drawTradeArea() {
  // add background fill before drawing the rectangle
  fill(50, 50, 50, 180); // dark semi-transparent background
  rect(tradeRect.x, tradeRect.y, tradeRect.w, tradeRect.h, 10);
  
  // then draw the border
  noFill();
  stroke(180);
  rect(tradeRect.x, tradeRect.y, tradeRect.w, tradeRect.h, 10);

  // selected target item and requirements
  if (selectedStockItem) {
    const imgIndex = producePaths.findIndex(p => p.includes(selectedStockItem));
    if (imgIndex !== -1) {
      const sheet = produceImgs[imgIndex];
      const frameW = sheet.width / 3;
      image(sheet, tradeRect.x + 10, tradeRect.y + 10, 65, 80, frameW * 2, 0, frameW, sheet.height);

      noStroke();
      fill(255);
      textSize(20);
      text(`${selectedStockItem}`, tradeRect.x + 75, tradeRect.y + 35);
      
      // show requirements
      const requirements = tradeRequirements[selectedStockItem];
      let yOffset = 60;
      for (let item in requirements) {
        const hasEnough = inventory[item] >= requirements[item];
        fill(hasEnough ? (150, 255, 150) : (255, 100, 100));
        fill(255, 255, 150);
        textSize(20);
        text(`${requirements[item]}x ${item}`, tradeRect.x + 75, tradeRect.y + yOffset);
        yOffset += 20;
      }
    }
  } else {
    noStroke();
    fill(255);
    textSize(20);
    text('Select an item', tradeRect.x + 50, tradeRect.y + 50);
  }
}

function drawMarketStock() {
  // market stock grid
  const colW = 80, rowH = 80;
  const startX = 100, startY = 40;

  for (let i = 0; i < marketItems.length; i++) {
    const k = marketItems[i];
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = startX + col * (colW + 20);
    const y = startY + row * (rowH + 14);

    // frame
    noFill();
    stroke(200);
    rect(x, y, colW, rowH, 6);

    // draw item image
    if (k === 'cow') {
      image(cowImg, x, y, colW, rowH);
    } else if (k === 'bread') {
      image(breadImg, x, y, colW, rowH);
    } else if (k === 'pig') {
      image(pigImg, x, y, colW, rowH);
    } else if (k === 'pie') {
      image(pieImg, x, y, colW, rowH);
    } else if (k === 'cheese') {
      image(cheeseImg, x, y, colW, rowH);
    } else if (k === 'sandwich') {
      image(sandwichImg, x, y, colW, rowH);
    } else if (k === 'applejam') {
      image(appleJamImg, x, y, colW, rowH);
    } else if (k === 'carrotcake') {
      image(carrotCakeImg, x, y, colW, rowH);
    }

    // show item name
    noStroke();
    fill(255);
    textSize(12);
    text(`${k}`, x, y + rowH + 12);

    // highlight item if selected
    if (selectedMarketItem === k) {
      noFill();
      stroke(255, 215, 0);
      strokeWeight(3);
      rect(x - 2, y - 2, colW + 4, rowH + 4, 8);
      strokeWeight(1);
    }
  }
}

function drawMarketTradeArea() {
  // add background fill before drawing the rectangle
  fill(50, 50, 50, 180); // dark semi-transparent background
  rect(marketTradeRect.x, marketTradeRect.y, marketTradeRect.w, marketTradeRect.h, 10);
  
  // then draw the border
  noFill();
  stroke(180);
  rect(marketTradeRect.x, marketTradeRect.y, marketTradeRect.w, marketTradeRect.h, 10);

  // selected target item and requirements
  if (selectedMarketItem) {
    // draw item image
    if (selectedMarketItem === 'cow') {
      image(cowImg, marketTradeRect.x + 10, marketTradeRect.y + 10, 80, 80);
    } else if (selectedMarketItem === 'bread') {
      image(breadImg, marketTradeRect.x + 10, marketTradeRect.y + 10, 80, 80);
    } else if (selectedMarketItem === 'pig') {
      image(pigImg, marketTradeRect.x + 10, marketTradeRect.y + 10, 80, 80);
    } else if (selectedMarketItem === 'pie') {
      image(pieImg, marketTradeRect.x + 10, marketTradeRect.y + 10, 80, 80);
    } else if (selectedMarketItem === 'cheese') {
      image(cheeseImg, marketTradeRect.x + 10, marketTradeRect.y + 10, 80, 80);
    } else if (selectedMarketItem === 'sandwich') {
      image(sandwichImg, marketTradeRect.x + 10, marketTradeRect.y + 10, 80, 80);
    } else if (selectedMarketItem === 'applejam') {
      image(appleJamImg, marketTradeRect.x + 10, marketTradeRect.y + 10, 80, 80);
    } else if (selectedMarketItem === 'carrotcake') {
      image(carrotCakeImg, marketTradeRect.x + 10, marketTradeRect.y + 10, 80, 80);
    }

    noStroke();
    fill(255);
    textSize(20);
    text(`${selectedMarketItem}`, marketTradeRect.x + 100, marketTradeRect.y + 35);
    
    // show requirements
    const requirements = marketTradeRequirements[selectedMarketItem];
    let yOffset = 60;
    for (let item in requirements) {
      const hasEnough = inventory[item] >= requirements[item];
      fill(hasEnough ? (150, 255, 150) : (255, 100, 100));
      fill(255, 255, 150);
      textSize(20);
      text(`${requirements[item]}x ${item}`, marketTradeRect.x + 100, marketTradeRect.y + yOffset);
      yOffset += 20;
    }
  } else {
    noStroke();
    fill(255);
    textSize(20);
    text('Select an item', marketTradeRect.x + 50, marketTradeRect.y + 50);
  }
}

function mousePressed() {
  console.log(`Mouse clicked at (${mouseX}, ${mouseY}) in world: ${currentWorld}`);

  // CLICK TO START GAME
  if (currentWorld === 'start') {
    changeWorld('home');
    return;
  }

  // back arrow navigation (top left corner)
  if (currentWorld !== 'start' && currentWorld !== 'home') {
    if (mouseX >= 10 && mouseX <= 10 + backArrowSize && mouseY >= 10 && mouseY <= 10 + backArrowSize) {
      if (previousWorld && previousWorld !== 'start') {
        console.log(`Navigating back to ${previousWorld}`);
        currentWorld = previousWorld;
        previousWorld = null; // clear history after going back
        return;
      }
    }
  }

  // guide icon click
  let guideSize = 80;
  let guidePadding = 10;
  let guideX = width - guideSize - guidePadding;
  let guideY = height - guideSize - guidePadding;
  
  if (showGuide) {
    // close guide overlay when clicking anywhere
    showGuide = false;
    return;
  }
  
  if (
    mouseX >= guideX &&
    mouseX <= guideX + guideSize &&
    mouseY >= guideY &&
    mouseY <= guideY + guideSize
  ) {
    showGuide = true;
    return;
  }

  // home button for nav
  if (
    mouseX > 5 &&
    mouseX < 5 + homeSize &&
    mouseY > height - homeSize - 5 &&
    mouseY < height - 5
  ) {
    changeWorld('home');
    return;
  }

  // arrow navigation from home
  if (currentWorld === 'home') {
    // left arrow click
    if (mouseX >= 20 && mouseX <= 110 && mouseY >= height/2 - 60 && mouseY <= height/2 + 60) {
      changeWorld('leftExtend');
      return;
    }
    // right arrow click
    if (mouseX >= width - 110 && mouseX <= width - 20 && mouseY >= height/2 - 60 && mouseY <= height/2 + 60) {
      changeWorld('rightExtend');
      return;
    }
    
    // hub navigation
    if (isPointInQuad(mouseX, mouseY, 100, 135, 300, 135, 300, 340, 100, 340)) {
      changeWorld('chickenCoop'); return;
    } else if (isPointInQuad(mouseX, mouseY, 255, 430, 565, 430, 565, 600, 255, 600)) {
      changeWorld('garden'); return;
    } else if (isPointInQuad(mouseX, mouseY, 350, 85, 575, 85, 525, 260, 380, 260)) {
      changeWorld('barn'); return;
    }
  }

  // navigation from leftExtend
  if (currentWorld === 'leftExtend') {
    // right arrow click to return to home
    if (mouseX >= width - 110 && mouseX <= width - 20 && mouseY >= height/2 - 60 && mouseY <= height/2 + 60) {
      changeWorld('home');
      return;
    }
    // cattle coop navigation
    if (isPointInQuad(mouseX, mouseY, 175, 165, 400, 12, 680, 170, 460, 300)) {
      changeWorld('cattleCoop');
      return;
    }
    // duck pond navigation
    if (isPointInQuad(mouseX, mouseY, 35, 340, 120, 270, 250, 355, 155, 430)) {
      changeWorld('duckPond');
      return;
    }
    // farmers market navigation
    if (isPointInQuad(mouseX, mouseY, 230, 420, 560, 420, 560, 615, 230, 615)) {
      changeWorld('farmersMarket');
      return;
    }
  }
  
    // navigation from rightExtend
  if (currentWorld === 'rightExtend') {
    // left arrow click to return to home
    if (mouseX >= 20 && mouseX <= 110 && mouseY >= height/2 - 60 && mouseY <= height/2 + 60) {
      changeWorld('home');
      return;
    }
    // pig coop navigation
    if (isPointInQuad(mouseX, mouseY, 100, 410, 330, 410, 330, 605, 100, 605)) {
      changeWorld('pigCoop');
      return;
    }
  }

  // collect eggs by clicking
  if (currentWorld === 'chickenCoop') {
    for (let i = eggs.length - 1; i >= 0; i--) {
      const egg = eggs[i];
      if (dist(mouseX, mouseY, egg.x, egg.y) < egg.size / 2) {
        inventory.egg++;
        eggs.splice(i, 1);
        updateInventoryDisplay();
        return;
      }
    }
  }
  
  // collect milk by clicking
  if (currentWorld === 'cattleCoop') {
    for (let i = milks.length - 1; i >= 0; i--) {
      const milk = milks[i];
      if (dist(mouseX, mouseY, milk.x, milk.y) < milk.size / 2) {
        inventory.milk++;
        milks.splice(i, 1);
        updateInventoryDisplay();
        return;
      }
    }
  }
  
  // collect bacon by clicking
  if (currentWorld === 'pigCoop') {
    for (let i = bacons.length - 1; i >= 0; i--) {
      const bacon = bacons[i];
      if (dist(mouseX, mouseY, bacon.x, bacon.y) < bacon.size / 2) {
        inventory.bacon++;
        bacons.splice(i, 1);
        updateInventoryDisplay();
        return;
      }
    }
  }

  // select stock item in the barn
  if (currentWorld === 'barn') {
    const startX = 100, startY = 40;
    const colW = 80, rowH = 80;

    for (let i = 0; i < barnItems.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = startX + col * (colW + 20);
      const y = startY + row * (rowH + 14);
      if (mouseX >= x && mouseX <= x + colW && mouseY >= y && mouseY <= y + rowH) {
        selectedStockItem = barnItems[i];
        console.log(`Selected stock item: ${selectedStockItem}`);
        return;
      }
    }
  }

  // select market item in the farmers market
  if (currentWorld === 'farmersMarket') {
    const startX = 100, startY = 40;
    const colW = 80, rowH = 80;

    for (let i = 0; i < marketItems.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = startX + col * (colW + 20);
      const y = startY + row * (rowH + 14);
      if (mouseX >= x && mouseX <= x + colW && mouseY >= y && mouseY <= y + rowH) {
        selectedMarketItem = marketItems[i];
        console.log(`Selected market item: ${selectedMarketItem}`);
        return;
      }
    }
  }

  // handle right-click to harvest items from garden grid
  else if (currentWorld === 'garden' && mouseButton === RIGHT) {
    console.log('right-click detected in garden');
    const gridCoords = getGridCoordinates(mouseX, mouseY);
    if (gridCoords && gardenGrid[gridCoords.row][gridCoords.col] !== null) {
      let crop = gardenGrid[gridCoords.row][gridCoords.col];
      
      console.log(`attempting to harvest ${crop.itemName} from grid position (${gridCoords.row}, ${gridCoords.col})`);
      
      // check if crop is harvestable
      if (crop.isHarvestable()) {
        // harvest the crop
        crop.harvest();
        
        // return 3 items to inventory (harvest bonus!)
        if (inventory[crop.itemName] !== undefined) {
          inventory[crop.itemName] += 3;
          console.log(`harvested ${crop.itemName} (+3) to inventory. New count: ${inventory[crop.itemName]}`);
          updateInventoryDisplay();
        }
        
        // remove from grid
        gardenGrid[gridCoords.row][gridCoords.col] = null;
        saveInventory();
        console.log('crop harvested and removed from grid');
      } else {
        console.log(`${crop.itemName} is not ready to harvest yet (stage ${crop.growthStage + 1}/3)`);
      }
    } else {
      console.log('no crop to harvest at clicked position');
    }
  }
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

function saveInventory() {
  // save game state
  const gameState = {
    inventory: inventory,
    cowsCount: cows.length,
    pigsCount: pigs.length,
    gardenCrops: []
  };
  
  // save garden crops
  for (let row = 0; row < gardenGrid.length; row++) {
    for (let col = 0; col < gardenGrid[row].length; col++) {
      if (gardenGrid[row][col] !== null) {
        const crop = gardenGrid[row][col];
        gameState.gardenCrops.push({
          row: row,
          col: col,
          itemName: crop.itemName,
          growthStage: crop.growthStage,
          growthTimer: crop.growthTimer
        });
      }
    }
  }
  
  localStorage.setItem('farmInventory', JSON.stringify(gameState));
  console.log('Game state saved to localStorage');
}

function loadInventory() {
  const savedData = localStorage.getItem('farmInventory');
  if (savedData) {
    const gameState = JSON.parse(savedData);
    
    // load inventory
    if (gameState.inventory) {
      Object.keys(inventory).forEach(key => {
        if (gameState.inventory.hasOwnProperty(key)) {
          inventory[key] = gameState.inventory[key];
        }
      });
    } else {
      // old format compatibility - gameState is just inventory
      Object.keys(inventory).forEach(key => {
        if (gameState.hasOwnProperty(key)) {
          inventory[key] = gameState[key];
        }
      });
    }
    
    // load cows
    if (gameState.cowsCount) {
      for (let i = 0; i < gameState.cowsCount; i++) {
        cows.push(new Cow(cowImg, random(200, 600), random(200, 500)));
      }
      console.log(`Loaded ${gameState.cowsCount} cows`);
    }
    
    // load pigs
    if (gameState.pigsCount) {
      for (let i = 0; i < gameState.pigsCount; i++) {
        pigs.push(new Pig(pigImg, random(200, 600), random(200, 500)));
      }
      console.log(`Loaded ${gameState.pigsCount} pigs`);
    }
    
    // load garden crops
    if (gameState.gardenCrops) {
      gameState.gardenCrops.forEach(savedCrop => {
        const itemIndex = producePaths.findIndex(p => p.includes(savedCrop.itemName));
        if (itemIndex !== -1) {
          const crop = new Crop(
            produceImgs[itemIndex],
            savedCrop.itemName,
            0, 0, 0, 0  // position will be updated in draw
          );
          crop.growthStage = savedCrop.growthStage;
          crop.growthTimer = savedCrop.growthTimer;
          gardenGrid[savedCrop.row][savedCrop.col] = crop;
        }
      });
      console.log(`Loaded ${gameState.gardenCrops.length} crops`);
    }
    
    console.log('Game state loaded from localStorage');
  } else {
    console.log('No saved game state found');
  }
}

// initialize the HTML inventory grid
function initializeInventory() {
  console.log('initializing inventory grid...');
  const inventoryGrid = document.getElementById('inventory-grid');
  if (!inventoryGrid) {
    console.log('inventory grid element not found!');
    return;
  }
  
  // clear existing content
  inventoryGrid.innerHTML = '';
  
  // create inventory slots
  Object.keys(inventory).forEach((itemName, index) => {
    const slot = document.createElement('div');
    slot.className = 'inventory-slot';
    slot.setAttribute('data-item', itemName);
    
    if (inventory[itemName] > 0) {
      console.log(`Creating slot for ${itemName} (count: ${inventory[itemName]})`);
      const item = document.createElement('div');
      item.className = 'inventory-item';
      item.style.backgroundImage = `url('produce/${itemName}.png')`;
      
      // applysprite sheet styling for crops ONLY
      if (itemName !== 'egg' && itemName !== 'cow' && itemName !== 'bread' && itemName !== 'milk' && itemName !== 'bacon' && itemName !== 'pie' && itemName !== 'cheese' && itemName !== 'sandwich' && itemName !== 'applejam' && itemName !== 'carrotcake') {
        item.style.backgroundSize = '300% 100%'; // 3x width to show 1/3
        item.style.backgroundPosition = 'right center'; // shows the harvest crop
      } else {
        item.style.backgroundSize = 'cover'; // entire img
        item.style.backgroundPosition = 'center';
      }
      
      item.setAttribute('draggable', 'true');
      item.setAttribute('data-item', itemName);
      
      const count = document.createElement('div');
      count.className = 'inventory-count';
      count.textContent = inventory[itemName];
      
      item.appendChild(count);
      slot.appendChild(item);
      
      // add drag event listeners
      item.addEventListener('dragstart', handleDragStart);
      item.addEventListener('dragend', handleDragEnd);
    } else {
      console.log(`creating empty slot for ${itemName}`);
    }
    
    inventoryGrid.appendChild(slot);
  });
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
  
  // hide the default drag ghost image
  let img = new Image();
  img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  e.dataTransfer.setDragImage(img, 0, 0);
  
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
        const item = document.createElement('div');
        item.className = 'inventory-item';
        item.style.backgroundImage = `url('produce/${itemName}.png')`;
        
        if (itemName !== 'egg' && itemName !== 'cow' && itemName !== 'bread' && itemName !== 'milk' && itemName !== 'bacon' && itemName !== 'pie' && itemName !== 'cheese' && itemName !== 'sandwich' && itemName !== 'applejam' && itemName !== 'carrotcake') {
          item.style.backgroundSize = '300% 100%';
          item.style.backgroundPosition = 'right center';
        } else {
          item.style.backgroundSize = 'cover';
          item.style.backgroundPosition = 'center';
        }
        
        item.setAttribute('draggable', 'true');
        item.setAttribute('data-item', itemName);
        
        const count = document.createElement('div');
        count.className = 'inventory-count';
        count.textContent = inventory[itemName];
        
        item.appendChild(count);
        slot.appendChild(item);
        
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
      } else {
        // update count
        const countElement = existingItem.querySelector('.inventory-count');
        if (countElement) {
          countElement.textContent = inventory[itemName];
        }
      }
    } else {
      // remove item if count is 0
      if (existingItem) {
        existingItem.remove();
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

function handleCanvasDrop(e) {
  e.preventDefault();
  const rect = e.target.getBoundingClientRect();
  const canvasX = e.clientX - rect.left;
  const canvasY = e.clientY - rect.top;

  // Barn Trade: drop onto tradeRect to exchange
  if (currentWorld === 'barn' && selectedStockItem) {
    const insideTrade =
      canvasX >= tradeRect.x && canvasX <= tradeRect.x + tradeRect.w &&
      canvasY >= tradeRect.y && canvasY <= tradeRect.y + tradeRect.h;

    if (insideTrade) {
      // check required items
      const requirements = tradeRequirements[selectedStockItem];
      let canTrade = true;
      
      for (let item in requirements) {
        if (inventory[item] < requirements[item]) {
          canTrade = false;
          console.log(`Not enough ${item}. Need ${requirements[item]}, have ${inventory[item]}`);
          break;
        }
      }
      
      // Trade execution
      if (canTrade) {
        // exchange: remove all required items
        for (let item in requirements) {
          inventory[item] -= requirements[item];
        }
        
        // give the selected item
        inventory[selectedStockItem]++;

        updateInventoryDisplay();
        console.log(`Traded for 1 ${selectedStockItem}.`);
      } else {
        console.log('Trade failed: insufficient items.');
      }
      return; // stop further handling
    }
  }

  // Farmers Market Trade: drop onto marketTradeRect to exchange
  if (currentWorld === 'farmersMarket' && selectedMarketItem) {
    const insideMarketTrade =
      canvasX >= marketTradeRect.x && canvasX <= marketTradeRect.x + marketTradeRect.w &&
      canvasY >= marketTradeRect.y && canvasY <= marketTradeRect.y + marketTradeRect.h;

    if (insideMarketTrade) {
      // check required items
      const requirements = marketTradeRequirements[selectedMarketItem];
      let canTrade = true;
      
      for (let item in requirements) {
        if (inventory[item] < requirements[item]) {
          canTrade = false;
          console.log(`Not enough ${item}. Need ${requirements[item]}, have ${inventory[item]}`);
          break;
        }
      }
      
      // Trade execution
      if (canTrade) {
        // exchange: remove all required items
        for (let item in requirements) {
          inventory[item] -= requirements[item];
        }
        
        // give the selected market item
        inventory[selectedMarketItem]++;
        
        // if the item is a cow, add it to the cattle coop
        if (selectedMarketItem === 'cow') {
          cows.push(new Cow(cowImg, random(200, 600), random(200, 500)));
          console.log('New cow added to cattle coop!');
          saveInventory();
        }
        
        // if the item is a pig, add it to the pig coop
        if (selectedMarketItem === 'pig') {
          pigs.push(new Pig(pigImg, random(200, 600), random(200, 500)));
          console.log('New pig added to pig coop!');
          saveInventory();
        }

        updateInventoryDisplay();
        console.log(`Traded for 1 ${selectedMarketItem}.`);
      } else {
        console.log('Trade failed: insufficient items.');
      }
      return; // stop further handling
    }
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

  // garden planting
  if (!isDragging || !draggedItem || currentWorld !== 'garden') {
    console.log(`drop invalid - isDragging: ${isDragging}, draggedItem: ${draggedItem}, world: ${currentWorld}`);
    return;
  }

  const canvasY2 = canvasY;
  const canvasX2 = canvasX;

  const gridCoords = getGridCoordinates(canvasX2, canvasY2);
  if (gridCoords && gardenGrid[gridCoords.row][gridCoords.col] === null) {
    const itemIndex = producePaths.findIndex(path => path.includes(draggedItem));
    if (itemIndex !== -1) {
      let x1 = 150, y1 = 150, x2 = 630, y2 = 150, x3 = 630, y3 = 515, x4 = 150, y4 = 515;
      let rows = 6, cols = 8;
      let col = gridCoords.col;
      let row = gridCoords.row;

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
        draggedItem,
        px - cellW/2,
        py - cellH/2,
        cellW,
        cellH
      );

      gardenGrid[row][col] = crop;
      inventory[draggedItem]--;
      updateInventoryDisplay();
      console.log(`Planted ${draggedItem} at (${row},${col})`);
    }
  } else if (gridCoords) {
    console.log(`grid cell (${gridCoords.row}, ${gridCoords.col}) is occupied`);
  } else {
    console.log('drop position is outside garden grid');
  }
}

// convert canvas coordinates to grid row/col
function getGridCoordinates(canvasX, canvasY) {
  console.log(`converting canvas coordinates (${canvasX}, ${canvasY}) to grid coordinates`);
  // garden grid coordinates
  let x1 = 150, y1 = 150, x2 = 630, y2 = 150, x3 = 630, y3 = 515, x4 = 150, y4 = 515;
  let rows = 6, cols = 8;
  
  // check if point is inside the garden area
  if (!isPointInQuad(canvasX, canvasY, x1, y1, x2, y2, x3, y3, x4, y4)) {
    return null;
  }
  
  // which grid cell was clicked
  let cellW = (x2 - x1) / cols;
  let cellH = (y4 - y1) / rows;
  
  let col = Math.floor((canvasX - x1) / cellW);
  let row = Math.floor((canvasY - y1) / cellH);
  
  console.log(`calculated grid position: row ${row}, col ${col}`);
  
  // check coordinates are within bounds
  if (row >= 0 && row < rows && col >= 0 && col < cols) {
    return { row, col };
  }
  
  return null;
}
