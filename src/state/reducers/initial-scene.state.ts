import { createSlice } from "@reduxjs/toolkit";

interface State {
  verticalOffset: number;
}
const initialState: State = {
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
  },
});

export const { actions, reducer } = slice;

export const selectVerticalOffset = (state: State) => state.verticalOffset;
