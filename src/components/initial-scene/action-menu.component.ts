import { Store } from "@reduxjs/toolkit";
import { Depth, TILE_HEIGHT, TILE_WIDTH } from "../../models";
import {
  ActionMenuOptions,
  getActionName,
} from "../../models/action-menu-options";
import {
  selectActionMenuPosition,
  selectActionMenuWidth,
  selectAvailableActions,
  selectActionMenuCursorIndex,
  State,
} from "../../state/reducers/initial-scene";

export class ActionMenuComponent extends Phaser.GameObjects.Container {
  previousState?: State;

  constructor(readonly store: Store<State>, readonly scene: Phaser.Scene) {
    super(scene);

    const state = store.getState();

    const menuPosition = selectActionMenuPosition(state);
    const menuWidth = selectActionMenuWidth(state);
    const menuActions = selectAvailableActions(state);
    const cursorIndex = selectActionMenuCursorIndex(state);

    if (!menuPosition) throw Error("No menu position");

    const menu = scene.add.rectangle(
      menuPosition.x * TILE_WIDTH,
      menuPosition.y * TILE_HEIGHT,
      TILE_WIDTH * menuWidth,
      TILE_HEIGHT * menuActions.length,
      0x888888
    );
    menu.setName("menu");
    menu.setAlpha(1);
    menu.setOrigin(0, 0);
    this.add(menu);

    const menuShadow = scene.add.rectangle(
      menuPosition.x * TILE_WIDTH + 4,
      menuPosition.y * TILE_HEIGHT + 4,
      TILE_WIDTH * menuWidth,
      TILE_HEIGHT * menuActions.length,
      0x000000
    );
    menuShadow.setName("menu-shadow");
    menuShadow.setAlpha(0.5);
    menuShadow.setOrigin(0, 0);
    this.add(menuShadow);
    this.moveTo(menuShadow, 0);

    menuActions.forEach((action, index) => {
      const actionName = getActionName(action);
      const actionText = scene.add.text(
        menuPosition.x * TILE_WIDTH + 8 + 16, // first 8 is for the padding, second 16 is space for the cursor
        menuPosition.y * TILE_HEIGHT + index * TILE_HEIGHT + 8,
        actionName,
        {
          fontFamily: "monospace", // or monospace
          fontSize: "16px",
          color: "#ffffff",
          align: "center",
          resolution: 4,
        }
      );
      actionText.setName(`action-${actionName}`);
      actionText.setOrigin(0, 0);
      this.add(actionText);
    });

    const cursor = scene.add.triangle(
      menuPosition.x * TILE_WIDTH + 8,
      menuPosition.y * TILE_HEIGHT + cursorIndex * TILE_HEIGHT + 8 + 4,
      0,
      0,
      8,
      4,
      0,
      8,
      0xffffff
    );
    cursor.setName("cursor");
    cursor.setOrigin(0, 0);
    this.add(cursor);

    this.setDepth(Depth.Menu);
    this.setName("action-menu");

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
    const menuPosition = selectActionMenuPosition(state);
    const cursorIndex = selectActionMenuCursorIndex(state);

    if (!menuPosition) return;

    const cursor = this.getByName("cursor") as Phaser.GameObjects.Triangle;

    if (!cursor) return;

    cursor.setPosition(
      menuPosition.x * TILE_WIDTH + 8,
      (menuPosition.y + cursorIndex) * TILE_HEIGHT + 8 + 4
    );
  }
}
