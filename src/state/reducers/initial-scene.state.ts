import {
  createEntityAdapter,
  createSlice,
  EntityState,
} from "@reduxjs/toolkit";
import { Tile } from "../../models/tile";

interface State extends EntityState<Tile> {
  verticalOffset: number;
}

const adapter = createEntityAdapter({
  selectId: (tile: Tile) => tile.name,
});

const initialState: State = {
  ...adapter.getInitialState(),
  verticalOffset: 20,
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

export const selectVerticalOffset = (state: State) => state.verticalOffset;
