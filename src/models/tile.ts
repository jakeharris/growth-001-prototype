export interface Tile {
  name: string; // the name of the Phaser rect or image that this Tile represents
  x: number; // x coordinate of the tile in grid positions, not pixels
  y: number; // y coordinate of the tile in grid positions, not pixels
  traversable: boolean;
}

export function createTile(
  name: string,
  x: number,
  y: number,
  traversable: boolean = true
): Tile {
  return {
    name,
    x,
    y,
    traversable,
  };
}
