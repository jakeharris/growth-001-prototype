import { Store } from "@reduxjs/toolkit";
import {
  createRandomInitialUnits,
  VIEWPORT_WIDTH,
  VIEWPORT_HEIGHT,
  getTileId,
  Team,
  addPositions,
  TILE_WIDTH,
  TILE_HEIGHT,
} from "../models";
import {
  selectHoveredUnit,
  selectMapTilesEntities,
  State,
  selectIsHoveringUnit,
  selectIsSelectingUnit,
  selectIsCursorOnValidDestinationTile,
  selectSelectedUnit,
  selectIsMoving,
  selectMovingUnit,
  selectMovingUnitId,
  selectMovementDelta,
  selectSelectedUnitId,
} from "../state/reducers/initial-scene";
import {
  ActionMenuActions,
  ControlActions,
  MapActions,
  UnitsActions,
} from "../state/reducers";
import {
  ActionMenuComponent,
  CursorComponent,
  MapComponent,
  UnitComponent,
} from "../components";
import { UnitRangeComponent } from "../components/initial-scene/unit-range.component";
import { UnitPendingPositionComponent } from "../components/initial-scene/unit-pending-position.component";

export class InitialScene extends Phaser.Scene {
  timer = 0;
  width = 20; // in tiles
  height = 17; // in tiles

  cursorComponent: CursorComponent | null = null;
  mapComponent: MapComponent | null = null;
  unitComponents: UnitComponent[] = [];

  hoveredUnitRangeComponent: UnitRangeComponent | null = null;

  selectedUnitRangeComponent: UnitRangeComponent | null = null;
  unitPendingPositionComponent: UnitPendingPositionComponent | null = null;

  movingUnitRangeComponent: UnitRangeComponent | null = null;
  movingUnitPendingPositionComponent: UnitPendingPositionComponent | null =
    null;
  actionMenuComponent: ActionMenuComponent | null = null;

  components: Phaser.GameObjects.Container[] = [];

  hasRenderedHovering = false;
  hasRenderedSelecting = false;
  hasRenderedMoving = false;

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
    this.store.dispatch(ActionMenuActions.preload());
  }

  update(time: number, delta: number) {
    if (
      this.components.includes(null as unknown as Phaser.GameObjects.Container)
    ) {
      this.components = this.components.filter((component) => component);
    }

    this.components.forEach((component) => component.update());

    const state = this.store.getState();
    const isHovering = selectIsHoveringUnit(state);
    const isSelecting = selectIsSelectingUnit(state);
    const isMoving = selectIsMoving(state);

    if (isHovering && !this.hasRenderedHovering) {
      const hoveredUnit = selectHoveredUnit(state)!;

      console.log("hovering unit", hoveredUnit);

      this.hoveredUnitRangeComponent = new UnitRangeComponent(
        this.store,
        this,
        hoveredUnit
      );

      this.components.push(this.hoveredUnitRangeComponent);

      this.hasRenderedHovering = true;
    }

    if (isSelecting && !this.hasRenderedSelecting) {
      const selectedUnit = selectSelectedUnit(state)!;

      console.log("selecting unit", selectedUnit);

      this.selectedUnitRangeComponent = new UnitRangeComponent(
        this.store,
        this,
        selectedUnit
      );
      this.unitPendingPositionComponent = new UnitPendingPositionComponent(
        this.store,
        this,
        selectedUnit
      );

      this.components.push(this.selectedUnitRangeComponent);
      this.components.push(this.unitPendingPositionComponent);

      this.hasRenderedSelecting = true;
    }

    if (isMoving && !this.hasRenderedMoving) {
      const movingUnit = selectMovingUnit(state)!;

      this.movingUnitRangeComponent = new UnitRangeComponent(
        this.store,
        this,
        movingUnit
      );
      this.movingUnitPendingPositionComponent =
        new UnitPendingPositionComponent(this.store, this, movingUnit);
      this.actionMenuComponent = new ActionMenuComponent(this.store, this);

      this.components.push(this.actionMenuComponent);
      this.hasRenderedMoving = true;
    }

    if (!isMoving && this.hasRenderedMoving) {
      this.movingUnitRangeComponent?.destroy();
      this.movingUnitPendingPositionComponent?.destroy();
      this.actionMenuComponent?.destroy();

      this.hasRenderedMoving = false;
    }

    if (!isSelecting && this.hasRenderedSelecting) {
      this.selectedUnitRangeComponent?.destroy();
      this.unitPendingPositionComponent?.destroy();

      this.hasRenderedSelecting = false;
    }

    if (!isHovering && this.hasRenderedHovering) {
      this.hoveredUnitRangeComponent?.destroy();

      this.hasRenderedHovering = false;
    }
  }

  create() {
    this.cursorComponent = new CursorComponent(this.store, this);
    this.mapComponent = new MapComponent(this.store, this);
    this.unitComponents = this.generateUnits();
    this.components.push(this.cursorComponent);
    this.components.push(this.mapComponent);
    this.components.push(...this.unitComponents);

    this.configureCamera();
    this.configureInput();
  }

  generateUnits() {
    const map = selectMapTilesEntities(this.store.getState());
    const units = createRandomInitialUnits(3, this.width, this.height, map);
    const unitComponents: UnitComponent[] = [];

    units.forEach((unit) => {
      unitComponents.push(new UnitComponent(this.store, this, unit));
    });

    this.store.dispatch(UnitsActions.createUnits({ units }));
    return unitComponents;
  }

  configureCamera() {
    const camera = this.cameras.main;

    const zoom = findZoomFactor(TILE_WIDTH, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
    camera.setZoom(zoom, zoom);

    const [xOffset, yOffset] = findScrollOffsets(
      VIEWPORT_WIDTH,
      VIEWPORT_HEIGHT,
      TILE_WIDTH,
      TILE_HEIGHT,
      zoom
    );
    camera.setScroll(xOffset, yOffset);

    camera.setBounds(0, 0, this.width * TILE_WIDTH, this.height * TILE_HEIGHT);

    if (this.cursorComponent)
      camera.startFollow(
        this.cursorComponent,
        false,
        0.1,
        0.1,
        TILE_WIDTH / 2,
        TILE_HEIGHT / 2
      );
  }

  // users phaser keyboard input to move the cursor, etc.
  configureInput() {
    this.input.keyboard.on("keydown-DOWN", () => {
      const isMoving = selectIsMoving(this.store.getState());
      if (!isMoving) {
        this.store.dispatch(ControlActions.moveCursor({ x: 0, y: 1 }));
      } else {
        this.store.dispatch(ActionMenuActions.moveCursorDown());
      }
    });
    this.input.keyboard.on("keydown-UP", () => {
      const isMoving = selectIsMoving(this.store.getState());
      if (!isMoving) {
        this.store.dispatch(ControlActions.moveCursor({ x: 0, y: -1 }));
      } else {
        this.store.dispatch(ActionMenuActions.moveCursorUp());
      }
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

      if (isHovering && !isSelecting && !isMoving) {
        const hoveredUnit = selectHoveredUnit(this.store.getState());

        if (
          hoveredUnit &&
          hoveredUnit.team === Team.Player &&
          !hoveredUnit.hasMoved
        ) {
          this.store.dispatch(ControlActions.selectUnit(hoveredUnit.id));
        }

        return;
      }

      if (isSelecting) {
        const isCursorOnValidDestinationTile =
          selectIsCursorOnValidDestinationTile(this.store.getState());

        if (isCursorOnValidDestinationTile) {
          const unit = selectSelectedUnit(this.store.getState())!;
          const mapTiles = selectMapTilesEntities(this.store.getState());
          const movementDelta = selectMovementDelta(this.store.getState());
          const destinationPosition = addPositions(
            unit.position,
            movementDelta
          );
          const destinationTile = mapTiles[getTileId(destinationPosition)]!;

          this.store.dispatch(
            ControlActions.moveUnit({
              unitId: unit.id,
              x: destinationTile.x,
              y: destinationTile.y,
            })
          );
        } else {
          const unit = selectSelectedUnit(this.store.getState())!;
          this.store.dispatch(ControlActions.cancelSelectUnit(unit.id));
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

        this.store.dispatch(ControlActions.confirmMoveUnit({ unitId }));
      }
    });

    this.input.keyboard.on("keydown-X", () => {
      const isSelecting = selectIsSelectingUnit(this.store.getState());
      const isMoving = selectIsMoving(this.store.getState());

      if (isSelecting) {
        const selectedUnitId = selectSelectedUnitId(this.store.getState())!;
        this.store.dispatch(ControlActions.cancelSelectUnit(selectedUnitId));
      }
      if (isMoving) {
        this.store.dispatch(ControlActions.cancelMoveUnit());
      }
    });
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
