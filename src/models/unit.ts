import { Dictionary } from "@reduxjs/toolkit";
import { Position } from ".";
import { Tile, getTileId } from "./tile";

export interface Unit {
  id: string;

  name: string;
  /**
   * The position of the unit, in grid units. This represents the top-leftmost
   * corner of the smallest rectangle that contains the unit.
   */
  position: Position;
  /**
   * The positions of the tiles that this unit occupies,
   * relative to the position of the unit, in grid units.
   */
  bodyPositions: Position[];

  team: Team;

  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  range: number;

  hasMoved: boolean;

  pendingPosition: Position | null; // the position that this unit is moving to
}

export enum Team {
  Player = "Player",
  Enemy = "Enemy",
  Ally = "Ally",
  Other = "Other",
}

export enum Colors {
  Player = 0x0000ff,
  Enemy = 0xff0000,
  Ally = 0x00ff00,
  Other = 0xffff00,
  TurnTaken = 0x777777,
}

export function getTeamColor(team: Team) {
  switch (team) {
    case Team.Player:
      return Colors.Player;
    case Team.Enemy:
      return Colors.Enemy;
    case Team.Ally:
      return Colors.Ally;
    case Team.Other:
      return Colors.Other;
  }
}

export function createUnit(updates?: Partial<Unit>): Unit {
  return {
    id: Math.random() * 1e16 + "",
    name: "Absolute Unit",
    position: { x: 0, y: 0 },
    bodyPositions: [{ x: 0, y: 0 }],
    team: Team.Player,

    hp: 10,
    maxHp: 10,
    attack: 1,
    defense: 1,
    speed: 1,
    range: 4,

    hasMoved: false,

    pendingPosition: null,

    ...updates,
  };
}

export function createRandomBasicUnit(
  mapWidth: number,
  mapHeight: number,
  mapTiles: Dictionary<Tile>,
  updates?: Partial<Unit>
): Unit {
  let x = Math.floor(Math.random() * mapWidth);
  let y = Math.floor(Math.random() * mapHeight);
  // prevent spawning on a tile that is not traversable
  while (!mapTiles[getTileId(x, y)]?.traversable) {
    x = Math.floor(Math.random() * mapWidth);
    y = Math.floor(Math.random() * mapHeight);
  }

  const teamRand = Math.floor(Math.random() * 4);
  const team =
    teamRand === 0
      ? Team.Player
      : teamRand === 1
      ? Team.Enemy
      : teamRand === 2
      ? Team.Ally
      : Team.Other;

  const unit = createUnit({
    position: { x, y },
    bodyPositions: [{ x, y }],
    team,
    ...updates,
  });

  return unit;
}

export function createRandomBasicUnits(
  unitCount: number,
  mapWidth: number,
  mapHeight: number,
  mapTiles: Dictionary<Tile>
) {
  const units = [];
  for (let i = 0; i < unitCount; i++) {
    units.push(createRandomBasicUnit(mapWidth, mapHeight, mapTiles));
  }
  return units;
}

export function createRandomInitialUnits(
  unitCount: number,
  mapWidth: number,
  mapHeight: number,
  mapTiles: Dictionary<Tile>
) {
  const units = [];
  units.push(
    createRandomBasicUnit(mapWidth, mapHeight, mapTiles, {
      team: Team.Player,
    })
  );
  for (let i = 0; i < unitCount - 1; i++) {
    units.push(createRandomBasicUnit(mapWidth, mapHeight, mapTiles));
  }
  return units;
}

/**
 * @param mapTiles The tiles of the map
 * @param mapWidth The width of the map, in tiles
 * @param mapHeight The height of the map, in tiles
 * @param unit The unit to get the destination tiles for
 * @returns an array of the ids of all tiles that are within the unit's range
 */
export function getDestinationTileIds(
  unit: Unit,
  mapWidth: number,
  mapHeight: number,
  mapTiles: Dictionary<Tile>
): string[] {
  const destinationTiles: string[] = [];
  for (
    let x = unit.position.x - unit.range;
    x <= unit.position.x + unit.range;
    x++
  ) {
    for (
      let y = unit.position.y - unit.range;
      y <= unit.position.y + unit.range;
      y++
    ) {
      const tile = mapTiles[getTileId(x, y)];
      const isWithinBounds = x >= 0 && x < mapWidth && y >= 0 && y < mapHeight;
      const isWithinStraightLineRange =
        Math.abs(x - unit.position.x) + Math.abs(y - unit.position.y) <=
        unit.range;

      if (isWithinBounds && isWithinStraightLineRange && tile?.traversable) {
        destinationTiles.push(tile.id);
      }
    }
  }
  return destinationTiles;
}

/**
 *
 * @param unit The unit to get absolute body positions for
 * @returns A list of absolute grid positions, that describes the tiles that the unit occupies
 */
export function getAbsoluteBodyPositions(unit: Unit): Position[] {
  const positions = [];
  for (const bodyPosition of unit.bodyPositions) {
    positions.push({
      x: unit.position.x + bodyPosition.x,
      y: unit.position.y + bodyPosition.y,
    });
  }
  return positions;
}
