import { InitialScene } from "./scenes";
import { store } from "./state/store";

const initialScene = new InitialScene(store);

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: initialScene,
};

const game = new Phaser.Game(config);
