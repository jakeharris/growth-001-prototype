import { Store } from "@reduxjs/toolkit";
import {
  haveSamePosition,
  Positioned,
  createTile,
  Tile,
  getTeamColor,
  createRandomInitialUnits,
} from "../models";
import {
  selectMapCursorPosition,
  State,
} from "../state/reducers/initial-scene";
import { actions as MapActions } from "../state/reducers/initial-scene/map.state";
import { actions as UnitsActions } from "../state/reducers/initial-scene/units.state";

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
    this.store.dispatch(MapActions.preload());
    this.store.dispatch(UnitsActions.preload());
  }

  update(time: number, delta: number) {
    // handle changes to cursor position
    const newCursorPosition = selectMapCursorPosition(this.store.getState());
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
    this.generateUnits();

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

    this.cursorPosition = selectMapCursorPosition(this.store.getState());
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
      MapActions.createMap({ tiles, width: this.width, height: this.height })
    );
  }

  generateUnits() {
    const units = createRandomInitialUnits(3, this.width, this.height);

    units.forEach((unit) => {
      const circle = this.add.circle(
        unit.x * this.tileWidth,
        unit.y * this.tileHeight,
        this.tileWidth / 2,
        getTeamColor(unit.team)
      );
      circle.setDepth(5);
      circle.setOrigin(0, 0);
      circle.setName(`unit-${unit.id}`);
      circle.setInteractive();
    });

    this.store.dispatch(UnitsActions.createUnits({ units }));
  }

  // users phaser keyboard input to move the cursor, etc.
  configureInput() {
    this.input.keyboard.on("keydown-DOWN", () =>
      this.store.dispatch(MapActions.moveCursor({ x: 0, y: 1 }))
    );
    this.input.keyboard.on("keydown-UP", () =>
      this.store.dispatch(MapActions.moveCursor({ x: 0, y: -1 }))
    );
    this.input.keyboard.on("keydown-LEFT", () =>
      this.store.dispatch(MapActions.moveCursor({ x: -1, y: 0 }))
    );
    this.input.keyboard.on("keydown-RIGHT", () =>
      this.store.dispatch(MapActions.moveCursor({ x: 1, y: 0 }))
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
