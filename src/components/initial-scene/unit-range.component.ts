import { Store } from "@reduxjs/toolkit";
import {
  Depth,
  getMovementRangeTileIds,
  TILE_HEIGHT,
  TILE_WIDTH,
  Unit,
} from "../../models";
import {
  selectMapTilesEntities,
  State,
  selectMapWidth,
  selectMapHeight,
} from "../../state/reducers/initial-scene";

export class UnitRangeComponent extends Phaser.GameObjects.Container {
  constructor(
    readonly store: Store<State>,
    readonly scene: Phaser.Scene,
    readonly unit: Unit
  ) {
    super(scene);

    const state = this.store.getState();

    const mapWidth = selectMapWidth(state);
    const mapHeight = selectMapHeight(state);
    const mapTiles = selectMapTilesEntities(state);

    const destinationTileIds = getMovementRangeTileIds(
      unit,
      mapWidth,
      mapHeight,
      mapTiles
    );

    destinationTileIds.forEach((tileId) => {
      const tile = mapTiles[tileId];

      if (!tile) return;

      const rect = scene.add.rectangle(
        tile.x * TILE_WIDTH,
        tile.y * TILE_HEIGHT,
        TILE_WIDTH,
        TILE_HEIGHT,
        0x8888ff
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
