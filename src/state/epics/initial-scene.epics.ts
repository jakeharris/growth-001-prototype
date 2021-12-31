import { Action } from "@reduxjs/toolkit";
import { ofType } from "redux-observable";
import { tap, Observable } from "rxjs";
import { ignoreElements } from "rxjs/operators";

const addPreloadText = (action$: Observable<Action>) =>
  action$.pipe(
    ofType("initialScene/update"),
    tap(() => console.log("InitialScene.preoad")),
    ignoreElements()
  );

const epics = [addPreloadText];

export default epics;
