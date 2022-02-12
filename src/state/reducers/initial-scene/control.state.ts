import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Position } from "../../../models";
import { clamp } from "../../../util";

export interface State {
  width: number; // in tiles
  height: number; // in tiles

  cursorPosition: Position;
  selectedUnitId: string | null;
  movingUnitId: string | null;
}

export const initialState: State = {
  width: 0,
  height: 0,
  cursorPosition: { x: 0, y: 0 },
  selectedUnitId: null,
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
    selectUnit: (state, action: PayloadAction<string>) => ({
      ...state,
      selectedUnitId: action.payload,
    }),
    cancelSelectUnit: (state) => ({
      ...state,
      selectedUnitId: null,
    }),
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
      selectedUnitId: null,
      movingUnitId: action.payload.unitId,
    }),
    confirmMoveUnit: (state, action: PayloadAction<{ unitId: string }>) => ({
      ...state,
      movingUnitId: null,
    }),
    cancelMoveUnit: (state) => ({
      ...state,
      selectedUnitId: state.movingUnitId,
      movingUnitId: null,
    }),
  },
});

export const { actions, reducer } = slice;

export const selectCursorPosition = (state: State) => state.cursorPosition;
export const selectMapWidth = (state: State) => state.width;
export const selectMapHeight = (state: State) => state.height;
export const selectSelectedUnitId = (state: State) => state.selectedUnitId;
export const selectIsSelectingUnit = (state: State) =>
  state.selectedUnitId !== null;
export const selectIsMoving = (state: State) => state.movingUnitId !== null;
export const selectMovingUnitId = (state: State) => state.movingUnitId;
