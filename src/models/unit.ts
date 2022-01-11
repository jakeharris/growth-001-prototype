export interface Unit {
  id: string;

  name: string;
  x: number;
  y: number;

  team: Team;

  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  range: number;
}

export enum Team {
  Player = "Player",
  Enemy = "Enemy",
  Ally = "Ally",
  Other = "Other",
}

export function getTeamColor(team: Team) {
  switch (team) {
    case Team.Player:
      return 0x0000ff;
    case Team.Enemy:
      return 0xff0000;
    case Team.Ally:
      return 0x00ff00;
    case Team.Other:
      return 0xffff00;
  }
}

export function createUnit(updates?: Partial<Unit>): Unit {
  return {
    id: Math.random() * 1e16 + "",
    name: "Absolute Unit",
    x: 0,
    y: 0,
    team: Team.Player,
    hp: 10,
    maxHp: 10,
    attack: 1,
    defense: 1,
    speed: 1,
    range: 1,
    ...updates,
  };
}

export function createRandomBasicUnit(
  mapWidth: number,
  mapHeight: number,
  updates?: Partial<Unit>
): Unit {
  const x = Math.floor(Math.random() * mapWidth);
  const y = Math.floor(Math.random() * mapHeight);
  const teamRand = Math.floor(Math.random() * 4);

  const team =
    teamRand === 0
      ? Team.Player
      : teamRand === 1
      ? Team.Enemy
      : teamRand === 2
      ? Team.Ally
      : Team.Other;

  return createUnit({
    x,
    y,
    team,
    ...updates,
  });
}

export function createRandomBasicUnits(
  unitCount: number,
  mapWidth: number,
  mapHeightNumber: number
) {
  const units = [];
  for (let i = 0; i < unitCount; i++) {
    units.push(createRandomBasicUnit(mapWidth, mapHeightNumber));
  }
  return units;
}

export function createRandomInitialUnits(
  unitCount: number,
  mapWidth: number,
  mapHeightNumber: number
) {
  const units = [];
  units.push(
    createRandomBasicUnit(mapWidth, mapHeightNumber, { team: Team.Player })
  );
  for (let i = 0; i < unitCount - 1; i++) {
    units.push(createRandomBasicUnit(mapWidth, mapHeightNumber));
  }
  return units;
}
