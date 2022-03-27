import { Store } from "@reduxjs/toolkit";
import { Depth, TILE_HEIGHT, TILE_WIDTH } from "../../models/consts";
import { createTile, getTileId, Tile } from "../../models/tile";
import {
  MapActions,
  selectMapHeight,
  selectMapWidth,
  State,
} from "../../state/reducers/initial-scene";

export class MapComponent extends Phaser.GameObjects.Container {
  constructor(readonly store: Store<State>, readonly scene: Phaser.Scene) {
    super(scene);

    const tiles: Tile[] = [];
    const state = store.getState();
    const width = selectMapWidth(state);
    const height = selectMapHeight(state);

    /**
     * @todo Move tile generation out of the map component.
     * Something should tell it what tiles to render.
     */
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const random = Math.floor(Math.random() * 100);
        const color = random >= 85 ? 0x0023d8 : 0x00dd00;
        const traversable = random < 85;
        const id = getTileId({ x, y });

        const rect = scene.add.rectangle(
          x * TILE_WIDTH,
          y * TILE_HEIGHT,
          TILE_WIDTH,
          TILE_HEIGHT,
          color
        );
        rect.setName(id);
        rect.setDepth(Depth.Tiles);
        rect.setOrigin(0, 0);

        this.add(rect);
        tiles.push(createTile(id, id, x, y, traversable)); // not sure what the name should actually be
      }
    }

    this.setDepth(Depth.Tiles);
    this.scene.add.existing(this);

    this.store.dispatch(MapActions.createMap({ tiles }));
  }
}
