import { Store } from "@reduxjs/toolkit";
import { createTile, Tile } from "../models/tile";
import { actions } from "../state/reducers/initial-scene.state";

export class InitialScene extends Phaser.Scene {
  timer = 0;
  width = 20; // in tiles
  height = 15; // in tiles
  tileWidth = 64;
  tileHeight = 64;

  constructor(private store: Store) {
    super({ key: "InitialScene" });
  }

  preload() {
    this.store.dispatch(actions.preload());
  }

  update(time: number, delta: number) {}

  create() {
    const tileXOffset = this.tileWidth - this.tileWidth / 2;
    const tileYOffset = this.tileHeight - this.tileHeight / 2;

    const grid = this.add.group();
    const tiles: Tile[] = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const random = Math.floor(Math.random() * 3);
        const color =
          random === 0 ? 0xffffff : random === 1 ? 0x00ff00 : 0xff0000;

        const traversable = random !== 2;

        const rect = this.add.rectangle(
          x * tileXOffset,
          y * tileYOffset,
          this.tileWidth,
          this.tileHeight,
          color
        );
        rect.setName(`rect-${x}-${y}`);

        grid.add(rect);
        tiles.push(createTile(rect.name, x, y, traversable));
      }
    }

    this.store.dispatch(actions.createMap(tiles));
  }
}
