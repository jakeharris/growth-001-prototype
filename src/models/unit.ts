import { Dictionary } from "@reduxjs/toolkit";
import { addPositions, Position } from ".";
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
  attackRangeMin: number;
  attackRangeMax: number;

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
  const randomAttackRangeMinimum = Math.ceil(Math.random() * 3);
  const randomAttackRangeMaximum =
    randomAttackRangeMinimum + Math.round(Math.random());
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

    attackRangeMin: randomAttackRangeMinimum,
    attackRangeMax: randomAttackRangeMaximum,

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
  while (!mapTiles[getTileId({ x, y })]?.traversable) {
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
    bodyPositions: [{ x: 0, y: 0 }],
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
      bodyPositions: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
    })
  );
  for (let i = 0; i < unitCount - 1; i++) {
    units.push(createRandomBasicUnit(mapWidth, mapHeight, mapTiles));
  }
  return units;
}

type RangeTile = {
  id: string;
  isMovementTile: boolean;
};

/**
 * @param mapTiles The tiles of the map
 * @param mapWidth The width of the map, in tiles
 * @param mapHeight The height of the map, in tiles
 * @param unit The unit to get the destination tiles for
 * @returns an array of the ids of all tiles that are within the unit's range
 */
export function getUnitRangeTileIds(
  unit: Unit,
  mapWidth: number,
  mapHeight: number,
  mapTiles: Dictionary<Tile>
): RangeTile[] {
  /**
   * @todo, probably -- optimize this
   * @todo Add check for whether any bodyPosition would collide with another unit
   */

  /**
   * pseudocode:
   * 1. determine all possible movement deltas for the unit
   *    1a. note: consider movement range as well as every bodyPosition
   * 2. for each movement delta:
   *    2a. check traversability of each tile under the unit in this new configuration
   *    2b. check that no bodyPosition would be out of bounds
   * 3. for each valid delta, get the id of the map tile at that position
   * 4. then, for that id, get all attackable squares
   * 5. de-dupe the resulting array
   * 6. enrich the resulting array as follows:
   *    6a. if an tile-id is a valid destination tile, mark it as a movement tile
   *    6b. otherwise, mark it as an attack tile
   * 6. return those enriched map tile ids
   */

  const movementDeltas = getMovementDeltasForUnit(unit);
  const attackDeltas = getAttackDeltasForUnit(unit);
  const validMoves = movementDeltas.filter((delta) =>
    isValid(unit, delta, mapWidth, mapHeight, mapTiles)
  );
  const destinationPositions = validMoves.map((move) =>
    addPositions(unit.position, move)
  );
  const destinationTileIds = destinationPositions.map((destinationPosition) =>
    getTileId(destinationPosition)
  );
  const attackablePositions = destinationPositions.flatMap(
    (destinationPosition) => applyDeltas(destinationPosition, attackDeltas)
  );
  const attackableTileIds = attackablePositions.map((position) =>
    getTileId(position)
  );
  const allTileIds = [...destinationTileIds, ...attackableTileIds];

  const dedupedDestinationTileIds = [...new Set(allTileIds)];

  const displayRangeTileIds = dedupedDestinationTileIds.map((id) => ({
    id,
    isMovementTile: destinationTileIds.includes(id),
  }));

  return displayRangeTileIds;
}

/**
 * Helper function that generates all possible movement deltas for a given range.
 * These are relative -- which means they'll be the same for each bodyPosition in the unit.
 * Does not consider bounds or traversability -- just distance.
 * @param range The maximum number of tiles away the unit can move
 * @returns Relative movement deltas that can be applied to each bodyPosition to determine absolute movement positions
 */
function getMovementDeltasForRange(range: number): Position[] {
  let movementDeltas: Position[] = [];

  for (let x = -range; x <= range; x++) {
    for (let y = -range; y <= range; y++) {
      const isWithinStraightLineRange = Math.abs(x) + Math.abs(y) <= range;

      if (!isWithinStraightLineRange) continue;

      movementDeltas.push({ x, y });
    }
  }

  return movementDeltas;
}

/**
 * Helper function that generates all possible movement deltas for a given unit.
 * Does not consider bounds or traversability -- just distance
 * @param unit The unit under consideration for movement
 * @returns Movement deltas that can be applied
 */
function getMovementDeltasForUnit(unit: Unit): Position[] {
  /**
   * @todo Rename away from "relative," that's not really what's happening here.
   */
  const relativeMovementDeltas = getMovementDeltasForRange(unit.range);
  const allMovementDeltas = unit.bodyPositions.flatMap((position) =>
    applyDeltas(position, relativeMovementDeltas)
  );
  /**
   * @todo De-dupe movement deltas?
   */
  // const dedupedMovementDeltas = dedupePositions(allMovementDeltas);

  return allMovementDeltas;
}

function getAttackDeltasForRange(min: number, max: number) {
  let attackDeltas: Position[] = [];

  for (let x = -max; x <= max; x++) {
    for (let y = -max; y <= max; y++) {
      const straightLineDistance = Math.abs(x) + Math.abs(y);
      const isWithinStraightLineRange =
        straightLineDistance >= min && straightLineDistance <= max;

      if (!isWithinStraightLineRange) continue;

      attackDeltas.push({ x, y });
    }
  }

  return attackDeltas;
}

function getAttackDeltasForUnit(unit: Unit): Position[] {
  const relativeAttackDeltas = getAttackDeltasForRange(
    unit.attackRangeMin,
    unit.attackRangeMax
  );
  const allAttackDeltas = unit.bodyPositions.flatMap((position) =>
    applyDeltas(position, relativeAttackDeltas)
  );

  return allAttackDeltas;
}

function applyDeltas(position: Position, deltas: Position[]): Position[] {
  return deltas.map((delta) => addPositions(position, delta));
}

function isValid(
  unit: Unit,
  delta: Position,
  mapWidth: number,
  mapHeight: number,
  mapTiles: Dictionary<Tile>
) {
  return getAbsoluteBodyPositions(unit).every((bodyPosition) => {
    const prospectiveBodyPosition = addPositions(bodyPosition, delta);
    return (
      isWithinBounds(prospectiveBodyPosition, mapWidth, mapHeight) &&
      isTraversible(prospectiveBodyPosition, mapTiles)
    );
  });
}

function isWithinBounds(
  position: Position,
  mapWidth: number,
  mapHeight: number
): boolean {
  return (
    position.x >= 0 &&
    position.x < mapWidth &&
    position.y >= 0 &&
    position.y < mapHeight
  );
}

function isTraversible(
  position: Position,
  mapTiles: Dictionary<Tile>
): boolean {
  const tileId = getTileId(position);
  const tile = mapTiles[tileId];

  return !!tile && tile.traversable;
}

/**
 *
 * @param unit The unit to get absolute body positions for
 * @returns A list of absolute grid positions that describes the tiles that the unit occupies
 */
export function getAbsoluteBodyPositions(unit: Unit): Position[] {
  return unit.bodyPositions.map((bodyPosition) =>
    addPositions(unit.position, bodyPosition)
  );
}

/**
 *
 * @param unit The unit to get absolute body positions for
 * @param movementDelta The movement delta to apply to the unit's position
 * @returns A list of absolute grid positions that describes the tiles that the unit will occupy if it moves
 */
export function getDestinationPositions(
  unit: Unit,
  movementDelta: Position
): Position[] {
  return unit.bodyPositions.map((bodyPosition) =>
    addPositions(addPositions(unit.position, bodyPosition), movementDelta)
  );
}
