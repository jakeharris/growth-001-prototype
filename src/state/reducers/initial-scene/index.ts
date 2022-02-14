import { createSelector } from "@reduxjs/toolkit";
import * as MapState from "./map.state";
import * as UnitsState from "./units.state";
import * as ControlState from "./control.state";
import {
  getAbsoluteBodyPositions,
  getDestinationPositions,
  getMovementRangeTileIds,
  getTileId,
  haveSamePosition,
} from "../../../models";

export type State = {
  map: MapState.State;
  units: UnitsState.State;
  control: ControlState.State;
};

export const reducers = {
  map: MapState.reducer,
  units: UnitsState.reducer,
  control: ControlState.reducer,
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
    unit ? getMovementRangeTileIds(unit, width, height, mapTiles) : []
);
export const selectIsHoveringUnit = createSelector(
  selectHoveredUnit,
  (hoveredUnit) => hoveredUnit !== undefined
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
    unit ? getMovementRangeTileIds(unit, width, height, mapTiles) : []
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

    return {
      x: cursorPosition.x - sourcePosition.x,
      y: cursorPosition.y - sourcePosition.y,
    };
  }
);

export const selectIsCursorOnValidDestinationTile = createSelector(
  selectUnits,
  selectMovementDelta,
  selectSelectedUnit,
  selectMapTilesEntities,
  (units, movementDelta, selectedUnit, mapTiles) => {
    if (!selectedUnit) return false;
    /**
     * @todo Remove the 0,0 condition. A player should be able
     * to wait, attack, etc. without moving.
     */
    if (movementDelta.x === 0 && movementDelta.y === 0) return false;

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
export const selectMovingUnitMovementTileIds = createSelector(
  selectMovingUnit,
  selectMapWidth,
  selectMapHeight,
  selectMapTilesEntities,
  (unit, width, height, mapTiles) =>
    unit ? getMovementRangeTileIds(unit, width, height, mapTiles) : []
);
export const selectPreviousUnitPosition = createSelector(
  selectMovingUnit,
  (movingUnit) => (movingUnit ? movingUnit.position : null)
);
