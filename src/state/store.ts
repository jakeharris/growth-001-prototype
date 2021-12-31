import { configureStore } from "@reduxjs/toolkit";
import { createEpicMiddleware } from "redux-observable";
import { rootEpic } from "./epics";
import { initialSceneState } from "./reducers";

const epicMiddleware = createEpicMiddleware();

export const store = configureStore({
  reducer: {
    initialScene: initialSceneState.reducer,
  },
  middleware: (getDefaultMiddleware) => [
    ...getDefaultMiddleware({ thunk: false }),
    epicMiddleware,
  ],
});

epicMiddleware.run(rootEpic);
