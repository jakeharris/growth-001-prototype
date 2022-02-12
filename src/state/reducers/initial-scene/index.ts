import { createSelector } from "@reduxjs/toolkit";
import * as MapState from "./map.state";
import * as UnitsState from "./units.state";
import * as ControlState from "./control.state";
import { getDestinationTileIds, getTileId } from "../../../models";

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
    units.find(
      (unit) =>
        unit.position.x === cursorPosition.x &&
        unit.position.y === cursorPosition.y
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
export const selectDestinationTile = createSelector(
  selectCursorPosition,
  selectMapTilesEntities,
  (cursorPosition, mapTiles) =>
    mapTiles[getTileId(cursorPosition.x, cursorPosition.y)]
);
export const selectIsCursorOnValidDestinationTile = createSelector(
  selectUnits,
  selectDestinationTile,
  selectSelectedUnit,
  selectSelectedUnitMovementTileIds,
  (units, destinationTile, selectedUnit, selectedUnitMovementTileIds) => {
    if (!selectedUnit) return false;
    if (!destinationTile) return false;

    const isDestinationTileWithinRange = selectedUnitMovementTileIds.some(
      (destinationTileId) => destinationTileId === destinationTile.id
    );

    if (!isDestinationTileWithinRange) return false;
    if (!destinationTile.traversable) return false;

    return units.every((unit) => {
      if (unit === selectedUnit) return true;

      return (
        unit.position.x !== destinationTile.x ||
        unit.position.y !== destinationTile.y
      );
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
    unit ? getDestinationTileIds(unit, width, height, mapTiles) : []
);
export const selectPreviousUnitPosition = createSelector(
  selectMovingUnit,
  (movingUnit) => (movingUnit ? movingUnit.position : null)
);
