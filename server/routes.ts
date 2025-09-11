import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, createInitialGameState, shuffleArray, getEnemyAction, DEFAULT_CARDS, CARD_REWARDS } from "./storage";
import { PlayCardRequest, EndTurnRequest, SelectCardRequest, type GameState, type Card } from "@shared/schema";
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
        gameState.phase = "VICTORY";
        gameState.availableCards = shuffleArray([...CARD_REWARDS]).slice(0, 3);
        gameState.logs.push("Victory! Choose a card to add to your deck.");
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
        
        switch (action) {
          case "ATTACK":
            const damage = Math.max(0, 12 - gameState.player.armor);
            gameState.player.health -= damage;
            gameState.player.armor = Math.max(0, gameState.player.armor - 12);
            logs.push(`${gameState.enemy.name} attacks for ${damage} damage`);
            break;
            
          case "DEFEND":
            gameState.enemy.armor += 8;
            logs.push(`${gameState.enemy.name} gains 8 armor`);
            break;
            
          case "CHARGE":
            logs.push(`${gameState.enemy.name} is charging up...`);
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
        const nextAction = getEnemyAction();
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
      
      // End the game demo
      gameState.logs.push("Demo complete! Refresh to play again.");

      const updatedSession = await storage.updateGameSession(gameId, gameState);
      res.json(updatedSession);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data" });
      }
      res.status(500).json({ message: "Failed to select card" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
