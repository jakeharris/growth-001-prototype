import {
  createEntityAdapter,
  createSlice,
  EntityState,
} from "@reduxjs/toolkit";
import { Unit } from "../../../models";

export type State = EntityState<Unit>;

const adapter = createEntityAdapter({
  selectId: (unit: Unit) => unit.id,
});

const initialState: State = adapter.getInitialState();

const slice = createSlice({
  name: "initialScene",
  initialState,
  reducers: {
    preload: () => initialState,
    createUnits: (state, action) => {
      const { units } = action.payload;
      return adapter.setAll(state, units);
    },
  },
});

export const { actions, reducer } = slice;
export const { selectEntities, selectAll } = adapter.getSelectors();
