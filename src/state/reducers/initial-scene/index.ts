import { createSelector } from "@reduxjs/toolkit";
import * as MapState from "./map.state";
import * as UnitsState from "./units.state";
import * as ControlState from "./control.state";
import { getTileId } from "../../../models";

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
export const selectHoveredUnit = createSelector(
  selectUnits,
  selectCursorPosition,
  (units, cursorPosition) =>
    units.find(
      (unit) => unit.x === cursorPosition.x && unit.y === cursorPosition.y
    )
);
export const selectIsHoveringUnit = createSelector(
  selectHoveredUnit,
  (hoveredUnit) => hoveredUnit !== undefined
);
export const selectSelectedUnit = createSelector(
  selectControlState,
  ControlState.selectSelectedUnit
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
  (units, destinationTile, selectedUnit) => {
    if (selectedUnit === null) return false;
    if (destinationTile === undefined) return false;

    const isDestinationTileWithinRange = selectedUnit.destinationTiles.some(
      (destinationTileId) => destinationTileId === destinationTile.id
    );

    if (!isDestinationTileWithinRange) return false;
    if (!destinationTile.traversable) return false;

    return units.every((unit) => {
      if (unit === selectedUnit) return true;

      return unit.x !== destinationTile.x || unit.y !== destinationTile.y;
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
export const selectPreviousUnitPosition = createSelector(
  selectMovingUnit,
  (movingUnit) => (movingUnit ? { x: movingUnit.x, y: movingUnit.y } : null)
);
