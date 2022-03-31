import { Store } from "@reduxjs/toolkit";
import { Depth, TILE_HEIGHT, TILE_WIDTH } from "../../models/consts";
import {
  selectCursorPosition,
  selectIsMoving,
  selectIsSelectingUnit,
  State,
} from "../../state/reducers/initial-scene";

export class CursorComponent extends Phaser.GameObjects.Container {
  previousState?: State;

  constructor(readonly store: Store<State>, readonly scene: Phaser.Scene) {
    super(scene);

    const cursor = scene.add.rectangle(0, 0, TILE_WIDTH, TILE_HEIGHT, 0xffffff);
    cursor.setName("cursor");
    cursor.setOrigin(0, 0);
    this.add(cursor);

    scene.tweens.add({
      targets: cursor,
      alpha: 0.3,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      duration: 800,
    });

    this.setDepth(Depth.Cursor);
    this.scene.add.existing(this);
  }

  update() {
    const state = this.store.getState();
    if (state && this.previousState !== state) {
      this.render(state);
    }
    this.previousState = state;
  }

  render(state: State) {
    const { x, y } = selectCursorPosition(state);
    const isSelecting = selectIsSelectingUnit(state);
    const isMoving = selectIsMoving(state);
    const cursorSprite = this.getByName(
      "cursor"
    ) as Phaser.GameObjects.Rectangle;

    this.setPosition(x * TILE_WIDTH, y * TILE_HEIGHT);
    cursorSprite.setFillStyle(isSelecting || isMoving ? 0xdddd00 : 0xffffff);
  }
}
