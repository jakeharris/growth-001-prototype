import { Action, PayloadAction } from "@reduxjs/toolkit";
import { ofType, StateObservable } from "redux-observable";
import { tap, Observable } from "rxjs";
import { ignoreElements, withLatestFrom, map, filter } from "rxjs/operators";
import { addPositions } from "../../models";
import {
  selectMovementDelta,
  selectSelectedUnit,
  selectSelectedUnitId,
  State,
} from "../reducers/initial-scene";
import { ControlActions } from "../reducers";

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
    ofType(ControlActions.moveCursor.type),
    withLatestFrom(state$),
    filter(([_, initialScene]) => selectSelectedUnitId(initialScene) !== null),
    map(
      ([_, initialScene]: [PayloadAction<{ x: number; y: number }>, State]) => {
        const movementDelta = selectMovementDelta(initialScene);
        const unit = selectSelectedUnit(initialScene);

        if (!unit) throw new Error("No unit selected");

        return ControlActions.planMoveUnit({
          unitId: unit.id,
          ...addPositions(unit.position, movementDelta),
        });
      }
    )
  );

const epics = [addPreloadText$, planMove$];

export default epics;
