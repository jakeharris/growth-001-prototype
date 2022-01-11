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
          x: Math.max(Math.min(state.cursorPosition.x + x, state.width - 1), 0),
          y: Math.max(
            Math.min(state.cursorPosition.y + y, state.height - 1),
            0
          ),
        },
      };
    },
  },
});

export const { actions, reducer } = slice;

export const selectCursorPosition = (state: State) => state.cursorPosition;
export const { selectIds, selectEntities, selectAll } = adapter.getSelectors();
