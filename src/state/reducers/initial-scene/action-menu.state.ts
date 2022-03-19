import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export enum ActionMenuActions {
  Attack,
  Wait,
}

export function getActionName(action: ActionMenuActions) {
  switch (action) {
    case ActionMenuActions.Attack:
      return "Attack";
    case ActionMenuActions.Wait:
      return "Wait";
  }
}

export interface State {
  cursorIndex: number;
  actions: ActionMenuActions[]; // @todo: populate from something
}

export const initialState: State = {
  cursorIndex: 0,
  actions: [ActionMenuActions.Wait],
};

const slice = createSlice({
  name: "actionMenu",
  initialState,
  reducers: {
    setCursorIndex: (state, action: PayloadAction<number>) => ({
      ...state,
      cursorIndex: action.payload,
    }),
  },
});

export const { actions, reducer } = slice;
export const selectCursorIndex = (state: State) => state.cursorIndex;
export const selectActions = (state: State) => state.actions;
