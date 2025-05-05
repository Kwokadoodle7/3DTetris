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
  cube.userData.offset = { x: xOffset, y: yOffset };
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

let scoreTextMesh = null; // Initialize score text mesh

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
  scoreTextMesh = new THREE.Mesh(scoreTextGeo, scoreTextMat);
  scoreTextMesh.position.set(-50, 220, 0);
  scene.add(scoreTextMesh);
});

// Update score text function
function updateScoreText() {
  if (scoreTextMesh) {
    scene.remove(scoreTextMesh);
  }
  let scoreText = `Score: ${score}`;
  const scoreTextGeo = new THREE.TextGeometry(scoreText, {
    font: loadedFont,
    size: 20,
    height: 2,
  });
  const scoreTextMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  scoreTextMesh = new THREE.Mesh(scoreTextGeo, scoreTextMat);
  scoreTextMesh.position.set(-50, 220, 0);
  scene.add(scoreTextMesh);
}

const SRS_KICKS = {
  'JLSTZ': {
    '0->1': [ [0, 0], [-1, 0], [-1, +1], [0, -2], [-1, -2] ],
    '1->0': [ [0, 0], [+1, 0], [+1, -1], [0, +2], [+1, +2] ],
    '1->2': [ [0, 0], [+1, 0], [+1, -1], [0, +2], [+1, +2] ],
    '2->1': [ [0, 0], [-1, 0], [-1, +1], [0, -2], [-1, -2] ],
    '2->3': [ [0, 0], [+1, 0], [+1, +1], [0, -2], [+1, -2] ],
    '3->2': [ [0, 0], [-1, 0], [-1, -1], [0, +2], [-1, +2] ],
    '3->0': [ [0, 0], [-1, 0], [-1, -1], [0, +2], [-1, +2] ],
    '0->3': [ [0, 0], [+1, 0], [+1, +1], [0, -2], [+1, -2] ],
  },
  'I': {
    '0->1': [ [0, 0], [-2, 0], [+1, 0], [-2, -1], [+1, +2] ],
    '1->0': [ [0, 0], [+2, 0], [-1, 0], [+2, +1], [-1, -2] ],
    '1->2': [ [0, 0], [-1, 0], [+2, 0], [-1, +2], [+2, -1] ],
    '2->1': [ [0, 0], [+1, 0], [-2, 0], [+1, -2], [-2, +1] ],
    '2->3': [ [0, 0], [+2, 0], [-1, 0], [+2, +1], [-1, -2] ],
    '3->2': [ [0, 0], [-2, 0], [+1, 0], [-2, -1], [+1, +2] ],
    '3->0': [ [0, 0], [+1, 0], [-2, 0], [+1, -2], [-2, +1] ],
    '0->3': [ [0, 0], [-1, 0], [+2, 0], [-1, +2], [+2, -1] ]
  }
};

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
  // remove piece from bag
  pieces.splice(index, 1);
  // if bag is empty, refill it
  if (pieces.length === 0) {
    pieces.push(createIBlock, createJBlock, createLBlock, createOBlock, createSBlock, createTBlock, createZBlock);
  }
  return piece;
}

function getBlockType(piece) {
  const color = piece.children[0].material.color.getHex();
  const colorMap = {
    0x00ffff: 'I',
    0x0000ff: 'J',
    0xef8a00: 'L',
    0xffff00: 'O',
    0x00ff00: 'S',
    0x800080: 'T',
    0xff0000: 'Z',
  };
  return colorMap[color];
}


function handleHoldPiece() {
  if (isHolding) return;
  isHolding = true;

  scene.remove(currentPiece);

  if (holdPiece) {
    // Swap current and hold
    const temp = holdPiece;
    holdPiece = currentPiece;
    currentPiece = temp;
  
    // Reset state
    currentRotation = 0;
    lastDropTime = Date.now();
    currentPosition = { x: 4, y: 19 };
  
    // Reset offsets and positions
    currentPiece.rotation.set(0, 0, 0);
    currentPiece.children.forEach(cube => {
      const offset = cube.userData.offset;
      cube.position.set(offset.x * CELL_SIZE, offset.y * CELL_SIZE, 0);
    });
  
    currentPiece.position.copy(snapToGrid(currentPosition.x, currentPosition.y));
    scene.add(currentPiece);
  
  } else {
    // Store first piece and use next
    holdPiece = currentPiece;
    currentPiece = nextPiece;
    nextPiece = getRandomPiece();

    // Update next preview
    if (nextPreview) scene.remove(nextPreview);
    nextPreview = nextPiece.clone();
    nextPreview.position.copy(centerOfNextBox());
    nextPreview.scale.set(0.75, 0.75, 0.75);
    scene.add(nextPreview);
  }

  // Reset state
  currentRotation = 0;
  lastDropTime = Date.now();
  currentPosition = { x: 4, y: 19 };

  // Restore child positions
  currentPiece.children.forEach(cube => {
    const offset = cube.userData.offset;
    cube.position.set(offset.x * CELL_SIZE, offset.y * CELL_SIZE, 0);
  });

  currentPiece.rotation.set(0, 0, 0);
  currentPiece.position.copy(snapToGrid(currentPosition.x, currentPosition.y));
  for (let cube of currentPiece.children) {
    const { x: offsetX, y: offsetY } = cube.userData.offset;
    const col = currentPosition.x + offsetX;
    const row = currentPosition.y + offsetY;
    // if any of the cubes are out of bounds, shift the whole piece down
    if (row > GRID_ROWS - 1) {
      currentPosition.y -= 1;
      currentPiece.position.copy(snapToGrid(currentPosition.x, currentPosition.y));
    }
  }
  scene.add(currentPiece);

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
    // Compute new world position for the cube
    const offset = cube.userData.offset;
    const cubePosition = snapToGrid(newX + offset.x, newY + offset.y);  // Get world position of this cube
    const { row, col } = positionToGridIndex(cubePosition.x, cubePosition.y);

    
    if (
      row < 0 || row >= GRID_ROWS ||
      col < 0 || col >= GRID_COLS ||
      isCellOccupied(row, col)
    ) {
      return false;
    }
  }
  return true;
}




function lockPiece() {
  let temporaryCoordList = [];
  for (let cube of currentPiece.children) {
    const { x: offsetX, y: offsetY } = cube.userData.offset;
    const col = currentPosition.x + offsetX;
    const row = currentPosition.y + offsetY;
    setGridCell(row, col, cube);
    // store position in temporary grid array
    temporaryCoordList.push({ x: col, y: row });
  }
  for (let coord of temporaryCoordList) {
    const { x: col, y: row } = coord;
    const cube = gridArray[row][col];
    if (cube) {
      cube.position.copy(snapToGrid(col, row));
      scene.add(cube); // Add the cube back to the scene
    }
  }
  scene.remove(currentPiece);
}

function movePiece(direction) {
  const deltaX = direction === "left" ? -1 : 1;
  const newX = currentPosition.x + deltaX;

  if (canMoveTo(newX, currentPosition.y)) {
    currentPosition.x = newX;
    currentPiece.position.copy(snapToGrid(currentPosition.x, currentPosition.y));
  }
}

function rotatePiece(clockwise = true) {
  if (!currentPiece || !currentPiece.children.length) return;

  const blockType = getBlockType(currentPiece);
  if (blockType === 'O') return;

  const oldRotation = currentRotation;
  const newRotation = (oldRotation + (clockwise ? 1 : 3)) % 4;
  const rotationKey = `${oldRotation}->${newRotation}`;
  const kickTable = SRS_KICKS[blockType === 'I' ? 'I' : 'JLSTZ'][rotationKey];

  const originalOffsets = currentPiece.children.map(cube => ({ ...cube.userData.offset }));

  for (let [dx, dy] of kickTable) {
    // Determine the pivot point (usually (1,1) for JLSTZ, (1.5,1.5) for I)
    let pivot = { x: 1, y: 1 };
    if (blockType === 'I') {
      pivot = { x: 1.5, y: 1.5 };  // For I blocks in a 4x4 grid
    }

    // Rotate each cube's offset around the pivot
    currentPiece.children.forEach(cube => {
      const { x, y } = cube.userData.offset;

      // Translate to origin (relative to pivot)
      const relX = x - pivot.x;
      const relY = y - pivot.y;

      // Apply rotation
      const rotX = clockwise ? -relY : relY;
      const rotY = clockwise ?  relX : -relX;

      // Translate back
      cube.userData.offset.x = rotX + pivot.x;
      cube.userData.offset.y = rotY + pivot.y;
    });


    const testX = currentPosition.x + dx;
    const testY = currentPosition.y + dy;

    if (canMoveTo(testX, testY)) {
      currentPosition.x = testX;
      currentPosition.y = testY;
      currentPiece.position.copy(snapToGrid(currentPosition.x, currentPosition.y));

      // Reposition children based on new offsets
      currentPiece.children.forEach(cube => {
        const { x: ox, y: oy } = cube.userData.offset;
        cube.position.set(ox * CELL_SIZE, oy * CELL_SIZE, 0);
      });

      currentRotation = newRotation;
      return;
    }

    // Revert offsets if kick fails
    currentPiece.children.forEach((cube, i) => {
      cube.userData.offset = { ...originalOffsets[i] };
    });
  }
}

function dropPiece() {
  if (canMoveTo(currentPosition.x, currentPosition.y - 1)) {
    currentPosition.y -= 1;
    currentPiece.position.copy(snapToGrid(currentPosition.x, currentPosition.y));
  } else {
    lockPiece();
    checkForLineClears();
    updateCurrentPiece();
  }
}

function hardDropPiece() {
  while (canMoveTo(currentPosition.x, currentPosition.y - 1)) {
    currentPosition.y -= 1;
  }

  currentPiece.position.copy(snapToGrid(currentPosition.x, currentPosition.y));
  lockPiece();
  checkForLineClears();
  updateCurrentPiece();
}

function updateCurrentPiece() {
  currentPiece = nextPiece;
  currentPiece.position.copy(snapToGrid(4, 19));
  currentPosition.x = 4;
  currentPosition.y = 19;

  // Allow hold again for the new piece
  isHolding = false;

  for (let cube of currentPiece.children) {
    const { x: offsetX, y: offsetY } = cube.userData.offset;
    const col = currentPosition.x + offsetX;
    const row = currentPosition.y + offsetY;
    if (row > GRID_ROWS - 1) {
      currentPosition.y -= 1;
      currentPiece.position.copy(snapToGrid(currentPosition.x, currentPosition.y));
    }
  }

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
      linesCleared++;
    }
  }
  switch (linesCleared) {
    case 1:
      score += 100;
      break;
    case 2:
      score += 300;
      break;
    case 3:
      score += 500;
      break;
    case 4:
      score += 800;
      break;
    default:
      break;
  }
  updateScoreText();
  linesCleared = 0; // Reset lines cleared after scoring
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
  for (let cube of currentPiece.children) {
    const { x: offsetX, y: offsetY } = cube.userData.offset;
    const col = currentPosition.x + offsetX;
    const row = currentPosition.y + offsetY;
    // if any of the cubes are out of bounds, shift the whole piece down
    if (row > GRID_ROWS - 1) {
      currentPosition.y -= 1;
      currentPiece.position.copy(snapToGrid(currentPosition.x, currentPosition.y));
    }
  }
  scene.add(currentPiece);


  holdPiece = null;
  nextPiece = getRandomPiece();
  nextPreview = nextPiece.clone();
  nextPreview.position.copy(centerOfNextBox());
  nextPreview.scale.set(0.75, 0.75, 0.75);
  scene.add(nextPreview);

  requestAnimationFrame(gameLoop);

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
      rotatePiece(true); // Clockwise
      break;
    case "KeyQ":
      rotatePiece(false); // Counterclockwise (optional)
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
