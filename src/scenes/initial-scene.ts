import { Store } from "@reduxjs/toolkit";
import { haveSamePosition, Positioned } from "../models";
import { createTile, Tile } from "../models/tile";
import {
  actions,
  selectCursorPosition as selectCursorPosition,
} from "../state/reducers/initial-scene.state";

export class InitialScene extends Phaser.Scene {
  timer = 0;
  width = 20; // in tiles
  height = 15; // in tiles
  tileWidth = 64;
  tileHeight = 64;

  cursor: Phaser.GameObjects.Rectangle | null = null;

  cursorPosition: Positioned = { x: 0, y: 0 };

  constructor(private store: Store) {
    super({ key: "InitialScene" });
  }

  preload() {
    this.store.dispatch(actions.preload());
  }

  update(time: number, delta: number) {
    // handle changes to cursor position
    const newCursorPosition = selectCursorPosition(this.store.getState());
    if (this.cursor && this.cursorHasMoved()) {
      this.cursorPosition = newCursorPosition;
      this.cursor.x = newCursorPosition.x * this.tileWidth;
      this.cursor.y = newCursorPosition.y * this.tileHeight;
    }
  }

  create() {
    this.generateCursor();
    this.generateMap();

    this.configureInput();
  }

  generateCursor() {
    const cursor = this.add.rectangle(
      0,
      0,
      this.tileWidth,
      this.tileHeight,
      0xdde024
    );
    cursor.setDepth(10);
    this.tweens.add({
      targets: cursor,
      alpha: 0.2,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      duration: 500,
    });

    this.cursor = cursor;
    if (!this.cursor) {
      throw new Error("Cursor is null");
    }

    this.cursorPosition = selectCursorPosition(this.store.getState());
  }

  generateMap() {
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

  // users phaser keyboard input to move the cursor, etc.
  configureInput() {
    this.input.keyboard.on("keydown-DOWN", () =>
      this.store.dispatch(actions.moveCursor({ x: 0, y: 1 }))
    );
    this.input.keyboard.on("keydown-UP", () =>
      this.store.dispatch(actions.moveCursor({ x: 0, y: -1 }))
    );
    this.input.keyboard.on("keydown-LEFT", () =>
      this.store.dispatch(actions.moveCursor({ x: -1, y: 0 }))
    );
    this.input.keyboard.on("keydown-RIGHT", () =>
      this.store.dispatch(actions.moveCursor({ x: 1, y: 0 }))
    );
  }

  cursorHasMoved() {
    const cursorPosition = selectCursorPosition(this.store.getState());
    return !haveSamePosition(cursorPosition, this.cursorPosition);
  }
}
