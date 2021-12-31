import { Positioned } from "./positioned";

export interface Cursor extends Positioned {
  nothing?: null; // the name of the Phaser rect or image that this Tile represents
}
