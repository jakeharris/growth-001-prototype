import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from "./models";
import { InitialScene } from "./scenes";
import { store } from "./state/store";

const scene = new InitialScene(store);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: VIEWPORT_WIDTH,
  height: VIEWPORT_HEIGHT,
  scene: [scene],
};

const game = new Phaser.Game(config);
