import { Store } from "@reduxjs/toolkit";
import {
  Depth,
  RangeTileType,
  TILE_HEIGHT,
  TILE_WIDTH,
  Unit,
} from "../../models";
import {
  selectMapTilesEntities,
  State,
  selectRangeTiles,
} from "../../state/reducers/initial-scene";

export class UnitRangeComponent extends Phaser.GameObjects.Container {
  constructor(
    readonly store: Store<State>,
    readonly scene: Phaser.Scene,
    readonly unit: Unit
  ) {
    super(scene);

    const state = this.store.getState();

    const mapTiles = selectMapTilesEntities(state);
    const rangeTiles = selectRangeTiles(state);

    rangeTiles.forEach((rangeTile) => {
      const tile = mapTiles[rangeTile.id];

      if (!tile) return;

      const rect = scene.add.rectangle(
        tile.x * TILE_WIDTH,
        tile.y * TILE_HEIGHT,
        TILE_WIDTH,
        TILE_HEIGHT,
        rangeTile.type === RangeTileType.Movement ? 0x8888ff : 0xff8888
      );
      rect.setAlpha(0.7);
      rect.setDepth(Depth.Tiles + 1);
      rect.setOrigin(0, 0);
      this.add(rect);
    });

    this.setName("unit-range");
    this.scene.add.existing(this);
  }
}
