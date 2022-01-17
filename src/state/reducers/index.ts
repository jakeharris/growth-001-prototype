import { createSelector } from "@reduxjs/toolkit";
import * as initialSceneState from "./initial-scene";

export type State = {
  initialScene: initialSceneState.State;
};

export const reducers = {
  initialScene: initialSceneState.reducers,
};

export const selectInitialScene = (state: State) => state.initialScene;

export const selectInitialSceneCursorPosition = createSelector(
  selectInitialScene,
  initialSceneState.selectCursorPosition
);

export const selectInitialSceneTilesEntities = createSelector(
  selectInitialScene,
  initialSceneState.selectMapTilesEntities
);
