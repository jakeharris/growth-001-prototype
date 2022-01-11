import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";
import { Positioned, Tile } from "../../models";

export interface State extends EntityState<Tile> {
  cursorPosition: Positioned;
  width: number; // in tiles
  height: number; // in tiles
}

const adapter = createEntityAdapter({
  selectId: (tile: Tile) => tile.name,
});

const initialState: State = {
  ...adapter.getInitialState(),
  width: 0,
  height: 0,
  cursorPosition: { x: 0, y: 0 },
};

export const slice = createSlice({
  name: "initialScene",
  initialState,
  reducers: {
    preload: () => initialState,
    createMap: (
      state,
      action: PayloadAction<{ tiles: Tile[]; width: number; height: number }>
    ) => {
      const { tiles, width, height } = action.payload;

      const newState = {
        ...state,
        width,
        height,
      };

      return adapter.setAll(newState, tiles);
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
  },
});

export const { actions, reducer } = slice;

function clamp(min: number, value: number, max: number) {
  return Math.max(Math.min(value, max), min);
}

export const selectCursorPosition = (state: State) => state.cursorPosition;
export const { selectIds, selectEntities, selectAll } = adapter.getSelectors();
