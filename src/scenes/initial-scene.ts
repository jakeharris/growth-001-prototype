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
  Colors,
} from "../models";
import {
  selectHoveredUnit,
  selectCursorPosition,
  selectMapTilesEntities,
  State,
  selectIsHoveringUnit,
  selectIsSelectingUnit,
  selectIsCursorOnValidDestinationTile,
  selectSelectedUnit,
  selectDestinationTile,
  selectIsMoving,
  selectMovingUnit,
  selectMovingUnitId,
} from "../state/reducers/initial-scene";
import { actions as MapActions } from "../state/reducers/initial-scene/map.state";
import { actions as UnitsActions } from "../state/reducers/initial-scene/units.state";
import { actions as ControlActions } from "../state/reducers/initial-scene/control.state";

const enum Depth {
  Tiles = 0,
  Units = 5,
  Cursor = 10,
}

export class InitialScene extends Phaser.Scene {
  timer = 0;
  width = 20; // in tiles
  height = 17; // in tiles
  tileWidth = 32;
  tileHeight = 32;

  cursor: Phaser.GameObjects.Rectangle | null = null;

  cursorPosition: Positioned = { x: 0, y: 0 };

  hasRenderedHoveredUnit = false;
  renderedHoveredUnit: Unit | null = null;
  hoveredUnitMovementTilesGroup: Phaser.GameObjects.Group | null = null;

  hasRenderedSelectedUnit = false;
  renderedSelectedUnit: Unit | null = null;
  selectedUnitMovementTilesGroup: Phaser.GameObjects.Group | null = null;

  hasRenderedMovingUnit = false;
  renderedMovingUnit: Unit | null = null;
  movingUnitGroup: Phaser.GameObjects.Group | null = null;

  constructor(private store: Store<State>) {
    super({ key: "InitialScene" });
  }

  preload() {
    /**
     * @todo Turn this all into one message that all reducers/slices are listening for
     */
    this.store.dispatch(MapActions.preload());
    this.store.dispatch(UnitsActions.preload());
    this.store.dispatch(
      ControlActions.preload({ width: this.width, height: this.height })
    );
  }

  update(time: number, delta: number) {
    /**
     * @todo Candidate for epic?
     */
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
    const isMoving = selectIsMoving(this.store.getState());

    /**
     * @todo Candidate for epic?
     */
    if (!this.hasRenderedHoveredUnit && isHovering) {
      this.renderHover();
    }

    /**
     * @todo Candidate for epic?
     */
    if (this.hasRenderedHoveredUnit && !isHovering) {
      this.clearHover();
    }

    /**
     * @todo Candidate for epic?
     */
    if (!this.hasRenderedSelectedUnit && isSelecting) {
      this.renderSelect();
    }

    /**
     * @todo Candidate for epic?
     */
    if (this.hasRenderedSelectedUnit && !isSelecting) {
      this.clearSelect();
    }

    /**
     * @todo Candidate for epic?
     */
    if (!this.hasRenderedMovingUnit && isMoving) {
      this.renderMove();
    }

    /**
     * @todo Candidate for epic?
     */
    if (this.hasRenderedMovingUnit && !isMoving) {
      this.clearMove();
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
    cursor.setDepth(Depth.Cursor);
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
        const id = getTileId(x, y);

        const rect = this.add.rectangle(
          x * this.tileWidth,
          y * this.tileHeight,
          this.tileWidth,
          this.tileHeight,
          color
        );
        rect.setName(id);
        rect.setDepth(Depth.Tiles);
        rect.setOrigin(0, 0);

        grid.add(rect);
        tiles.push(createTile(id, id, x, y, traversable)); // not sure what the name should actually be
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
      circle.setDepth(Depth.Units);
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
    this.input.keyboard.on("keydown-DOWN", () => {
      const isMoving = selectIsMoving(this.store.getState());
      if (!isMoving)
        this.store.dispatch(ControlActions.moveCursor({ x: 0, y: 1 }));
    });
    this.input.keyboard.on("keydown-UP", () => {
      const isMoving = selectIsMoving(this.store.getState());
      if (!isMoving)
        this.store.dispatch(ControlActions.moveCursor({ x: 0, y: -1 }));
    });
    this.input.keyboard.on("keydown-LEFT", () => {
      const isMoving = selectIsMoving(this.store.getState());
      if (!isMoving)
        this.store.dispatch(ControlActions.moveCursor({ x: -1, y: 0 }));
    });
    this.input.keyboard.on("keydown-RIGHT", () => {
      const isMoving = selectIsMoving(this.store.getState());
      if (!isMoving)
        this.store.dispatch(ControlActions.moveCursor({ x: 1, y: 0 }));
    });

    this.input.keyboard.on("keydown-Z", () => {
      const isHovering = selectIsHoveringUnit(this.store.getState());
      const isSelecting = selectIsSelectingUnit(this.store.getState());
      const isMoving = selectIsMoving(this.store.getState());

      if (isHovering) {
        const hoveredUnit = selectHoveredUnit(this.store.getState());

        if (hoveredUnit && !hoveredUnit.hasMoved) {
          this.store.dispatch(ControlActions.selectUnit(hoveredUnit.id));
          /**
           * @todo Candidate for epic?
           */
          this.clearSelect();
        }

        return;
      }

      if (isSelecting) {
        const isCursorOnValidDestinationTile =
          selectIsCursorOnValidDestinationTile(this.store.getState());

        if (isCursorOnValidDestinationTile) {
          const unit = selectSelectedUnit(this.store.getState())!;
          const destinationTile = selectDestinationTile(this.store.getState())!;

          console.log("valid!");

          this.store.dispatch(
            ControlActions.moveUnit({
              unitId: unit.id,
              x: destinationTile.x,
              y: destinationTile.y,
            })
          );
        } else {
          this.store.dispatch(ControlActions.cancelSelectUnit());
        }

        return;
      }

      if (isMoving) {
        const unitId = selectMovingUnitId(this.store.getState());

        if (!unitId) throw new Error("tried moving a unit but unitId is null");

        /**
         * @todo Candidate for epic?
         * If so, this will happen after the dispatch
         */
        const unit = selectMovingUnit(this.store.getState());

        if (!unit) throw new Error("tried moving a unit but unit is null");
        if (!unit.pendingPosition)
          throw new Error(
            "tried moving a unit but unit.pendingPosition is null"
          );

        const unitDisplay = this.children.getByName(
          `unit-${unitId}`
        )! as Phaser.GameObjects.Shape;
        unitDisplay.setPosition(
          unit.pendingPosition.x * this.tileWidth,
          unit.pendingPosition.y * this.tileHeight
        );
        unitDisplay.fillColor = Colors.TurnTaken;

        this.store.dispatch(ControlActions.confirmMoveUnit({ unitId }));
      }
    });

    this.input.keyboard.on("keydown-X", () => {
      const isSelecting = selectIsSelectingUnit(this.store.getState());
      const isMoving = selectIsMoving(this.store.getState());

      if (isSelecting) {
        this.store.dispatch(ControlActions.cancelSelectUnit());
        this.clearSelect();
      }
      if (isMoving) {
        this.store.dispatch(ControlActions.cancelMoveUnit());
        this.clearMove();
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
      rect.setDepth(Depth.Tiles + 1);
      rect.setOrigin(0, 0);
      movementTilesGroup.add(rect);
    });

    return movementTilesGroup;
  }

  /**
   * Display a unit's pending movement in the context of their
   * movement range and current position.
   * @param unit The unit to display the movement for.
   * @param mapTiles The tiles of the current map.
   */
  renderPendingMovement(
    unit: Unit,
    mapTiles: Dictionary<Tile>
  ): Phaser.GameObjects.Group {
    console.log(unit);
    const group = this.renderMovementRange(unit, mapTiles);

    if (!unit.pendingPosition) throw Error("Unit has no pending position");

    const newPosition = this.add.circle(
      unit.pendingPosition.x * this.tileWidth,
      unit.pendingPosition.y * this.tileHeight,
      this.tileWidth / 2,
      getTeamColor(unit.team)
    );
    newPosition.setName(`unit-${unit.id}-pending-position`);
    newPosition.setAlpha(0.7);
    newPosition.setDepth(Depth.Cursor + 1);
    newPosition.setOrigin(0, 0);

    group.add(newPosition);
    return group;
  }

  clearSelect() {
    this.selectedUnitMovementTilesGroup?.destroy(true, true);
    this.selectedUnitMovementTilesGroup = null;
    this.hasRenderedSelectedUnit = false;
  }

  renderSelect() {
    if (this.cursor) this.cursor.fillColor = 0xdddd00;
    const mapTiles = selectMapTilesEntities(this.store.getState());
    const selectedUnit = selectSelectedUnit(this.store.getState());
    console.log(`Selected unit:`, selectedUnit);
    this.selectedUnitMovementTilesGroup = this.renderMovementRange(
      selectedUnit!,
      mapTiles
    );
    this.hasRenderedSelectedUnit = true;
  }

  clearHover() {
    this.hoveredUnitMovementTilesGroup?.destroy(true, true);
    this.hoveredUnitMovementTilesGroup = null;
    this.hasRenderedHoveredUnit = false;
  }

  renderHover() {
    const mapTiles = selectMapTilesEntities(this.store.getState());
    const hoveredUnit = selectHoveredUnit(this.store.getState());
    console.log(`Hovered unit:`, hoveredUnit);
    this.hoveredUnitMovementTilesGroup = this.renderMovementRange(
      hoveredUnit!,
      mapTiles
    );
    this.hasRenderedHoveredUnit = true;
  }

  renderMove() {
    const movingUnit = selectMovingUnit(this.store.getState());
    const mapTiles = selectMapTilesEntities(this.store.getState());
    console.log(`Moving unit:`, movingUnit);
    this.movingUnitGroup = this.renderPendingMovement(movingUnit!, mapTiles);
    this.hasRenderedMovingUnit = true;
  }

  clearMove() {
    this.movingUnitGroup?.destroy(true, true);
    this.movingUnitGroup = null;
    this.hasRenderedMovingUnit = false;
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
