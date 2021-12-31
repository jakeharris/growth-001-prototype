export interface Positioned {
  x: number;
  y: number;
}

export function haveSamePosition(a: Positioned, b: Positioned) {
  return a.x === b.x && a.y === b.y;
}
