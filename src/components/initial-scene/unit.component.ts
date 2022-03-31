import { Store } from "@reduxjs/toolkit";
import {
  addPositions,
  Colors,
  Depth,
  getTeamColor,
  TILE_HEIGHT,
  TILE_WIDTH,
  Unit,
} from "../../models";
import { selectUnits, State } from "../../state/reducers/initial-scene";

export class UnitComponent extends Phaser.GameObjects.Container {
  previousState?: State;

  constructor(
    readonly store: Store<State>,
    readonly scene: Phaser.Scene,
    readonly unit: Unit
  ) {
    super(scene);

    this.setName(`unit-${unit.id}`);

    unit.bodyPositions.forEach((bodyPosition) => {
      const circle = scene.add.circle(
        bodyPosition.x * TILE_WIDTH,
        bodyPosition.y * TILE_HEIGHT,
        TILE_WIDTH / 2,
        getTeamColor(unit.team)
      );
      circle.setOrigin(0, 0);
      circle.setName(`body-${bodyPosition.x}-${bodyPosition.y}`);
      circle.setInteractive();
      this.add(circle);
    });

    this.setPosition(
      unit.position.x * TILE_WIDTH,
      unit.position.y * TILE_HEIGHT
    );

    this.setDepth(Depth.Units);
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
    const unit = selectUnits(state).find((u) => u.id === this.unit.id);

    if (!unit)
      throw new Error(
        `[UnitComponent.render] Unit with id ${this.unit.id} not found`
      );

    unit.bodyPositions.forEach((bodyPosition) => {
      const sprite = this.getByName(
        `body-${bodyPosition.x}-${bodyPosition.y}`
      ) as Phaser.GameObjects.Shape;

      sprite.setAlpha(unit.pendingPosition ? 0.5 : 1);

      sprite.fillColor = unit.hasMoved
        ? Colors.TurnTaken
        : getTeamColor(unit.team);
    });

    this.setPosition(
      unit.position.x * TILE_WIDTH,
      unit.position.y * TILE_HEIGHT
    );
  }
}
