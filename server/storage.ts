import { type GameSession, type InsertGameSession, type GameState, type Card, type Player, type Enemy, type CardType } from "@shared/schema";
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

export function createInitialGameState(): GameState {
  const startingDeck = [
    ...Array(5).fill(DEFAULT_CARDS[0]), // 5 Strikes
    ...Array(4).fill(DEFAULT_CARDS[1]), // 4 Defends
    DEFAULT_CARDS[4], // 1 Flex
  ];

  const shuffledDeck = shuffleArray([...startingDeck]);
  const hand = shuffledDeck.splice(0, 5);

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
    enemy: {
      name: "Cultist",
      health: 48,
      maxHealth: 48,
      armor: 0,
      nextAction: "ATTACK",
      nextActionDescription: "⚔️ ATTACK - Will deal 12 damage",
      statusEffects: [],
    },
    hand,
    deck: shuffledDeck,
    discardPile: [],
    phase: "COMBAT",
    turn: 1,
    logs: ["Combat begins! Defeat the Cultist to proceed."],
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

export function getEnemyAction(): { action: string; description: string } {
  const actions = [
    { action: "ATTACK", description: "⚔️ ATTACK - Will deal 12 damage" },
    { action: "DEFEND", description: "🛡️ DEFEND - Will gain 8 armor" },
    { action: "CHARGE", description: "⚡ CHARGE - Building up power..." },
    { action: "ATTACK", description: "⚔️ HEAVY ATTACK - Will deal 18 damage" },
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}
