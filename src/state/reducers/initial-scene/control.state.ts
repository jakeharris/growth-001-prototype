import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Positioned, Unit } from "../../../models";
import { clamp } from "../../../util";

export interface State {
  width: number; // in tiles
  height: number; // in tiles

  cursorPosition: Positioned;
  selectedUnit: Unit | null;
  movingUnitId: string | null;
}

export const initialState: State = {
  width: 0,
  height: 0,
  cursorPosition: { x: 0, y: 0 },
  selectedUnit: null,
  movingUnitId: null,
};

export const slice = createSlice({
  name: "Control",
  initialState,
  reducers: {
    preload: (_, action: PayloadAction<{ width: number; height: number }>) => ({
      ...initialState,
      width: action.payload.width,
      height: action.payload.height,
    }),
    selectUnit: (state, action: PayloadAction<Unit>) => {
      state.selectedUnit = action.payload;
    },
    moveCursor: (state, action) => {
      const { x, y } = action.payload;
      return {
        ...state,
        cursorPosition: {
          x: clamp(0, state.cursorPosition.x + x, state.width - 1),
          y: clamp(0, state.cursorPosition.y + y, state.height - 1),
        },
      };
    },
    moveUnit: (
      state,
      action: PayloadAction<{ unitId: string; x: number; y: number }>
    ) => ({
      ...state,
      selectedUnit: null,
      movingUnitId: action.payload.unitId,
    }),
    confirmMoveUnit: (state, action: PayloadAction<{ unitId: string }>) => ({
      ...state,
      movingUnitId: null,
    }),
  },
});

export const { actions, reducer } = slice;

export const selectCursorPosition = (state: State) => state.cursorPosition;
export const selectSelectedUnit = (state: State) => state.selectedUnit;
export const selectIsSelectingUnit = (state: State) =>
  state.selectedUnit !== null;
export const selectIsMoving = (state: State) => state.movingUnitId !== null;
export const selectMovingUnitId = (state: State) => state.movingUnitId;
