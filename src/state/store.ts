import { configureStore } from "@reduxjs/toolkit";
import { createEpicMiddleware } from "redux-observable";
import { rootEpic } from "./epics";
import { reducers } from "./reducers/initial-scene";

const epicMiddleware = createEpicMiddleware();

export const store = configureStore({
  reducer: reducers,
  middleware: (getDefaultMiddleware) => [
    ...getDefaultMiddleware({ thunk: false }),
    epicMiddleware,
  ],
});

epicMiddleware.run(rootEpic);
