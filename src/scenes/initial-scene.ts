import { Store } from "@reduxjs/toolkit";
import { actions } from "../state/reducers/initial-scene.state";

export class InitialScene extends Phaser.Scene {
  timer = 0;

  constructor(private store: Store) {
    super({
      key: "initialScene",
    });
  }

  preload() {
    this.store.dispatch(actions.preload());
  }

  update(time: number, delta: number): void {
    this.store.dispatch(actions.update());

    this.timer += delta;

    if (this.timer > 1000) {
      this.timer = 0;
      this.store.dispatch(actions.preload());
    }
  }

  create(): void {
    console.log("InitialScene.create");
  }
}
