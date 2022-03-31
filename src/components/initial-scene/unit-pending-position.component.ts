import { Store } from "@reduxjs/toolkit";
import {
  Depth,
  getTeamColor,
  TILE_HEIGHT,
  TILE_WIDTH,
  Unit,
} from "../../models";
import { selectUnits, State } from "../../state/reducers/initial-scene";

export class UnitPendingPositionComponent extends Phaser.GameObjects.Container {
  previousState: State;

  constructor(
    readonly store: Store<State>,
    readonly scene: Phaser.Scene,
    readonly unit: Unit
  ) {
    super(scene);

    this.setName(`unit-pending-position`);
    if (!unit.pendingPosition) throw Error("Unit has no pending position");

    unit.bodyPositions.forEach((bodyPosition) => {
      const spritePosition = scene.add.circle(
        bodyPosition.x * TILE_WIDTH,
        bodyPosition.y * TILE_HEIGHT,
        TILE_WIDTH / 2,
        getTeamColor(unit.team)
      );
      spritePosition.setName(
        `unit-pending-position-${bodyPosition.x}-${bodyPosition.y}`
      );
      spritePosition.setDepth(Depth.Units);
      spritePosition.setOrigin(0, 0);
      this.add(spritePosition);
    });

    this.setPosition(
      unit.pendingPosition.x * TILE_WIDTH,
      unit.pendingPosition.y * TILE_HEIGHT
    );

    this.previousState = store.getState();

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
        `[UnitPendingPositionComponent.render] Unit with id ${this.unit.id} not found`
      );

    /**
     * pendingPosition will only be null when it's time to
     * clean this component up, but sometimes it renders
     * one last time before getting destroyed.
     */
    if (unit.pendingPosition) {
      this.setPosition(
        unit.pendingPosition!.x * TILE_WIDTH,
        unit.pendingPosition!.y * TILE_HEIGHT
      );
    }
  }
}
