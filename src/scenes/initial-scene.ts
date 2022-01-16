import { Dictionary, Store } from "@reduxjs/toolkit";
import {
  haveSamePosition,
  Positioned,
  createTile,
  Tile,
  getTeamColor,
  createRandomInitialUnits,
  VIEWPORT_WIDTH,
  VIEWPORT_HEIGHT,
  getTileId,
  Unit,
} from "../models";
import {
  selectHoveredUnit,
  selectCursorPosition,
  selectMapTilesEntities,
  State,
  selectIsHoveringUnit,
  selectIsSelectingUnit,
} from "../state/reducers/initial-scene";
import { actions as MapActions } from "../state/reducers/initial-scene/map.state";
import { actions as UnitsActions } from "../state/reducers/initial-scene/units.state";
import { actions as ControlActions } from "../state/reducers/initial-scene/control.state";

export class InitialScene extends Phaser.Scene {
  timer = 0;
  width = 20; // in tiles
  height = 17; // in tiles
  tileWidth = 32;
  tileHeight = 32;

  cursor: Phaser.GameObjects.Rectangle | null = null;

  cursorPosition: Positioned = { x: 0, y: 0 };

  hasPrintedHoveredUnit = false; // debug
  hoveredUnitMovementTilesGroup: Phaser.GameObjects.Group | null = null;

  constructor(private store: Store<State>) {
    super({ key: "InitialScene" });
  }

  preload() {
    this.store.dispatch(MapActions.preload());
    this.store.dispatch(UnitsActions.preload());
    this.store.dispatch(
      ControlActions.preload({ width: this.width, height: this.height })
    );
  }

  update(time: number, delta: number) {
    // handle changes to cursor position
    const newCursorPosition = selectCursorPosition(this.store.getState());
    if (this.cursor && this.cursorHasMoved(newCursorPosition)) {
      this.cursorPosition = newCursorPosition;
      this.cursor.setPosition(
        newCursorPosition.x * this.tileWidth,
        newCursorPosition.y * this.tileHeight
      );
    }

    const isHovering = selectIsHoveringUnit(this.store.getState());
    const isSelecting = selectIsSelectingUnit(this.store.getState());

    /**
     * @todo Candidate for epic?
     */
    if (!this.hasPrintedHoveredUnit && isHovering) {
      const mapTiles = selectMapTilesEntities(this.store.getState());
      const hoveredUnit = selectHoveredUnit(this.store.getState());
      console.log(`Hovered unit:`, hoveredUnit);
      this.hoveredUnitMovementTilesGroup = this.renderMovementRange(
        hoveredUnit!,
        mapTiles
      );
      this.hasPrintedHoveredUnit = true;
    }
    if (!isHovering && !isSelecting) {
      this.hoveredUnitMovementTilesGroup?.destroy(true, true);
      this.hoveredUnitMovementTilesGroup = null;
      this.hasPrintedHoveredUnit = false;
    }
  }

  create() {
    this.generateCursor();
    this.generateMap();
    this.generateUnits();

    this.configureCamera();
    this.configureInput();
  }

  generateCursor() {
    const cursor = this.add.rectangle(
      0,
      0,
      this.tileWidth,
      this.tileHeight,
      0xffffff
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

    this.cursorPosition = selectCursorPosition(this.store.getState());
  }

  generateMap() {
    const grid = this.add.group();
    const tiles: Tile[] = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const random = Math.floor(Math.random() * 2);
        const color = random === 0 ? 0x0023d8 : 0x00dd00;
        const traversable = random === 1;
        const name = getTileId(x, y);

        const rect = this.add.rectangle(
          x * this.tileWidth,
          y * this.tileHeight,
          this.tileWidth,
          this.tileHeight,
          color
        );
        rect.setName(name);
        rect.setOrigin(0, 0);

        grid.add(rect);
        tiles.push(createTile(name, x, y, traversable));
      }
    }

    this.store.dispatch(MapActions.createMap({ tiles }));
  }

  generateUnits() {
    const map = selectMapTilesEntities(this.store.getState());
    const units = createRandomInitialUnits(3, this.width, this.height, map);

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

  configureCamera() {
    const camera = this.cameras.main;

    const zoom = findZoomFactor(
      this.tileWidth,
      VIEWPORT_WIDTH,
      VIEWPORT_HEIGHT
    );
    camera.setZoom(zoom, zoom);

    const [xOffset, yOffset] = findScrollOffsets(
      VIEWPORT_WIDTH,
      VIEWPORT_HEIGHT,
      this.tileWidth,
      this.tileHeight,
      zoom
    );
    camera.setScroll(xOffset, yOffset);

    camera.setBounds(
      0,
      0,
      this.width * this.tileWidth,
      this.height * this.tileHeight
    );

    if (this.cursor)
      camera.startFollow(
        this.cursor,
        false,
        0.1,
        0.1,
        this.tileWidth / 2,
        this.tileHeight / 2
      );
  }

  // users phaser keyboard input to move the cursor, etc.
  configureInput() {
    this.input.keyboard.on("keydown-DOWN", () =>
      this.store.dispatch(ControlActions.moveCursor({ x: 0, y: 1 }))
    );
    this.input.keyboard.on("keydown-UP", () =>
      this.store.dispatch(ControlActions.moveCursor({ x: 0, y: -1 }))
    );
    this.input.keyboard.on("keydown-LEFT", () =>
      this.store.dispatch(ControlActions.moveCursor({ x: -1, y: 0 }))
    );
    this.input.keyboard.on("keydown-RIGHT", () =>
      this.store.dispatch(ControlActions.moveCursor({ x: 1, y: 0 }))
    );

    this.input.keyboard.on("keydown-Z", () => {
      const isHovering = selectIsHoveringUnit(this.store.getState());
      const isSelecting = selectIsSelectingUnit(this.store.getState());

      if (isHovering) {
        const unit = selectHoveredUnit(this.store.getState());

        if (unit && !unit.hasMoved) {
          this.store.dispatch(ControlActions.selectUnit(unit));
        }

        return;
      }

      if (isSelecting) {
        const isCursorOnValidDestinationTile =
          selectIsCursorOnValidDestinationTile(this.store.getState());

        if (isCursorOnValidDestinationTile) {
          console.log("valid!");
          // this.store.dispatch(ControlActions.moveUnit());
        } else console.log("invalid!");

        return;
      }
    });
  }

  cursorHasMoved(newCursorPosition: Positioned) {
    return (
      newCursorPosition &&
      this.cursorPosition &&
      !haveSamePosition(newCursorPosition, this.cursorPosition)
    );
  }

  /**
   * Display a unit's movement range.
   * @param unit The unit to display the movement range for.
   * @param mapTiles The tiles of the current map.
   */
  renderMovementRange(
    unit: Unit,
    mapTiles: Dictionary<Tile>
  ): Phaser.GameObjects.Group {
    const { destinationTiles: destinationTilesIds } = unit;
    const movementTilesGroup = this.add
      .group()
      .setName(`unit-${unit.id}-movement`);

    destinationTilesIds.forEach((tileId) => {
      const tile = mapTiles[tileId];

      if (!tile) return;

      const rect = this.add.rectangle(
        tile.x * this.tileWidth,
        tile.y * this.tileHeight,
        this.tileWidth,
        this.tileHeight,
        0x8888ff
      );
      rect.setAlpha(0.7);
      rect.setDepth(4);
      rect.setOrigin(0, 0);
      movementTilesGroup.add(rect);
    });

    return movementTilesGroup;
  }
}

/**
 *
 * @param viewportWidth The width of the viewport in pixels
 * @param viewportHeight The height of the viewport in pixels
 * @param tileWidth The width of a tile in pixels
 * @param tileHeight The height of a tile in pixels
 * @param zoomFactor The zoom factor, such that tiles cleanly divide the viewport size
 * @returns The x- and y-offsets to use to position the camera such that
 *   the top-left of the grid perfectly aligns with the top-left of the viewport
 */
function findScrollOffsets(
  viewportWidth: number,
  viewportHeight: number,
  tileWidth: number,
  tileHeight: number,
  zoomFactor: number
) {
  const horizontallyVisibleTiles = viewportWidth / (tileWidth * zoomFactor);
  const verticallyVisibleTiles = viewportHeight / (tileHeight * zoomFactor);
  const xScrollOffset =
    viewportWidth / 2 - (tileWidth * horizontallyVisibleTiles) / 2;
  const yScrollOffset =
    viewportHeight / 2 - (tileHeight * verticallyVisibleTiles) / 2;

  return [-xScrollOffset, -yScrollOffset];
}

/**
 * Find the zoom factor z that, when multiplied by k, results in the
 * smallest value >= 1 that cleanly divides both a and b.
 * @param k The number to scale. Here, the size of a tile in pixels.
 * @param a An integer. Here, the width of the viewport in pixels.
 * @param b An integer. Here, the height of the viewport in pixels.
 * @returns The zoom factor, z.
 */
function findZoomFactor(k: number, a: number, b: number) {
  const gcd = findGreatestCommonDenominator(a, b);

  const allCommonFactors = Array.from(Array(gcd + 1), (_, i) => i).filter(
    (i) => gcd % i === 0
  );
  const smallestCommonFactorBiggerThanOrEqualToTileSize = Math.min(
    ...allCommonFactors.filter((i) => i >= k)
  );

  return smallestCommonFactorBiggerThanOrEqualToTileSize / k;
}

/**
 * Recursively finds the greatest common denominator of two numbers.
 * @param a An integer.
 * @param b An integer.
 * @returns The greatest common denominator between a and b.
 */
function findGreatestCommonDenominator(a: number, b: number): number {
  if (b === 0) {
    return a;
  }
  return findGreatestCommonDenominator(b, a % b);
}
