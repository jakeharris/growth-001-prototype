import {
  createEntityAdapter,
  createSlice,
  EntityState,
} from "@reduxjs/toolkit";
import { Cursor, Tile } from "../../models";

export interface State extends EntityState<Tile> {
  cursorPosition: Cursor;
}

const adapter = createEntityAdapter({
  selectId: (tile: Tile) => tile.name,
});

const initialState: State = {
  ...adapter.getInitialState(),
  cursorPosition: { x: 0, y: 0 },
};

export const slice = createSlice({
  name: "initialScene",
  initialState,
  reducers: {
    preload: (state) => initialState,
    update: (state) => ({
      ...state,
      verticalOffset: state.verticalOffset + 20,
    }),
    createMap: adapter.setAll,
  },
});

export const { actions, reducer } = slice;

export const selectCursorPosition = (state: State) => state.cursorPosition;
export const { selectIds, selectEntities, selectAll } = adapter.getSelectors();
