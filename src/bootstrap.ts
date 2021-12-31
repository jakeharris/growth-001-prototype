import { InitialScene } from "./scenes";
import { store } from "./state/store";

const scene = new InitialScene(store);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: [scene],
};

const game = new Phaser.Game(config);
