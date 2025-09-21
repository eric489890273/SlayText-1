import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, createInitialGameState, shuffleArray, getEnemyActionForLevel, createEnemyForLevel, ENEMY_TYPES, DEFAULT_CARDS, CARD_REWARDS } from "./storage";
import { PlayCardRequest, EndTurnRequest, SelectCardRequest, NextLevelRequest, type GameState, type Card } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create new game
  app.post("/api/game/new", async (req, res) => {
    try {
      const gameState = createInitialGameState();
      const session = await storage.createGameSession(gameState);
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to create new game" });
    }
  });

  // Get game state
  app.get("/api/game/:id", async (req, res) => {
    try {
      const session = await storage.getGameSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to get game state" });
    }
  });

  // Play a card
  app.post("/api/game/play-card", async (req, res) => {
    try {
      const { gameId, cardId } = PlayCardRequest.parse(req.body);
      
      const session = await storage.getGameSession(gameId);
      if (!session) {
        return res.status(404).json({ message: "Game not found" });
      }

      const gameState = session.gameState as GameState;
      
      if (gameState.phase !== "COMBAT") {
        return res.status(400).json({ message: "Cannot play cards outside of combat" });
      }

      const cardIndex = gameState.hand.findIndex(card => card.id === cardId);
      if (cardIndex === -1) {
        return res.status(400).json({ message: "Card not in hand" });
      }

      const card = gameState.hand[cardIndex];
      
      if (gameState.player.energy < card.cost) {
        return res.status(400).json({ message: "Not enough energy" });
      }

      // Remove card from hand and add to discard pile
      const playedCard = gameState.hand.splice(cardIndex, 1)[0];
      gameState.discardPile.push(playedCard);
      gameState.player.energy -= card.cost;

      // Apply card effects
      const logs: string[] = [];
      logs.push(`You played ${card.name}`);

      if (card.damage) {
        const damage = Math.max(0, card.damage - gameState.enemy.armor);
        gameState.enemy.health -= damage;
        gameState.enemy.armor = Math.max(0, gameState.enemy.armor - card.damage);
        logs.push(`${gameState.enemy.name} takes ${damage} damage`);
      }

      if (card.armor) {
        gameState.player.armor += card.armor;
        logs.push(`Player gains ${card.armor} armor`);
      }

      if (card.effects) {
        for (const effect of card.effects) {
          if (effect === "strength_2") {
            const existing = gameState.player.statusEffects.find(e => e.name === "Strength");
            if (existing) {
              existing.value += 2;
              existing.duration = 1; // End of turn
            } else {
              gameState.player.statusEffects.push({ name: "Strength", value: 2, duration: 1 });
            }
            logs.push("Player gains 2 Strength (until end of turn)");
          }
          
          if (effect === "vulnerable_2") {
            const existing = gameState.enemy.statusEffects.find(e => e.name === "Vulnerable");
            if (existing) {
              existing.value += 2;
              existing.duration = 3;
            } else {
              gameState.enemy.statusEffects.push({ name: "Vulnerable", value: 2, duration: 3 });
            }
            logs.push(`${gameState.enemy.name} gains 2 Vulnerable`);
          }
        }
      }

      gameState.logs.push(...logs);

      // Check if enemy is defeated
      if (gameState.enemy.health <= 0) {
        if (gameState.currentLevel >= gameState.maxLevel) {
          gameState.phase = "VICTORY";
          gameState.logs.push("🎉 All levels completed! You have mastered the spire!");
        } else {
          gameState.phase = "LEVEL_COMPLETE";
          gameState.levelComplete = true;
          gameState.logs.push(`Level ${gameState.currentLevel} complete! Choose a card to add to your deck.`);
        }
        gameState.availableCards = shuffleArray([...CARD_REWARDS]).slice(0, 3);
      }

      const updatedSession = await storage.updateGameSession(gameId, gameState);
      res.json(updatedSession);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data" });
      }
      res.status(500).json({ message: "Failed to play card" });
    }
  });

  // End turn
  app.post("/api/game/end-turn", async (req, res) => {
    try {
      const { gameId } = EndTurnRequest.parse(req.body);
      
      const session = await storage.getGameSession(gameId);
      if (!session) {
        return res.status(404).json({ message: "Game not found" });
      }

      const gameState = session.gameState as GameState;
      
      if (gameState.phase !== "COMBAT") {
        return res.status(400).json({ message: "Cannot end turn outside of combat" });
      }

      const logs: string[] = [];

      // Clear temporary status effects
      gameState.player.statusEffects = gameState.player.statusEffects.filter(effect => {
        if (effect.duration !== undefined) {
          effect.duration -= 1;
          if (effect.duration <= 0) {
            logs.push(`Player loses ${effect.name}`);
            return false;
          }
        }
        return true;
      });

      // Enemy turn
      if (gameState.enemy.health > 0) {
        const action = gameState.enemy.nextAction;
        
        // Get current enemy action details
        const currentAction = getEnemyActionForLevel(gameState.currentLevel);
        const actionData = ENEMY_TYPES[Math.min(gameState.currentLevel - 1, ENEMY_TYPES.length - 1)]
          .actions.find(a => a.action === action);
        
        switch (action) {
          case "ATTACK":
            const attackDamage = actionData?.damage || 12;
            const damage = Math.max(0, attackDamage - gameState.player.armor);
            gameState.player.health -= damage;
            gameState.player.armor = Math.max(0, gameState.player.armor - attackDamage);
            logs.push(`${gameState.enemy.name} attacks for ${damage} damage`);
            break;
            
          case "DEFEND":
            const armorGain = actionData?.armor || 8;
            gameState.enemy.armor += armorGain;
            logs.push(`${gameState.enemy.name} gains ${armorGain} armor`);
            break;
            
          case "CHARGE":
            logs.push(`${gameState.enemy.name} is charging up...`);
            break;
            
          case "SPECIAL":
            logs.push(`${gameState.enemy.name} uses a special ability!`);
            // 特殊能力的具体效果可以根据敌人类型定制
            break;
        }

        // Update enemy status effects
        gameState.enemy.statusEffects = gameState.enemy.statusEffects.filter(effect => {
          if (effect.duration !== undefined) {
            effect.duration -= 1;
            if (effect.duration <= 0) {
              logs.push(`${gameState.enemy.name} loses ${effect.name}`);
              return false;
            }
          }
          return true;
        });

        // Set next enemy action
        const nextAction = getEnemyActionForLevel(gameState.currentLevel);
        gameState.enemy.nextAction = nextAction.action as any;
        gameState.enemy.nextActionDescription = nextAction.description;
      }

      // Check if player is defeated
      if (gameState.player.health <= 0) {
        gameState.phase = "DEFEAT";
        logs.push("Defeat! The enemy has bested you.");
      } else {
        // Draw new hand for next turn
        gameState.hand.push(...gameState.discardPile);
        gameState.discardPile = [];
        
        // If deck is empty, shuffle discard pile into deck
        if (gameState.deck.length < 5) {
          gameState.deck.push(...gameState.hand);
          gameState.hand = [];
          gameState.deck = shuffleArray(gameState.deck);
        }
        
        // Draw 5 cards
        const cardsToDraw = Math.min(5, gameState.deck.length);
        gameState.hand = gameState.deck.splice(0, cardsToDraw);
        
        // Reset energy
        gameState.player.energy = gameState.player.maxEnergy;
        gameState.turn += 1;
        
        logs.push(`Turn ${gameState.turn} begins!`);
      }

      gameState.logs.push(...logs);

      const updatedSession = await storage.updateGameSession(gameId, gameState);
      res.json(updatedSession);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data" });
      }
      res.status(500).json({ message: "Failed to end turn" });
    }
  });

  // Select card reward
  app.post("/api/game/select-card", async (req, res) => {
    try {
      const { gameId, cardId } = SelectCardRequest.parse(req.body);
      
      const session = await storage.getGameSession(gameId);
      if (!session) {
        return res.status(404).json({ message: "Game not found" });
      }

      const gameState = session.gameState as GameState;
      
      if (gameState.phase !== "VICTORY") {
        return res.status(400).json({ message: "Cannot select cards outside of victory phase" });
      }

      if (!gameState.availableCards) {
        return res.status(400).json({ message: "No cards available for selection" });
      }

      const selectedCard = gameState.availableCards.find(card => card.id === cardId);
      if (!selectedCard) {
        return res.status(400).json({ message: "Selected card not available" });
      }

      // Add card to deck
      gameState.deck.push(selectedCard);
      gameState.logs.push(`Added ${selectedCard.name} to your deck!`);
      
      // Clear available cards
      gameState.availableCards = undefined;
      
      // Check if this was the final level
      if (gameState.phase === "VICTORY") {
        gameState.logs.push("🎉 Game complete! You have mastered the spire! Refresh to play again.");
      } else {
        // Move to next level
        gameState.phase = "COMBAT";
        gameState.levelComplete = false;
      }

      const updatedSession = await storage.updateGameSession(gameId, gameState);
      res.json(updatedSession);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data" });
      }
      res.status(500).json({ message: "Failed to select card" });
    }
  });

  // Next level
  app.post("/api/game/next-level", async (req, res) => {
    try {
      const { gameId } = NextLevelRequest.parse(req.body);
      
      const session = await storage.getGameSession(gameId);
      if (!session) {
        return res.status(404).json({ message: "Game not found" });
      }

      const gameState = session.gameState as GameState;
      
      if (gameState.phase !== "LEVEL_COMPLETE") {
        return res.status(400).json({ message: "Cannot advance level outside of level complete phase" });
      }

      // Advance to next level
      gameState.currentLevel += 1;
      
      // Create new enemy for the next level
      const newEnemy = createEnemyForLevel(gameState.currentLevel);
      gameState.enemy = newEnemy;
      
      // Reset player state for next level (optional healing)
      gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + 10); // Small heal
      gameState.player.energy = gameState.player.maxEnergy;
      gameState.player.armor = 0; // Reset armor
      
      // Draw new hand
      if (gameState.deck.length < 5) {
        gameState.deck.push(...gameState.discardPile);
        gameState.discardPile = [];
        gameState.deck = shuffleArray(gameState.deck);
      }
      
      const cardsToDraw = Math.min(5, gameState.deck.length);
      gameState.hand = gameState.deck.splice(0, cardsToDraw);
      
      // Reset turn and phase
      gameState.turn = 1;
      gameState.phase = "COMBAT";
      gameState.levelComplete = false;
      
      gameState.logs.push(`Level ${gameState.currentLevel}/3 - Face the ${newEnemy.name}!`);

      const updatedSession = await storage.updateGameSession(gameId, gameState);
      res.json(updatedSession);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data" });
      }
      res.status(500).json({ message: "Failed to advance to next level" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
