import { Action, createSlice, PayloadAction } from "@reduxjs/toolkit";

export enum ActionMenuOptions {
  Attack,
  Wait,
}

export function getActionName(action: ActionMenuOptions) {
  switch (action) {
    case ActionMenuOptions.Attack:
      return "Attack";
    case ActionMenuOptions.Wait:
      return "Wait";
  }
}

export interface State {
  cursorIndex: number;
  actions: ActionMenuOptions[]; // @todo: populate from something
}

export const initialState: State = {
  cursorIndex: 0,
  actions: [ActionMenuOptions.Wait],
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
