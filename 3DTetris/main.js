// merged_main.js with 3D UI Boxes

import gridUtils from './gridUtils.js';

let loadedFont = null;
const fontLoader = new THREE.FontLoader();
fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
  loadedFont = font;
});

const {
  gridArray,
  positionToGridIndex,
  isCellOccupied,
  setGridCell,
  clearRow,
  shiftRowsDown,
  GRID_ROWS,
  GRID_COLS,
  CELL_SIZE
} = gridUtils;

const GRID_WIDTH = GRID_COLS * CELL_SIZE;
const GRID_HEIGHT = GRID_ROWS * CELL_SIZE;

let canvas = document.getElementById("gl-canvas");
let context = canvas.getContext("webgl2", { alpha: false });
let scene = new THREE.Scene();
scene.background = new THREE.Color(0xaac0dd);
scene.fog = new THREE.Fog(0xcce0ff, 50, 2000);

let width = canvas.clientWidth,
  height = canvas.clientHeight;

  let camera = new THREE.OrthographicCamera(
    width / -2, width / 2,
    height / 2, height / -2,
    -1000, 1000  // <- expanded z range
  );
  camera.position.z = 100; // <- bring closer to center of objects
  

let renderer = new THREE.WebGLRenderer({ canvas: canvas, context: context });
renderer.setSize(width, height, false);
renderer.setPixelRatio(window.devicePixelRatio || 1);

let controls = new THREE.OrbitControls(camera, canvas);

function resizeCanvas(forceResize = false) {
  let w = canvas.clientWidth;
  let h = canvas.clientHeight;
  if (width !== w || height !== h || forceResize) {
    width = w;
    height = h;
    renderer.setSize(w, h, false);
    camera.left = w / -2;
    camera.right = w / 2;
    camera.top = h / 2;
    camera.bottom = h / -2;
    camera.updateProjectionMatrix();
  }
}
resizeCanvas(true);

// Lighting
scene.add(new THREE.AmbientLight(0xaaaaaa));
scene.add(new THREE.HemisphereLight(0x303f9f, 0x000000, 0.5));
let directionalLight = new THREE.DirectionalLight(0xdfebff, 1);
directionalLight.position.set(20, 20, 100);
scene.add(directionalLight);

// Grid
let gridMaterial = new THREE.LineBasicMaterial({ color: 0x808080 });
let vertGeometry = new THREE.BufferGeometry();
let vertLines = new Float32Array(10 * 3 * 2);
for (let i = 0; i < 10; i++) {
  vertLines[i * 6] = -100 + i * 20;
  vertLines[i * 6 + 1] = -200;
  vertLines[i * 6 + 2] = 0;
  vertLines[i * 6 + 3] = -100 + i * 20;
  vertLines[i * 6 + 4] = 200;
  vertLines[i * 6 + 5] = 0;
}
vertGeometry.setAttribute("position", new THREE.BufferAttribute(vertLines, 3));
scene.add(new THREE.LineSegments(vertGeometry, gridMaterial));

let horiGeometry = new THREE.BufferGeometry();
let horiLines = new Float32Array(20 * 3 * 2);
for (let i = 0; i < 20; i++) {
  horiLines[i * 6] = -100;
  horiLines[i * 6 + 1] = -200 + i * 20;
  horiLines[i * 6 + 2] = 0;
  horiLines[i * 6 + 3] = 100;
  horiLines[i * 6 + 4] = -200 + i * 20;
  horiLines[i * 6 + 5] = 0;
}
horiGeometry.setAttribute("position", new THREE.BufferAttribute(horiLines, 3));
scene.add(new THREE.LineSegments(horiGeometry, gridMaterial));

// Ground
let groundGeometry = new THREE.PlaneBufferGeometry(200, 400);
let groundMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
groundMaterial.side = THREE.DoubleSide;
let ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.position.set(0, 0, -1);
scene.add(ground);

// ============ 3D UI Boxes with Labels ============ //
const uiBoxMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.1, roughness: 0.8 });
const uiBoxGeometry = new THREE.BoxGeometry(80, 80, 40);

// Hold Box
const holdBox = new THREE.Mesh(uiBoxGeometry, uiBoxMaterial);
holdBox.position.set(-160, 100, 0);
scene.add(holdBox);

// Add 3D text label for Hold
const holdTextLoader = new THREE.FontLoader();
holdTextLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
  const textGeo = new THREE.TextGeometry('Hold', {
    font: font,
    size: 10,
    height: 2,
  });
  const textMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const textMesh = new THREE.Mesh(textGeo, textMat);
  textMesh.position.set(-190, 135, 25);
  scene.add(textMesh);
});

// Next Box
const nextBox = new THREE.Mesh(uiBoxGeometry, uiBoxMaterial);
nextBox.position.set(160, 100, 0);
scene.add(nextBox);

// Add 3D text label for Next
const nextTextLoader = new THREE.FontLoader();
nextTextLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
  const textGeo = new THREE.TextGeometry('Next Piece', {
    font: font,
    size: 10,
    height: 2,
  });
  const textMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const textMesh = new THREE.Mesh(textGeo, textMat);
  textMesh.position.set(130, 135, 25);
  scene.add(textMesh);
});




// ============ All Tetris Blocks ============ //
function createBlock(material, xOffset, yOffset) {
  const cube = new THREE.Mesh(new THREE.BoxGeometry(CELL_SIZE, CELL_SIZE, 20), material);
  cube.position.set(xOffset * CELL_SIZE, yOffset * CELL_SIZE, 0);
  return cube;
}

function createIBlock() {
  const mat = new THREE.MeshStandardMaterial({ color: 0x00ffff });
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) g.add(createBlock(mat, i, 0));
  return g;
}

function createJBlock() {
  const mat = new THREE.MeshStandardMaterial({ color: 0x0000ff });
  const g = new THREE.Group();
  g.add(createBlock(mat, 0, 1));
  g.add(createBlock(mat, 0, 0));
  g.add(createBlock(mat, 1, 0));
  g.add(createBlock(mat, 2, 0));
  return g;
}

function createLBlock() {
  const mat = new THREE.MeshStandardMaterial({ color: 0xef8a00 });
  const g = new THREE.Group();
  g.add(createBlock(mat, 2, 1));
  g.add(createBlock(mat, 0, 0));
  g.add(createBlock(mat, 1, 0));
  g.add(createBlock(mat, 2, 0));
  return g;
}

function createOBlock() {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffff00 });
  const g = new THREE.Group();
  g.add(createBlock(mat, 0, 0));
  g.add(createBlock(mat, 1, 0));
  g.add(createBlock(mat, 0, 1));
  g.add(createBlock(mat, 1, 1));
  return g;
}

function createSBlock() {
  const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  const g = new THREE.Group();
  g.add(createBlock(mat, 1, 1));
  g.add(createBlock(mat, 2, 1));
  g.add(createBlock(mat, 0, 0));
  g.add(createBlock(mat, 1, 0));
  return g;
}

function createTBlock() {
  const mat = new THREE.MeshStandardMaterial({ color: 0x800080 });
  const g = new THREE.Group();
  g.add(createBlock(mat, 1, 1));
  g.add(createBlock(mat, 0, 0));
  g.add(createBlock(mat, 1, 0));
  g.add(createBlock(mat, 2, 0));
  return g;
}

function createZBlock() {
  const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const g = new THREE.Group();
  g.add(createBlock(mat, 0, 1));
  g.add(createBlock(mat, 1, 1));
  g.add(createBlock(mat, 1, 0));
  g.add(createBlock(mat, 2, 0));
  return g;
}


// ============ 3D Controls UI ============ //
const controlTextLoader = new THREE.FontLoader();
controlTextLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
  const controlsText = `A = LEFT   D = RIGHT   S = DROP   W = ROTATE   SPACE = HARD DROP   SHIFT/C = HOLD`;

  // Create the 3D text
  const textGeo = new THREE.TextGeometry(controlsText, {
    font: font,
    size: 6,
    height: 1,
    curveSegments: 4,
  });

  // Center the text horizontally
  textGeo.computeBoundingBox();
  const textWidth = textGeo.boundingBox.max.x - textGeo.boundingBox.min.x;

  const textMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const textMesh = new THREE.Mesh(textGeo, textMat);
  textMesh.position.set(-textWidth / 2, -240, 11); // centered X, Y slightly above backdrop
  scene.add(textMesh);

  // Backdrop
  const backdropGeo = new THREE.PlaneGeometry(400, 18);
  const backdropMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const backdrop = new THREE.Mesh(backdropGeo, backdropMat);
  backdrop.position.set(0, -232, 10); // same center, slightly behind
  scene.add(backdrop);
  
});

// Start Text
const startTextLoader = new THREE.FontLoader();
startTextLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
  const startText = `Press Space to Start`;

  // Place press space to start text
  const startTextGeo = new THREE.TextGeometry(startText, {
    font: font,
    size: 20,
    height: 2,
  });
  const startTextMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const startTextMesh = new THREE.Mesh(startTextGeo, startTextMat);
  startTextMesh.position.set(-130, -5, 26); // centered X, Y slightly above backdrop
  // Add backdrop for start text
  const startBackdropGeo = new THREE.PlaneGeometry(300, 30);
  const startBackdropMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const startBackdrop = new THREE.Mesh(startBackdropGeo, startBackdropMat);
  startBackdrop.position.set(0, 5, 24); // same center, slightly behind
  scene.add(startBackdrop);
  scene.add(startTextMesh);
});

// Score Text
const scoreTextLoader = new THREE.FontLoader();
scoreTextLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
  
  let scoreText = `Score: ${score}`;
  
  // Place score text
  const scoreTextGeo = new THREE.TextGeometry(scoreText, {
    font: font,
    size: 20,
    height: 2,
  });
  const scoreTextMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const scoreTextMesh = new THREE.Mesh(scoreTextGeo, scoreTextMat);
  scoreTextMesh.position.set(-50, 220, 0);
  scene.add(scoreTextMesh);

});

// Placement functions
function snapToGrid(col, row) {
  const x = -GRID_WIDTH / 2 + col * CELL_SIZE + CELL_SIZE / 2;
  const y = -GRID_HEIGHT / 2 + row * CELL_SIZE + CELL_SIZE / 2;
  return new THREE.Vector3(x, y, 10); // z = 10 as before
}


function centerOfNextBox() {
  const x = nextBox.position.x;
  const y = nextBox.position.y;
  return new THREE.Vector3(x, y, 25); // z stays fixed for now
}


// ============ Game Logic ============ //
//On initialization
// Initialize game state variables
let currentPiece = null; // The current Tetris piece
let holdPiece = null; // The piece currently held by the player
let nextPiece = null; // The next piece to be played
let holdPreview = null; // The preview of the held piece
let nextPreview = null; // The preview of the next piece
let lockedPiece = null; // The piece that is locked in place
let gameStarted = false; // Flag to indicate if the game has started
let gameOver = false; // Flag to indicate if the game is over
let score = 0; // Player's score
let linesCleared = 0; // Number of lines cleared
//let grid = Array.from({ length: 20 }, () => Array(10).fill(0)); // 20 rows, 10 columns
let dropInterval = 1000; // Time interval for dropping pieces
let lastDropTime = 0; // Last time a piece was dropped
let currentRotation = 0; // Current rotation of the piece
let currentPosition = { x: 4, y: 19 }; // Current position of the piece
let isHolding = false; // Flag to indicate if the player is holding a piece

// Piece randomizer
const pieces = [
  createIBlock,
  createJBlock,
  createLBlock,
  createOBlock,
  createSBlock,
  createTBlock,
  createZBlock,
];

function getRandomPiece() {
  const index = Math.floor(Math.random() * pieces.length);
  const piece = pieces[index]();
  piece.position.copy(snapToGrid(4, 19));
  return piece;
}


function rotatePiece() {

}

function handleHoldPiece() {
  if (isHolding) return; // prevent multiple holds per drop
  isHolding = true;

  scene.remove(currentPiece);
  if (holdPiece) {
    // Swap
    const temp = holdPiece;
    holdPiece = currentPiece;
    currentPiece = temp;
    currentPiece.position.copy(snapToGrid(currentPosition.x, currentPosition.y));
    scene.add(currentPiece);
  } else {
    // Store first piece and get a new one
    holdPiece = currentPiece;
    currentPiece = nextPiece;
    currentPiece.position.copy(snapToGrid(4, 19));
    // reset current position
    currentPosition.x = 4;
    currentPosition.y = 19;
    nextPreview = nextPiece.clone();
    nextPreview.position.copy(centerOfNextBox());
    nextPreview.scale.set(0.75, 0.75, 0.75);
    scene.add(nextPreview);
    scene.add(currentPiece);
  }

  // Update hold preview
  if (holdPreview) scene.remove(holdPreview);
  holdPreview = holdPiece.clone();
  holdPreview.position.set(holdBox.position.x, holdBox.position.y, 25);
  holdPreview.scale.set(0.75, 0.75, 0.75);
  scene.add(holdPreview);
}


// check using the grid array if the piece can move to the new position (edit parameters)
function canMoveTo(newX, newY) {
  for (let cube of currentPiece.children) {
    const offset = cube.position.clone().divideScalar(CELL_SIZE);
    const col = newX + Math.round(offset.x);
    const row = newY + Math.round(offset.y);

    // Check bounds
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) {
      return false;
    }

    // Check collision
    if (isCellOccupied(row, col)) {
      return false;
    }
  }

  return true;
}

function movePiece(direction) {
  const deltaX = direction === "left" ? -1 : 1;
  const newX = currentPosition.x + deltaX;

  if (canMoveTo(newX, currentPosition.y)) {
    currentPosition.x = newX;
    currentPiece.position.copy(snapToGrid(currentPosition.x, currentPosition.y));
  }
}

function dropPiece() {
  console.log("Dropping piece down");
  if (canMoveTo(currentPosition.x, currentPosition.y - 1)) {
    currentPosition.y -= 1;
    currentPiece.position.copy(snapToGrid(currentPosition.x, currentPosition.y));
  } else {
    lockPiece(currentPiece);
    checkForLineClears();
    updateCurrentPiece();
  }
}

function hardDropPiece() {
  while (canMoveTo(currentPosition.x, currentPosition.y - 1)) {
    currentPosition.y -= 1;
  }
  currentPiece.position.copy(snapToGrid(currentPosition.x, currentPosition.y));
  lockPiece(currentPiece);
  checkForLineClears();
  updateCurrentPiece();
}

function lockPiece(pieceGroup) {
  pieceGroup.children.forEach(cube => {
    const worldPos = new THREE.Vector3();
    cube.getWorldPosition(worldPos);
    const { row, col } = positionToGridIndex(worldPos.x, worldPos.y);

    if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
      setGridCell(row, col, cube);
    }
  });
}


function updateCurrentPiece() {
  currentPiece = nextPiece;
  currentPiece.position.copy(snapToGrid(4, 19));
  currentPosition.x = 4;
  currentPosition.y = 19;
  // remove old next piece and preview
  scene.remove(nextPreview);
  nextPiece = getRandomPiece();
  nextPreview = nextPiece.clone();
  nextPreview.position.copy(centerOfNextBox());
  nextPreview.scale.set(0.75, 0.75, 0.75);
  scene.add(nextPreview);
  scene.add(currentPiece);
}

function checkForLineClears() {
  for (let row = 0; row < GRID_ROWS; row++) {
    const isFull = gridArray[row].every(cell => cell !== null);
    if (isFull) {
      clearRow(row, scene);
      shiftRowsDown(row);
      row--; // Check the same row again since it was replaced
    }
  }
}


function resetGame() {
  if (holdPreview) scene.remove(holdPreview);
  if (nextPreview) scene.remove(nextPreview);

  gameOver = false;
  score = 0;
  linesCleared = 0;
  lastDropTime = Date.now();
  isHolding = false;

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      if (gridArray[row][col]) {
        scene.remove(gridArray[row][col]);
        gridArray[row][col] = null;
      }
    }
  }

  currentPiece = getRandomPiece();
  currentPiece.position.copy(snapToGrid(4, 19));
  console.log("Current piece position: " + currentPiece.position.x + ", " + currentPiece.position.y);
  scene.add(currentPiece);

  holdPiece = null;
  nextPiece = getRandomPiece();
  nextPreview = nextPiece.clone();
  nextPreview.position.copy(centerOfNextBox());
  nextPreview.scale.set(0.75, 0.75, 0.75);
  scene.add(nextPreview);

  requestAnimationFrame(gameLoop);
  console.log("Game started!"); // Log game start

  document.addEventListener("keydown", handleGameplayKeys);
}

// =========== Game Loop ============ //
function gameLoop() {
  if (gameOver) {
    if (!loadedFont) return; // Wait for font to load
  
    const gameOverTextGeo = new THREE.TextGeometry("Game Over!: Press Space to Restart", {
      font: loadedFont,
      size: 20,
      height: 2,
    });
    const gameOverTextMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const gameOverTextMesh = new THREE.Mesh(gameOverTextGeo, gameOverTextMat);
    gameOverTextMesh.position.set(-150, -5, 26);
    scene.add(gameOverTextMesh);
  
    resetOnSpace();
    return;
  }
  

  // Check if it's time to drop the piece
  const now = Date.now();
  if (now - lastDropTime > dropInterval) {
    dropPiece(); // Drop the piece
    lastDropTime = now; // Update the last drop time
  }

  // Render the scene
  renderer.render(scene, camera);

  // Request the next frame
  requestAnimationFrame(gameLoop);
}


// ============ Event Listeners ============ //
//On page initialization, wait for player to press space to start the game

function handleStartKey(event) {
  if (event.code === "Space" && !gameStarted) {
    console.log("Game started!");
    gameStarted = true;
    scene.remove(scene.children.find(child => child.type === "Mesh" && child.geometry.type === "PlaneGeometry" && child.position.z === 24));
    scene.remove(scene.children.find(child => child.type === "Mesh" && child.geometry.type === "TextGeometry" && child.position.z === 26));
    document.removeEventListener("keydown", handleStartKey);
    resetGame();
  }
}


function resetOnSpace() {
  document.addEventListener("keydown", handleStartKey);
}


resetOnSpace(); // Call the function to set up the event listener

// ============ keydown Events ============ //
function handleGameplayKeys(event) {
  if (!currentPiece || gameOver) return;

  switch (event.code) {
    case "KeyA":
      movePiece("left");
      break;
    case "KeyD":
      movePiece("right");
      break;
    case "KeyS":
      dropPiece();
      break;
    case "Space":
      hardDropPiece();
      break;
    case "KeyW":
      rotatePiece();
      break;
    case "KeyC":
    case "ShiftLeft":
    case "ShiftRight":
      handleHoldPiece();
      break;
  }
}


// ============ Stats & Animate ============ //
let stats = new Stats();
stats.showPanel(0);
stats.dom.style.position = "absolute";
stats.dom.style.top = "0px";
stats.dom.style.left = "0px";
document.body.appendChild(stats.dom);

function animate(t) {
  stats.begin();
  resizeCanvas();
  renderer.render(scene, camera);
  stats.end();
  requestAnimationFrame(animate);
}
animate();
