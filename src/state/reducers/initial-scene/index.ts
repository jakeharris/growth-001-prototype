import { createSelector } from "@reduxjs/toolkit";
import * as MapState from "./map.state";
import * as UnitsState from "./units.state";
import * as ControlState from "./control.state";
import * as ActionMenuState from "./action-menu.state";
import {
  getAbsoluteBodyPositions,
  getDestinationPositions,
  getUnitRangeTileIds,
  getTileId,
  haveSamePosition,
  subtractPositions,
} from "../../../models";

export { ActionMenuActions } from "./action-menu.state";
export { ControlActions } from "./control.state";
export { MapActions } from "./map.state";
export { UnitsActions } from "./units.state";

export type State = {
  map: MapState.State;
  units: UnitsState.State;
  control: ControlState.State;
  actionMenu: ActionMenuState.State;
};

export const reducers = {
  map: MapState.reducer,
  units: UnitsState.reducer,
  control: ControlState.reducer,
  actionMenu: ActionMenuState.reducer,
};

/**
 * Map
 */

export const selectMapState = (state: State) => state.map;

export const selectAllMapTiles = createSelector(
  selectMapState,
  MapState.selectAll
);

export const selectMapTilesEntities = createSelector(
  selectMapState,
  MapState.selectEntities
);

/**
 * Units
 */

export const selectUnitsState = (state: State) => state.units;

export const selectUnits = createSelector(
  selectUnitsState,
  UnitsState.selectAll
);

/**
 * Control
 */

export const selectControlState = (state: State) => state.control;
export const selectCursorPosition = createSelector(
  selectControlState,
  ControlState.selectCursorPosition
);
export const selectMapWidth = createSelector(
  selectControlState,
  ControlState.selectMapWidth
);
export const selectMapHeight = createSelector(
  selectControlState,
  ControlState.selectMapHeight
);
export const selectHoveredUnit = createSelector(
  selectUnits,
  selectCursorPosition,
  (units, cursorPosition) =>
    units.find((unit) =>
      getAbsoluteBodyPositions(unit).some((pos) =>
        haveSamePosition(pos, cursorPosition)
      )
    )
);
export const selectHoveredUnitMovementTileIds = createSelector(
  selectHoveredUnit,
  selectMapWidth,
  selectMapHeight,
  selectMapTilesEntities,
  (unit, width, height, mapTiles) =>
    unit ? getUnitRangeTileIds(unit, width, height, mapTiles) : []
);
export const selectSelectedUnitId = createSelector(
  selectControlState,
  ControlState.selectSelectedUnitId
);
export const selectSelectedUnit = createSelector(
  selectSelectedUnitId,
  selectUnits,
  (selectedUnitId, units) => units.find((unit) => unit.id === selectedUnitId)
);
export const selectIsHoveringUnit = createSelector(
  selectHoveredUnit,
  selectSelectedUnit,
  (hoveredUnit, selectedUnit) =>
    hoveredUnit !== undefined &&
    !hoveredUnit.hasMoved &&
    selectedUnit === undefined
);

/**
 * @todo Should we just determine the selected unit's movement range?
 * Or should we calculate them all at once and return user viewmodels?
 */
export const selectSelectedUnitMovementTileIds = createSelector(
  selectSelectedUnit,
  selectMapWidth,
  selectMapHeight,
  selectMapTilesEntities,
  (unit, width, height, mapTiles) =>
    unit ? getUnitRangeTileIds(unit, width, height, mapTiles) : []
);
export const selectIsSelectingUnit = createSelector(
  selectControlState,
  ControlState.selectIsSelectingUnit
);
export const selectMoveSourcePosition = createSelector(
  selectControlState,
  ControlState.selectMoveSourcePosition
);
export const selectMovementDelta = createSelector(
  selectMoveSourcePosition,
  selectCursorPosition,
  (sourcePosition, cursorPosition) => {
    if (!sourcePosition) {
      return { x: 0, y: 0 };
    }

    return subtractPositions(cursorPosition, sourcePosition);
  }
);

export const selectIsCursorOnValidDestinationTile = createSelector(
  selectUnits,
  selectMovementDelta,
  selectSelectedUnit,
  selectMapTilesEntities,
  (units, movementDelta, selectedUnit, mapTiles) => {
    if (!selectedUnit) return false;

    if (movementDelta.x === 0 && movementDelta.y === 0) return true;

    const destinationPositions = getDestinationPositions(
      selectedUnit,
      movementDelta
    );

    const isDestinationTileWithinRange =
      Math.abs(movementDelta.x) + Math.abs(movementDelta.y) <=
      selectedUnit.range;

    if (!isDestinationTileWithinRange) return false;

    // for each destination position, check if there is another unit already there, and whether or not it is traversable
    return destinationPositions.every((destinationPosition) => {
      const tile = mapTiles[getTileId(destinationPosition)];

      if (!tile) return false;
      if (!tile.traversable) return false;

      // check if there is another unit already there
      // pseudo-code:
      // ask each unit for all positions it consumes (absolute body positions)
      // if any unit consumes the destination position, return false
      /**
       * @todo This could stand some optimization.
       */
      return units.every((unit) => {
        const absoluteBodyPositions = getAbsoluteBodyPositions(unit);

        return !absoluteBodyPositions.some((absoluteBodyPosition) => {
          return haveSamePosition(absoluteBodyPosition, destinationPosition);
        });
      });
    });
  }
);
export const selectIsMoving = createSelector(
  selectControlState,
  ControlState.selectIsMoving
);
export const selectMovingUnitId = createSelector(
  selectControlState,
  ControlState.selectMovingUnitId
);
export const selectMovingUnit = createSelector(
  selectUnits,
  selectMovingUnitId,
  (units, movingUnitId) => units.find((unit) => unit.id === movingUnitId)
);
export const selectMovingUnitPendingPosition = createSelector(
  selectMovingUnit,
  (unit) => (unit ? unit.pendingPosition : undefined)
);
export const selectMovingUnitMovementTileIds = createSelector(
  selectMovingUnit,
  selectMapWidth,
  selectMapHeight,
  selectMapTilesEntities,
  (unit, width, height, mapTiles) =>
    unit ? getUnitRangeTileIds(unit, width, height, mapTiles) : []
);
export const selectPreviousUnitPosition = createSelector(
  selectMovingUnit,
  (movingUnit) => (movingUnit ? movingUnit.position : null)
);

/**
 * Action Menu
 */
export const selectActionMenuState = (state: State) => state.actionMenu;
export const selectActionMenuCursorIndex = createSelector(
  selectActionMenuState,
  ActionMenuState.selectCursorIndex
);

export const selectAvailableActions = createSelector(
  selectActionMenuState,
  ActionMenuState.selectActions
);
export const selectActionMenuWidth = createSelector(
  selectAvailableActions,
  () => 3 // @todo: determine this dynamically
);
export const selectMovingUnitRelativeWidthBounds = createSelector(
  selectMovingUnit,
  (
    movingUnit
  ): {
    leftmost: number;
    rightmost: number;
  } => {
    if (!movingUnit) return { leftmost: 0, rightmost: 0 };

    const leftmost = Math.min(...movingUnit.bodyPositions.map((pos) => pos.x));
    const rightmost = Math.max(...movingUnit.bodyPositions.map((pos) => pos.x));

    return { leftmost, rightmost };
  }
);
export const selectActionMenuPosition = createSelector(
  selectMapWidth,
  selectMovingUnitPendingPosition,
  selectMovingUnitRelativeWidthBounds,
  selectActionMenuWidth,
  (mapWidth, pendingPosition, unitRelativeWidthBounds, menuWidth) => {
    if (!pendingPosition) return undefined;

    /**
     * We want to draw the action menu such that:
     * - it is on the left of the unit
     * - unless we're too far to the left, in which case we draw it on the right
     * - there is a 1-tile margin between the moving unit and the menu
     *
     * Also, since the menu has width, we need to consider that in the
     * "draw to the left" case.
     */
    let x =
      pendingPosition.x - unitRelativeWidthBounds.leftmost - menuWidth - 1;

    if (x < mapWidth / 2) {
      x = pendingPosition.x + unitRelativeWidthBounds.rightmost + 1 + 1;
    }

    return {
      x,
      y: pendingPosition.y,
    };
  }
);
