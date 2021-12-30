export class InitialScene extends Phaser.Scene {
  preload() {
    console.log("InitialScene.preload");
  }
  update(time: number, delta: number): void {
    console.log("InitialScene.update");
  }
  create(): void {
    console.log("InitialScene.create");
  }
}
