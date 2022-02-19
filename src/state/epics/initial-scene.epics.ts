import { Action, PayloadAction } from "@reduxjs/toolkit";
import { ofType, StateObservable } from "redux-observable";
import { tap, Observable } from "rxjs";
import { ignoreElements, withLatestFrom, map, filter } from "rxjs/operators";
import {
  selectSelectedUnit,
  selectSelectedUnitId,
  State,
} from "../reducers/initial-scene";

const addPreloadText$ = (action$: Observable<Action>) =>
  action$.pipe(
    ofType("initialScene/update"),
    tap(() => console.log("InitialScene.preoad")),
    ignoreElements()
  );

const planMove$ = (
  action$: Observable<PayloadAction<{ x: number; y: number }>>,
  state$: StateObservable<State>
) =>
  action$.pipe(
    ofType("Control/moveCursor"),
    withLatestFrom(state$),
    filter(([_, initialScene]) => selectSelectedUnitId(initialScene) !== null),
    map(
      ([action, initialScene]: [
        PayloadAction<{ x: number; y: number }>,
        State
      ]) => {
        const { x, y } = action.payload;
        const unit = selectSelectedUnit(initialScene);

        if (!unit) throw new Error("No unit selected");

        return {
          type: "Control/planMoveUnit",
          payload: {
            unitId: unit.id,
            x,
            y,
          },
        };
      }
    )
  );

const epics = [addPreloadText$, planMove$];

export default epics;
