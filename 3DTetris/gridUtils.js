// gridUtils.js - handles logical grid for 3D Tetris

const GRID_ROWS = 20;
const GRID_COLS = 10;
const CELL_SIZE = 20;
const GRID_WIDTH = GRID_COLS * CELL_SIZE;
const GRID_HEIGHT = GRID_ROWS * CELL_SIZE;

// Initialize grid array
const gridArray = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null));

// Convert world position (x, y) to grid index (row, col)
function positionToGridIndex(x, y) {
  const col = Math.floor((x + GRID_WIDTH / 2) / CELL_SIZE);
  const row = Math.floor((y + GRID_HEIGHT / 2) / CELL_SIZE);
  return { col, row };
}

// Check if a grid cell is occupied
function isCellOccupied(row, col) {
  return gridArray[row]?.[col] !== null;
}

// Set a cube at a grid cell
function setGridCell(row, col, cube) {
  if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
    gridArray[row][col] = cube;
  }
}

// Clear a full row
function clearRow(rowIndex, scene) {
  for (let col = 0; col < GRID_COLS; col++) {
    const cube = gridArray[rowIndex][col];
    if (cube) {
      scene.remove(cube);
      gridArray[rowIndex][col] = null;
    }
  }
}

// Shift all rows above a cleared row down by 1
function shiftRowsDown(startRow) {
  for (let row = startRow; row < GRID_ROWS - 1; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      gridArray[row][col] = gridArray[row + 1][col];
      if (gridArray[row][col]) {
        gridArray[row][col].position.y -= CELL_SIZE;
      }
    }
  }
  // Clear top row
  for (let col = 0; col < GRID_COLS; col++) {
    gridArray[GRID_ROWS - 1][col] = null;
  }
}

// Convert (col, row) grid coordinates to world (x, y)
function gridToWorldPosition(col, row) {
  const x = -GRID_WIDTH / 2 + col * CELL_SIZE + CELL_SIZE / 2;
  const y = -GRID_HEIGHT / 2 + row * CELL_SIZE + CELL_SIZE / 2;
  return { x, y };
}

// Export utilities
export default {
  gridArray,
  positionToGridIndex,
  isCellOccupied,
  setGridCell,
  clearRow,
  shiftRowsDown,
  GRID_ROWS,
  GRID_COLS,
  CELL_SIZE
};