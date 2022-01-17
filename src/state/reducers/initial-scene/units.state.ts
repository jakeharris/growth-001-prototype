import {
  createEntityAdapter,
  createSlice,
  EntityState,
} from "@reduxjs/toolkit";
import { Unit } from "../../../models";
import { actions as ControlActions } from "./control.state";

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
  extraReducers: (builder) => {
    builder.addCase(ControlActions.moveUnit, (state, action) => {
      const { unitId, x, y } = action.payload;

      return adapter.updateOne(state, {
        id: unitId,
        changes: { pendingPosition: { x, y } },
      });
    });

    builder.addCase(ControlActions.confirmMoveUnit, (state, action) => {
      const { unitId } = action.payload;
      const unit = selectEntities(state)[unitId];

      if (!unit || !unit.pendingPosition) return state;

      return adapter.updateOne(state, {
        id: unitId,
        changes: {
          x: unit.pendingPosition.x,
          y: unit.pendingPosition.y,
          pendingPosition: null,
        },
      });
    });
  },
});

export const { actions, reducer } = slice;
export const { selectEntities, selectAll } = adapter.getSelectors();
