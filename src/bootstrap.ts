import { InitialScene } from "./initial-scene";

const initialScene = new InitialScene({
  key: "initialScene",
});

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: initialScene,
};

const game = new Phaser.Game(config);
