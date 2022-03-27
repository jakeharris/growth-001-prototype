import { Dictionary, Store } from "@reduxjs/toolkit";
import {
  haveSamePosition,
  Position,
  createTile,
  Tile,
  getTeamColor,
  createRandomInitialUnits,
  VIEWPORT_WIDTH,
  VIEWPORT_HEIGHT,
  getTileId,
  Unit,
  Colors,
  Team,
  addPositions,
  Depth,
  TILE_WIDTH,
  TILE_HEIGHT,
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
  selectIsMoving,
  selectMovingUnit,
  selectMovingUnitId,
  selectSelectedUnitMovementTileIds,
  selectHoveredUnitMovementTileIds,
  selectMovingUnitMovementTileIds,
  selectMovementDelta,
} from "../state/reducers/initial-scene";
import {
  ActionMenuActions,
  ControlActions,
  MapActions,
  UnitsActions,
} from "../state/reducers";
import { ActionMenuComponent } from "../components/action-menu/action-menu.component";
import { CursorComponent } from "../components/cursor/cursor.component";

export class InitialScene extends Phaser.Scene {
  timer = 0;
  width = 20; // in tiles
  height = 17; // in tiles

  cursor: CursorComponent | null = null;

  hasRenderedHoveredUnit = false;
  renderedHoveredUnit: Unit | null = null;
  hoveredUnitMovementTilesGroup: Phaser.GameObjects.Group | null = null;

  hasRenderedSelectedUnitPendingMovement = false;
  hasRenderedSelectedUnitMovementRange = false;
  renderedSelectedUnit: Unit | null = null;
  selectedUnitPendingMovementGroup: Phaser.GameObjects.Group | null = null;
  selectedUnitMovementTilesGroup: Phaser.GameObjects.Group | null = null;

  hasRenderedMovingUnit = false;
  renderedMovingUnit: Unit | null = null;
  movingUnitGroup: Phaser.GameObjects.Group | null = null;
  actionMenu: ActionMenuComponent | null = null;

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
    this.cursor?.update();

    const isHovering = selectIsHoveringUnit(this.store.getState());
    const isSelecting = selectIsSelectingUnit(this.store.getState());
    const isMoving = selectIsMoving(this.store.getState());

    const selectedUnit = selectSelectedUnit(this.store.getState());
    if (
      isSelecting &&
      selectedUnit &&
      !haveSamePosition(selectedUnit.position, selectedUnit.pendingPosition!)
    ) {
      this.hasRenderedSelectedUnitPendingMovement = false;
    }

    /**
     * @todo Candidate for epic?
     */
    if (
      !this.hasRenderedHoveredUnit &&
      isHovering &&
      !isSelecting &&
      !isMoving
    ) {
      const hoveredUnit = selectHoveredUnit(this.store.getState());

      if (!hoveredUnit?.hasMoved) this.renderHover();
    }

    /**
     * @todo Candidate for epic?
     */
    if (
      this.hasRenderedHoveredUnit &&
      (!isHovering || isSelecting || isMoving)
    ) {
      this.clearHover();
    }

    /**
     * @todo Candidate for epic?
     */
    if (!this.hasRenderedSelectedUnitMovementRange && isSelecting) {
      this.renderSelect();
    }

    if (!this.hasRenderedSelectedUnitPendingMovement && isSelecting) {
      this.renderSelect();
    }

    /**
     * @todo Candidate for epic?
     */
    if (
      (this.hasRenderedSelectedUnitMovementRange ||
        this.hasRenderedSelectedUnitPendingMovement) &&
      !isSelecting
    ) {
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

    if (this.actionMenu) this.actionMenu.update();
  }

  create() {
    this.cursor = new CursorComponent(this.store, this);
    this.generateMap();
    this.generateUnits();

    this.configureCamera();
    this.configureInput();
  }

  generateMap() {
    const grid = this.add.group();
    const tiles: Tile[] = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const random = Math.floor(Math.random() * 100);
        const color = random >= 85 ? 0x0023d8 : 0x00dd00;
        const traversable = random < 85;
        const id = getTileId({ x, y });

        const rect = this.add.rectangle(
          x * TILE_WIDTH,
          y * TILE_HEIGHT,
          TILE_WIDTH,
          TILE_HEIGHT,
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
      const unitGroup = this.add.group();
      unitGroup.setName(`unit-${unit.id}`);

      unit.bodyPositions.forEach((bodyPosition) => {
        const absoluteBodyPosition = addPositions(unit.position, bodyPosition);
        const circle = this.add.circle(
          absoluteBodyPosition.x * TILE_WIDTH,
          absoluteBodyPosition.y * TILE_HEIGHT,
          TILE_WIDTH / 2,
          getTeamColor(unit.team)
        );
        circle.setDepth(Depth.Units);
        circle.setOrigin(0, 0);
        circle.setName(
          `unit-${unit.id}-body-${bodyPosition.x}-${bodyPosition.y}`
        );
        circle.setInteractive();
        unitGroup.add(circle);
      });
    });

    this.store.dispatch(UnitsActions.createUnits({ units }));
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

    if (this.cursor)
      camera.startFollow(
        this.cursor,
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
        this.hasRenderedActionMenuCursor = false;
      }
    });
    this.input.keyboard.on("keydown-UP", () => {
      const isMoving = selectIsMoving(this.store.getState());
      if (!isMoving) {
        this.store.dispatch(ControlActions.moveCursor({ x: 0, y: -1 }));
      } else {
        this.store.dispatch(ActionMenuActions.moveCursorUp());
        this.hasRenderedActionMenuCursor = false;
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

        unit.bodyPositions.forEach((bodyPosition) => {
          const sprite = this.children.getByName(
            `unit-${unitId}-body-${bodyPosition.x}-${bodyPosition.y}`
          ) as Phaser.GameObjects.Shape;

          if (!sprite)
            throw new Error(
              `tried moving a unit, but couldn\'t find sprite for body position (${bodyPosition.x}, ${bodyPosition.y})`
            );

          const absolutePendingBodyPosition = addPositions(
            unit.pendingPosition!,
            bodyPosition
          );
          sprite.setPosition(
            absolutePendingBodyPosition.x * TILE_WIDTH,
            absolutePendingBodyPosition.y * TILE_HEIGHT
          );
          sprite.fillColor = Colors.TurnTaken;
        });

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

  /**
   * Display a unit's movement range.
   * @param unit The unit to display the movement range for.
   * @param mapTiles The tiles of the current map.
   */
  renderMovementRange(
    unit: Unit,
    destinationTileIds: string[],
    mapTiles: Dictionary<Tile>
  ): Phaser.GameObjects.Group {
    const movementTilesGroup = this.add
      .group()
      .setName(`unit-${unit.id}-movement`);

    destinationTileIds.forEach((tileId) => {
      const tile = mapTiles[tileId];

      if (!tile) return;

      const rect = this.add.rectangle(
        tile.x * TILE_WIDTH,
        tile.y * TILE_HEIGHT,
        TILE_WIDTH,
        TILE_HEIGHT,
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
  renderPendingMovement(unit: Unit): Phaser.GameObjects.Group {
    const group = this.add.group().setName(`unit-${unit.id}-pending`);
    if (!unit.pendingPosition) throw Error("Unit has no pending position");

    unit.bodyPositions.forEach((bodyPosition) => {
      const absolutePendingBodyPosition = addPositions(
        unit.pendingPosition!,
        bodyPosition
      );
      const spritePosition = this.add.circle(
        absolutePendingBodyPosition.x * TILE_WIDTH,
        absolutePendingBodyPosition.y * TILE_HEIGHT,
        TILE_WIDTH / 2,
        getTeamColor(unit.team)
      );
      spritePosition.setName(`unit-${unit.id}-pending-position`);
      spritePosition.setAlpha(0.7);
      spritePosition.setDepth(Depth.Units);
      spritePosition.setOrigin(0, 0);
      group.add(spritePosition);
    });

    return group;
  }

  clearSelect() {
    this.selectedUnitMovementTilesGroup?.destroy(true, true);
    this.selectedUnitMovementTilesGroup = null;
    this.selectedUnitPendingMovementGroup?.destroy(true, true);
    this.selectedUnitPendingMovementGroup = null;
    this.hasRenderedSelectedUnitMovementRange = false;
    this.hasRenderedSelectedUnitPendingMovement = false;
  }

  renderSelect() {
    const mapTiles = selectMapTilesEntities(this.store.getState());
    const selectedUnit = selectSelectedUnit(this.store.getState());
    const selectedUnitMovementTileIds = selectSelectedUnitMovementTileIds(
      this.store.getState()
    );
    console.log(`Selected unit:`, selectedUnit);
    if (!selectedUnit)
      throw new Error(
        "tried to render selected unit, but selectedUnit is not defined"
      );

    if (!this.hasRenderedSelectedUnitMovementRange) {
      this.selectedUnitMovementTilesGroup = this.renderMovementRange(
        selectedUnit!,
        selectedUnitMovementTileIds,
        mapTiles
      );
      this.hasRenderedSelectedUnitMovementRange = true;
    }

    if (!this.hasRenderedSelectedUnitPendingMovement) {
      if (this.selectedUnitPendingMovementGroup) {
        this.selectedUnitPendingMovementGroup.destroy(true, true);
      }

      this.selectedUnitPendingMovementGroup =
        this.renderPendingMovement(selectedUnit);
      this.hasRenderedSelectedUnitPendingMovement = true;
    }
  }

  clearHover() {
    this.hoveredUnitMovementTilesGroup?.destroy(true, true);
    this.hoveredUnitMovementTilesGroup = null;
    this.hasRenderedHoveredUnit = false;
  }

  renderHover() {
    const mapTiles = selectMapTilesEntities(this.store.getState());
    const hoveredUnit = selectHoveredUnit(this.store.getState());
    const hoveredUnitMovementTileIds = selectHoveredUnitMovementTileIds(
      this.store.getState()
    );
    console.log(`Hovered unit:`, hoveredUnit);
    this.hoveredUnitMovementTilesGroup = this.renderMovementRange(
      hoveredUnit!,
      hoveredUnitMovementTileIds,
      mapTiles
    );
    this.hasRenderedHoveredUnit = true;
  }

  renderMove() {
    const movingUnit = selectMovingUnit(this.store.getState());
    const movingUnitMovementTileIds = selectMovingUnitMovementTileIds(
      this.store.getState()
    );
    const mapTiles = selectMapTilesEntities(this.store.getState());
    console.log(`Moving unit:`, movingUnit);
    const movementRangeGroup = this.renderMovementRange(
      movingUnit!,
      movingUnitMovementTileIds,
      mapTiles
    );
    this.movingUnitGroup = this.renderPendingMovement(movingUnit!);
    this.movingUnitGroup.addMultiple(movementRangeGroup.getChildren());
    this.hasRenderedMovingUnit = true;

    this.actionMenu = new ActionMenuComponent(this.store, this);
  }

  clearMove() {
    this.movingUnitGroup?.destroy(true, true);
    this.movingUnitGroup = null;
    this.hasRenderedMovingUnit = false;

    this.actionMenu?.destroy();
    this.actionMenu = null;
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
