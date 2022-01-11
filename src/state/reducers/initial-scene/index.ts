import { createSelector } from "@reduxjs/toolkit";
import * as MapState from "./map.state";
import * as UnitsState from "./units.state";

export type State = {
  map: MapState.State;
  units: UnitsState.State;
};

export const reducers = {
  map: MapState.reducer,
  units: UnitsState.reducer,
};

export const selectMapState = (state: State) => state.map;

export const selectMapCursorPosition = createSelector(
  selectMapState,
  MapState.selectCursorPosition
);

export const selectMapTilesEntities = createSelector(
  selectMapState,
  MapState.selectEntities
);

export const selectUnitsState = (state: State) => state.units;

export const selectUnitsEntities = createSelector(
  selectUnitsState,
  UnitsState.selectEntities
);
