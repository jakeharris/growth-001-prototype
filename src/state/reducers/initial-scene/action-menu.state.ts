import { Action, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ActionMenuOptions } from "../../../models/action-menu-options";

export interface State {
  cursorIndex: number;
  actions: ActionMenuOptions[]; // @todo: populate from something
}

export const initialState: State = {
  cursorIndex: 0,
  actions: [ActionMenuOptions.Wait],
};

const slice = createSlice({
  name: "Action Menu",
  initialState,
  reducers: {
    preload: () => initialState,
    moveCursorDown: (state, action: Action) => ({
      ...state,
      cursorIndex: (state.cursorIndex + 1) % state.actions.length,
    }),
    moveCursorUp: (state, action: Action) => ({
      ...state,
      cursorIndex:
        (state.cursorIndex > 0
          ? state.cursorIndex - 1
          : state.actions.length - 1) % state.actions.length,
    }),
    selectOption: (state, action: PayloadAction<ActionMenuOptions>) => state,
  },
});

export const { actions: ActionMenuActions, reducer } = slice;
export const selectCursorIndex = (state: State) => state.cursorIndex;
export const selectActions = (state: State) => state.actions;
