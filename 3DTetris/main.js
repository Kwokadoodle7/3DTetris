// merged_main.js with 3D UI Boxes

let canvas = document.getElementById("gl-canvas");
let context = canvas.getContext("webgl2", { alpha: false });
let scene = new THREE.Scene();
scene.background = new THREE.Color(0xaac0dd);
scene.fog = new THREE.Fog(0xcce0ff, 50, 2000);

let width = canvas.clientWidth,
  height = canvas.clientHeight;

let camera = new THREE.OrthographicCamera(
  width / -2,
  width / 2,
  height / 2,
  height / -2,
  1,
  10000
);
camera.position.z = 500;

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
// I Block
let IblockMaterial = new THREE.MeshStandardMaterial({ color: 0x00ffff });
IblockMaterial.side = THREE.DoubleSide;
let IblockGeometry = new THREE.BoxBufferGeometry(80, 20, 20);
let Iblock = new THREE.Mesh(IblockGeometry, IblockMaterial);
Iblock.position.copy(snapToGrid(3, 18)); // column 3, row 18
//scene.add(Iblock);


// J Block
const JblockMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
const JblockGeometry = new THREE.BoxBufferGeometry(60, 20, 20);
const Jblock = new THREE.Mesh(JblockGeometry, JblockMaterial);
Jblock.position.set(0, 140, 10);

const JblockJoint = new THREE.Mesh(new THREE.BoxBufferGeometry(20, 20, 20), JblockMaterial);
JblockJoint.position.set(-20, 20, 0);
Jblock.add(JblockJoint);
//scene.add(Jblock);

// L Block
const LblockMaterial = new THREE.MeshStandardMaterial({ color: 0xef8a00 });
const LblockGeometry = new THREE.BoxBufferGeometry(60, 20, 20);
const Lblock = new THREE.Mesh(LblockGeometry, LblockMaterial);
Lblock.position.set(0, 100, 10);

const LblockJoint = new THREE.Mesh(new THREE.BoxBufferGeometry(20, 20, 20), LblockMaterial);
LblockJoint.position.set(20, 20, 0);
Lblock.add(LblockJoint);
//scene.add(Lblock);

// O Block
const OblockMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
const OblockGeometry = new THREE.BoxBufferGeometry(40, 40, 20);
const Oblock = new THREE.Mesh(OblockGeometry, OblockMaterial);
Oblock.position.set(0, 60, 10);
//scene.add(Oblock);

// S Block
const SblockMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const SblockGeometry = new THREE.BoxBufferGeometry(40, 20, 20);
const Sblock = new THREE.Mesh(SblockGeometry, SblockMaterial);
Sblock.position.set(0, 20, 10);

const SblockJoint = new THREE.Mesh(new THREE.BoxBufferGeometry(40, 20, 20), SblockMaterial);
SblockJoint.position.set(-20, -20, 0);
Sblock.add(SblockJoint);
//scene.add(Sblock);

// T Block
const TblockMaterial = new THREE.MeshStandardMaterial({ color: 0x800080 });
const TblockGeometry = new THREE.BoxBufferGeometry(60, 20, 20);
const Tblock = new THREE.Mesh(TblockGeometry, TblockMaterial);
Tblock.position.set(0, -20, 10);

const TblockJoint = new THREE.Mesh(new THREE.BoxBufferGeometry(20, 20, 20), TblockMaterial);
TblockJoint.position.set(0, 20, 0);
Tblock.add(TblockJoint);
//scene.add(Tblock);

// Z Block
const ZblockMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const ZblockGeometry = new THREE.BoxBufferGeometry(40, 20, 20);
const Zblock = new THREE.Mesh(ZblockGeometry, ZblockMaterial);
Zblock.position.set(0, -60, 10);

const ZblockJoint = new THREE.Mesh(new THREE.BoxBufferGeometry(40, 20, 20), ZblockMaterial);
ZblockJoint.position.set(20, -20, 0);
Zblock.add(ZblockJoint);
//scene.add(Zblock);


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
	const x = -100 + col * 20 + 10; // +10 centers the block in its 20-wide cell
	const y = -200 + row * 20 + 10; // +10 centers the block in its 20-high cell
	return new THREE.Vector3(x, y, 10); // z stays fixed for now
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
let gameOver = false; // Flag to indicate if the game is over
let score = 0; // Player's score
let linesCleared = 0; // Number of lines cleared
let grid = Array.from({ length: 20 }, () => Array(10).fill(0)); // 20 rows, 10 columns
let dropInterval = 1000; // Time interval for dropping pieces
let lastDropTime = 0; // Last time a piece was dropped
let currentRotation = 0; // Current rotation of the piece
let currentPosition = { x: 4, y: 20 }; // Current position of the piece
let isHolding = false; // Flag to indicate if the player is holding a piece

// Piece randomizer
const pieces = [Iblock, Jblock, Lblock, Oblock, Sblock, Tblock, Zblock];

function getRandomPiece() {
  const randomIndex = Math.floor(Math.random() * pieces.length);
  let randomPiece = pieces[randomIndex].clone(); // Clone the piece to avoid reference issues
  pieces.splice(randomIndex, 1); // Remove the piece from the bag
  if (pieces.length === 0) {
    pieces.push(Iblock, Jblock, Lblock, Oblock, Sblock, Tblock, Zblock); // Reset the bag
  }
  return randomPiece; // Clone the piece to avoid reference issues
}

function updateArray(piece) {
  // Update the grid array with the current piece's position


}


function movePiece(direction) {
  console.log("Moving piece " + direction);
  // Check if the piece can move in the specified direction
}

function rotatePiece() {

}

// check using the grid array if the piece can move to the new position (edit parameters)
function canMoveTo(x, y) {
  // Check if the piece can move to the new position in the grid
  // Check if the new position is within the grid bounds

  // Check if the new position is occupied by another piece
  return true; // Placeholder, implement actual collision detection logic

}

function dropPiece() {
  console.log("Dropping piece down");
  // Check if the piece can move down
  if (canMoveTo(currentPosition.x, currentPosition.y - 1)) {
    // Move the piece down
    currentPosition.y -= 1; // Move down by one row
    console.log("Piece moved down to: " + currentPosition.x + ", " + currentPosition.y);
    currentPiece.position.copy(snapToGrid(currentPosition.x, currentPosition.y)); // Update the piece's position
    updateArray(currentPiece); // Update the grid array with the new position
  }
  // Else lock the piece in place and check for line clears
  else {
    // If piece cannot move down and player does not want to hold or rotate or move, lock the piece in place
    lockPiece(currentPiece); // Lock the piece in place
    checkForLineClears();
    updateCurrentPiece(); // Get the next piece
}
}

function lockPiece(piece) {
  console.log("Locking piece in place");
  // Check if player wants to hold or rotate or move within grace period
  // If player wants to hold or rotate or move, do not lock the piece in place
  // If not, lock the piece in place
  // Check for line clears
  checkForLineClears();
  // Check for game over


}

function checkForLineClears() {

}

function updateCurrentPiece() {
    // Get a new piece

}

function resetGame() {
  // Reset the grid and UI elements here

  // Clear the UI elements (e.g., score, level, lines cleared) here
  // Update the UI elements to reflect the reset state
  // Remove hold and next pieces from the scene
  if (holdPreview) {
    scene.remove(holdPreview);
  }
  if (nextPreview) {
    scene.remove(nextPreview);
  }

  // Reset game state variables
  gameOver = false;
  score = 0;
  linesCleared = 0;
  lastDropTime = Date.now();
  isHolding = false;

  // Clear the grid array
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      grid[row][col] = 0;
    }
  }

  // currentPiece
  currentPiece = getRandomPiece(); // Get a new random piece
  currentPiece.position.copy(snapToGrid(4, 20)); // Start position for the piece
  console.log("Current piece position: " + currentPiece.position.x + ", " + currentPiece.position.y);
  scene.add(currentPiece); // Add the current piece to the scene
  updateArray(currentPiece); // Update the grid array with the current piece

  // holdPiece
  holdPiece = null;
  
  // nextPiece
  nextPiece = getRandomPiece(); // Get a new random piece
  nextPreview = nextPiece.clone(); // Clone the next piece for preview
  nextPreview.position.copy(centerOfNextBox()); // Position the next piece in the next box
  nextPreview.scale.set(0.75, 0.75, 0.75); // Scale down the preview piece
  scene.add(nextPreview); // Add the next piece to the scene

  // Start the game loop
  requestAnimationFrame(gameLoop);
}

// =========== Game Loop ============ //
function gameLoop() {
  if (gameOver){
    // Display game over message and stop the game loop
    const gameOverText = `Game Over!: Press Space to Restart`;
    const gameOverTextGeo = new THREE.TextGeometry(gameOverText, {
      font: new THREE.FontLoader().parse('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json'),
      size: 20,
      height: 2,
    });
    const gameOverTextMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const gameOverTextMesh = new THREE.Mesh(gameOverTextGeo, gameOverTextMat);
    gameOverTextMesh.position.set(-150, -5, 26); // centered X, Y slightly above backdrop
    scene.add(gameOverTextMesh); // Add game over text to the scene
    reseetOnSpace(); // Wait for player to press space to restart
    return; // Stop the game loop
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
function reseetOnSpace() {
  document.addEventListener("keydown", function (event) {
    if (event.code === "Space") {
      // Start the game logic here
      console.log("Game started!");
      // Remove the start text and start backdrop
      scene.remove(scene.children.find(child => child.type === "Mesh" && child.geometry.type === "PlaneGeometry" && child.position.z === 24)); // remove start backdrop
      scene.remove(scene.children.find(child => child.type === "Mesh" && child.geometry.type === "TextGeometry" && child.position.z === 26)); // remove start text
      // Remove the event listener to prevent multiple triggers
      document.removeEventListener("keydown", arguments.callee);
      // You can add your game logic here, such as starting the Tetris game loop
      // or initializing the game state.
      resetGame(); // Reset the game state
    }
  });
}

reseetOnSpace(); // Call the function to set up the event listener

// Handle keydown events for controls






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
