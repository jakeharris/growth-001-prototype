import { Positioned } from "./positioned";

export interface Tile extends Positioned {
  name: string; // the name of the Phaser rect or image that this Tile represents
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

/**
 * Returns the id of this tile by generating it in a consistent way.
 * @param x The x-position of the tile, in tiles
 * @param y The y-position of the tile, in tiles
 */
export function getTileId(x: number, y: number): string {
  return `tile-${x}-${y}`;
}
