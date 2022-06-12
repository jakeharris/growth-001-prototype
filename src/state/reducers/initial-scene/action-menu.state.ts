import { Action, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ActionMenuOptions } from "../../../models/action-menu-options";

export interface State {
  cursorIndex: number;
  actionCount: number;
}

export const initialState: State = {
  cursorIndex: 0,
  actionCount: 1,
};

const slice = createSlice({
  name: "Action Menu",
  initialState,
  reducers: {
    preload: () => initialState,
    createActionMenu: (
      state,
      action: PayloadAction<{ actionCount: number }>
    ) => ({
      ...state,
      cursorIndex: 0,
      actionCount: action.payload.actionCount,
    }),
    moveCursorDown: (state, action: Action) => ({
      ...state,
      cursorIndex: (state.cursorIndex + 1) % state.actionCount,
    }),
    moveCursorUp: (state, action: Action) => ({
      ...state,
      cursorIndex:
        (state.cursorIndex > 0
          ? state.cursorIndex - 1
          : state.actionCount - 1) % state.actionCount,
    }),
    selectOption: (state, action: PayloadAction<ActionMenuOptions>) => state,
  },
});

export const { actions: ActionMenuActions, reducer } = slice;
export const selectCursorIndex = (state: State) => state.cursorIndex;
