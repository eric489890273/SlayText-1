import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const CardType = z.enum(['ATTACK', 'DEFENSE', 'SKILL']);
export type CardType = z.infer<typeof CardType>;

export const EnemyAction = z.enum(['ATTACK', 'DEFEND', 'CHARGE', 'SPECIAL']);
export type EnemyAction = z.infer<typeof EnemyAction>;

export const GamePhase = z.enum(['COMBAT', 'VICTORY', 'DEFEAT', 'CARD_SELECTION', 'LEVEL_COMPLETE']);
export type GamePhase = z.infer<typeof GamePhase>;

export const Card = z.object({
  id: z.string(),
  name: z.string(),
  type: CardType,
  cost: z.number(),
  description: z.string(),
  damage: z.number().optional(),
  armor: z.number().optional(),
  effects: z.array(z.string()).optional(),
});
export type Card = z.infer<typeof Card>;

export const StatusEffect = z.object({
  name: z.string(),
  value: z.number(),
  duration: z.number().optional(),
});
export type StatusEffect = z.infer<typeof StatusEffect>;

export const Player = z.object({
  health: z.number(),
  maxHealth: z.number(),
  energy: z.number(),
  maxEnergy: z.number(),
  armor: z.number(),
  statusEffects: z.array(StatusEffect),
});
export type Player = z.infer<typeof Player>;

export const EnemyType = z.object({
  id: z.string(),
  name: z.string(),
  maxHealth: z.number(),
  actions: z.array(z.object({
    action: EnemyAction,
    description: z.string(),
    damage: z.number().optional(),
    armor: z.number().optional(),
    weight: z.number(), // 权重，用于随机选择
  })),
  asciiArt: z.string(),
});
export type EnemyType = z.infer<typeof EnemyType>;

export const Enemy = z.object({
  typeId: z.string(),
  name: z.string(),
  health: z.number(),
  maxHealth: z.number(),
  armor: z.number(),
  nextAction: EnemyAction,
  nextActionDescription: z.string(),
  statusEffects: z.array(StatusEffect),
});
export type Enemy = z.infer<typeof Enemy>;

export const GameState = z.object({
  id: z.string(),
  player: Player,
  enemy: Enemy,
  hand: z.array(Card),
  deck: z.array(Card),
  discardPile: z.array(Card),
  phase: GamePhase,
  turn: z.number(),
  logs: z.array(z.string()),
  availableCards: z.array(Card).optional(),
  currentLevel: z.number().default(1),
  maxLevel: z.number().default(3),
  levelComplete: z.boolean().default(false),
});
export type GameState = z.infer<typeof GameState>;

export const PlayCardRequest = z.object({
  gameId: z.string(),
  cardId: z.string(),
});
export type PlayCardRequest = z.infer<typeof PlayCardRequest>;

export const EndTurnRequest = z.object({
  gameId: z.string(),
});
export type EndTurnRequest = z.infer<typeof EndTurnRequest>;

export const SelectCardRequest = z.object({
  gameId: z.string(),
  cardId: z.string(),
});
export type SelectCardRequest = z.infer<typeof SelectCardRequest>;

export const NextLevelRequest = z.object({
  gameId: z.string(),
});
export type NextLevelRequest = z.infer<typeof NextLevelRequest>;

// Game session storage (in-memory)
export const gameSessions = pgTable("game_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameState: jsonb("game_state").notNull(),
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({
  id: true,
});

export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type GameSession = typeof gameSessions.$inferSelect;
