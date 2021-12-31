import { combineEpics } from "redux-observable";
import initialSceneEpics from "./initial-scene.epics";

export const rootEpic = combineEpics(...initialSceneEpics);
