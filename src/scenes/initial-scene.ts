import { Store } from "@reduxjs/toolkit";
import { haveSamePosition, Positioned, createTile, Tile } from "../models";
import { selectInitialSceneCursorPosition, State } from "../state/reducers";
import { actions } from "../state/reducers/initial-scene.state";

export class InitialScene extends Phaser.Scene {
  timer = 0;
  width = 20; // in tiles
  height = 60; // in tiles
  tileWidth = 32;
  tileHeight = 32;

  cursor: Phaser.GameObjects.Rectangle | null = null;

  cursorPosition: Positioned = { x: 0, y: 0 };

  constructor(private store: Store<State>) {
    super({ key: "InitialScene" });
  }

  preload() {
    this.store.dispatch(actions.preload());
  }

  update(time: number, delta: number) {
    // handle changes to cursor position
    const newCursorPosition = selectInitialSceneCursorPosition(
      this.store.getState()
    );
    if (this.cursor && this.cursorHasMoved(newCursorPosition)) {
      this.cursorPosition = newCursorPosition;
      this.cursor.setPosition(
        newCursorPosition.x * this.tileWidth,
        newCursorPosition.y * this.tileHeight
      );
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
      0x0000ff
    );
    cursor.setDepth(10);
    cursor.setOrigin(0, 0);

    this.tweens.add({
      targets: cursor,
      alpha: 0.3,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      duration: 800,
    });

    this.cursor = cursor;
    if (!this.cursor) {
      throw new Error("Cursor is null");
    }

    this.cursorPosition = selectInitialSceneCursorPosition(
      this.store.getState()
    );
  }

  generateMap() {
    const grid = this.add.group();
    const tiles: Tile[] = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const random = Math.floor(Math.random() * 3);
        const color =
          random === 0 ? 0xffffff : random === 1 ? 0x00ff00 : 0xff0000;

        const traversable = random !== 2;

        const rect = this.add.rectangle(
          x * this.tileWidth,
          y * this.tileHeight,
          this.tileWidth,
          this.tileHeight,
          color
        );
        rect.setName(`rect-${x}-${y}`);
        rect.setOrigin(0, 0);

        grid.add(rect);
        tiles.push(createTile(rect.name, x, y, traversable));
      }
    }

    this.store.dispatch(
      actions.createMap({ tiles, width: this.width, height: this.height })
    );
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

  cursorHasMoved(newCursorPosition: Positioned) {
    return (
      newCursorPosition &&
      this.cursorPosition &&
      !haveSamePosition(newCursorPosition, this.cursorPosition)
    );
  }
}
