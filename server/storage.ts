import { type GameSession, type InsertGameSession, type GameState, type Card, type Player, type Enemy, type CardType, type EnemyType } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  createGameSession(gameState: GameState): Promise<GameSession>;
  getGameSession(id: string): Promise<GameSession | undefined>;
  updateGameSession(id: string, gameState: GameState): Promise<GameSession>;
  deleteGameSession(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private gameSessions: Map<string, GameSession>;

  constructor() {
    this.gameSessions = new Map();
  }

  async createGameSession(gameState: GameState): Promise<GameSession> {
    const id = randomUUID();
    const session: GameSession = {
      id,
      gameState: gameState as any, // JSON serializable
    };
    this.gameSessions.set(id, session);
    return session;
  }

  async getGameSession(id: string): Promise<GameSession | undefined> {
    return this.gameSessions.get(id);
  }

  async updateGameSession(id: string, gameState: GameState): Promise<GameSession> {
    const session: GameSession = {
      id,
      gameState: gameState as any,
    };
    this.gameSessions.set(id, session);
    return session;
  }

  async deleteGameSession(id: string): Promise<void> {
    this.gameSessions.delete(id);
  }
}

export const storage = new MemStorage();

// Game logic utilities
export const DEFAULT_CARDS: Card[] = [
  {
    id: "strike",
    name: "Strike",
    type: "ATTACK",
    cost: 1,
    description: "Deal 6 damage.",
    damage: 6,
  },
  {
    id: "defend",
    name: "Defend",
    type: "DEFENSE",
    cost: 1,
    description: "Gain 5 Armor.",
    armor: 5,
  },
  {
    id: "heavy_blow",
    name: "Heavy Blow",
    type: "ATTACK",
    cost: 2,
    description: "Deal 14 damage.",
    damage: 14,
  },
  {
    id: "iron_wave",
    name: "Iron Wave",
    type: "DEFENSE",
    cost: 2,
    description: "Gain 5 Armor. Deal 5 damage.",
    armor: 5,
    damage: 5,
  },
  {
    id: "flex",
    name: "Flex",
    type: "SKILL",
    cost: 0,
    description: "Gain 2 Strength. At end of turn, lose 2 Strength.",
    effects: ["strength_2"],
  },
  {
    id: "bash",
    name: "Bash",
    type: "ATTACK",
    cost: 2,
    description: "Deal 8 damage. Apply 2 Vulnerable.",
    damage: 8,
    effects: ["vulnerable_2"],
  },
];

export const ENEMY_TYPES: EnemyType[] = [
  {
    id: "cultist",
    name: "Cultist",
    maxHealth: 48,
    actions: [
      { action: "ATTACK", description: "⚔️ ATTACK - Will deal 12 damage", damage: 12, weight: 3 },
      { action: "DEFEND", description: "🛡️ DEFEND - Will gain 8 armor", armor: 8, weight: 2 },
      { action: "CHARGE", description: "⚡ CHARGE - Building up power...", weight: 1 },
    ],
    asciiArt: `     /\\   /\\
    (  o.o  )
     > ^ <
    /|   |\\
   / |   | \\
  /  |___|  \\
 |   /---\\   |
 |  | ಠ_ಠ |  |
  \\ |_____|  /
   \\|     | /
    |_____|`,
  },
  {
    id: "spider",
    name: "Giant Spider",
    maxHealth: 65,
    actions: [
      { action: "ATTACK", description: "🕷️ BITE - Will deal 8 damage and poison", damage: 8, weight: 3 },
      { action: "SPECIAL", description: "🕸️ WEB - Will reduce your energy next turn", weight: 2 },
      { action: "ATTACK", description: "⚔️ LEAP ATTACK - Will deal 15 damage", damage: 15, weight: 2 },
    ],
    asciiArt: `    /\\   /\\   /\\
   (  o ) ( o  )
    \\  \\_/  /
     ) --- (
    /  ___  \\
   |  /___\\  |
    \\ \\___/ /
     \\     /
      |___|`,
  },
  {
    id: "elite_guard",
    name: "Elite Guard",
    maxHealth: 85,
    actions: [
      { action: "ATTACK", description: "⚔️ SWORD SLASH - Will deal 16 damage", damage: 16, weight: 3 },
      { action: "DEFEND", description: "🛡️ SHIELD UP - Will gain 12 armor", armor: 12, weight: 2 },
      { action: "SPECIAL", description: "💪 POWER UP - Will gain strength", weight: 2 },
      { action: "ATTACK", description: "⚡ HEAVY STRIKE - Will deal 22 damage", damage: 22, weight: 1 },
    ],
    asciiArt: `     [===]
     |[o]|
   ___|||___
  |  |||  |
  |  |||  |
  |  /|\\  |
  | / | \\ |
  |/  |  \\|
     /|\\
    / | \\`,
  },
];

export const CARD_REWARDS: Card[] = [
  {
    id: "cleave",
    name: "Cleave",
    type: "ATTACK",
    cost: 1,
    description: "Deal 8 damage to ALL enemies.",
    damage: 8,
  },
  {
    id: "shrug_it_off",
    name: "Shrug It Off",
    type: "SKILL",
    cost: 1,
    description: "Gain 8 Armor. Draw 1 card.",
    armor: 8,
    effects: ["draw_1"],
  },
  {
    id: "inflame",
    name: "Inflame",
    type: "SKILL",
    cost: 1,
    description: "Gain 2 Strength.",
    effects: ["strength_permanent_2"],
  },
];

export function createEnemyFromType(enemyType: EnemyType): Enemy {
  // 选择一个随机行动
  const randomAction = getRandomEnemyAction(enemyType);
  
  return {
    typeId: enemyType.id,
    name: enemyType.name,
    health: enemyType.maxHealth,
    maxHealth: enemyType.maxHealth,
    armor: 0,
    nextAction: randomAction.action,
    nextActionDescription: randomAction.description,
    statusEffects: [],
  };
}

export function getRandomEnemyAction(enemyType: EnemyType) {
  const totalWeight = enemyType.actions.reduce((sum, action) => sum + action.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const action of enemyType.actions) {
    random -= action.weight;
    if (random <= 0) {
      return action;
    }
  }
  
  return enemyType.actions[0]; // fallback
}

export function createInitialGameState(): GameState {
  const startingDeck = [
    ...Array(5).fill(DEFAULT_CARDS[0]), // 5 Strikes
    ...Array(4).fill(DEFAULT_CARDS[1]), // 4 Defends
    DEFAULT_CARDS[4], // 1 Flex
  ];

  const shuffledDeck = shuffleArray([...startingDeck]);
  const hand = shuffledDeck.splice(0, 5);

  const enemyType = ENEMY_TYPES[0]; // 开始时使用第一个敌人类型
  const enemy = createEnemyFromType(enemyType);

  return {
    id: randomUUID(),
    player: {
      health: 80,
      maxHealth: 80,
      energy: 3,
      maxEnergy: 3,
      armor: 0,
      statusEffects: [],
    },
    enemy,
    hand,
    deck: shuffledDeck,
    discardPile: [],
    phase: "COMBAT",
    turn: 1,
    logs: [`Level 1/3 - Combat begins! Defeat the ${enemy.name} to proceed.`],
    currentLevel: 1,
    maxLevel: 3,
    levelComplete: false,
  };
}

export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function getEnemyActionForLevel(level: number): { action: string; description: string; damage?: number; armor?: number } {
  const enemyTypeIndex = Math.min(level - 1, ENEMY_TYPES.length - 1);
  const enemyType = ENEMY_TYPES[enemyTypeIndex];
  const randomAction = getRandomEnemyAction(enemyType);
  
  return {
    action: randomAction.action,
    description: randomAction.description,
    damage: randomAction.damage,
    armor: randomAction.armor,
  };
}

export function createEnemyForLevel(level: number): Enemy {
  const enemyTypeIndex = Math.min(level - 1, ENEMY_TYPES.length - 1);
  const enemyType = ENEMY_TYPES[enemyTypeIndex];
  return createEnemyFromType(enemyType);
}
