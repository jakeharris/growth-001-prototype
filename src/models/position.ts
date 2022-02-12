export interface Position {
  x: number; // x coordinate of the tile in grid positions, not pixels
  y: number; // y coordinate of the tile in grid positions, not pixels
}

export function haveSamePosition(a: Position, b: Position) {
  return a.x === b.x && a.y === b.y;
}
