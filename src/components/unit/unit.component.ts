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
      const absoluteBodyPosition = addPositions(unit.position, bodyPosition);
      const circle = scene.add.circle(
        absoluteBodyPosition.x * TILE_WIDTH,
        absoluteBodyPosition.y * TILE_HEIGHT,
        TILE_WIDTH / 2,
        getTeamColor(unit.team)
      );
      circle.setOrigin(0, 0);
      circle.setName(`body-${bodyPosition.x}-${bodyPosition.y}`);
      circle.setInteractive();
      this.add(circle);
    });

    this.setDepth(Depth.Units);
    this.scene.add.existing(this);
  }

  update() {
    const state = this.store.getState();
    if (state) {
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

      if (!sprite)
        throw new Error(
          `tried moving a unit, but couldn\'t find sprite for body position (${bodyPosition.x}, ${bodyPosition.y})`
        );

      if (unit.pendingPosition) {
        const absolutePendingBodyPosition = addPositions(
          unit.pendingPosition,
          bodyPosition
        );
        sprite.setPosition(
          absolutePendingBodyPosition.x * TILE_WIDTH,
          absolutePendingBodyPosition.y * TILE_HEIGHT
        );
      }

      sprite.fillColor = unit.hasMoved
        ? Colors.TurnTaken
        : getTeamColor(unit.team);
    });
  }
}
