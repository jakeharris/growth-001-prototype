import { Position } from "./position";

export interface Tile extends Position {
  id: string; // the id, which is also the name of the Phaser rect or image that this Tile represents
  name: string;
  traversable: boolean;
}

export function createTile(
  id: string,
  name: string,
  x: number,
  y: number,
  traversable: boolean = true
): Tile {
  return {
    id,
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
