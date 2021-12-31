export interface Positioned {
  x: number; // x coordinate of the tile in grid positions, not pixels
  y: number; // y coordinate of the tile in grid positions, not pixels
}

export function haveSamePosition(a: Positioned, b: Positioned) {
  return a.x === b.x && a.y === b.y;
}
