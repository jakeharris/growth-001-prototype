import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";
import { Tile } from "../../../models";

export type State = EntityState<Tile>;

const adapter = createEntityAdapter<Tile>();

const initialState: State = adapter.getInitialState();

const slice = createSlice({
  name: "initialScene",
  initialState,
  reducers: {
    preload: () => initialState,
    createMap: (state, action: PayloadAction<{ tiles: Tile[] }>) => {
      const { tiles } = action.payload;

      return adapter.setAll(state, tiles);
    },
  },
});

export const { actions: MapActions, reducer } = slice;

export const { selectIds, selectEntities, selectAll } = adapter.getSelectors();
