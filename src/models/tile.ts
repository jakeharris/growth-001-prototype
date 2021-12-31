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
