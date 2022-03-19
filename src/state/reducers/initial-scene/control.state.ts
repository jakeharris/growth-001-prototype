import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { addPositions, Position } from "../../../models";
import { clamp } from "../../../util";

export interface State {
  width: number; // in tiles
  height: number; // in tiles

  cursorPosition: Position;
  moveSourcePosition: Position | null;
  selectedUnitId: string | null;
  movingUnitId: string | null;
}

export const initialState: State = {
  width: 0,
  height: 0,
  cursorPosition: { x: 0, y: 0 },
  moveSourcePosition: null,
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
      moveSourcePosition: state.cursorPosition,
    }),
    cancelSelectUnit: (state) => ({
      ...state,
      selectedUnitId: null,
      moveSourcePosition: null,
    }),
    moveCursor: (state, action) => {
      const newCursorPosition = addPositions(
        state.cursorPosition,
        action.payload
      );
      return {
        ...state,
        cursorPosition: {
          x: clamp(0, newCursorPosition.x, state.width - 1),
          y: clamp(0, newCursorPosition.y, state.height - 1),
        },
      };
    },
    planMoveUnit: (
      state,
      _: PayloadAction<{ unitId: string; x: number; y: number }>
    ) => state,
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
      moveSourcePosition: null,
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
export const selectMoveSourcePosition = (state: State) =>
  state.moveSourcePosition;
export const selectMapWidth = (state: State) => state.width;
export const selectMapHeight = (state: State) => state.height;
export const selectSelectedUnitId = (state: State) => state.selectedUnitId;
export const selectIsSelectingUnit = (state: State) =>
  state.selectedUnitId !== null;
export const selectIsMoving = (state: State) => state.movingUnitId !== null;
export const selectMovingUnitId = (state: State) => state.movingUnitId;
