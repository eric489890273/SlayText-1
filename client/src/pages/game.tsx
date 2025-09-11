import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { GameState, GameSession } from "@shared/schema";
import { GameHeader } from "@/components/game/GameHeader";
import { EnemyArea } from "@/components/game/EnemyArea";
import { PlayerArea } from "@/components/game/PlayerArea";
import { CardHand } from "@/components/game/CardHand";
import { GameLog } from "@/components/game/GameLog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Game() {
  const [gameId, setGameId] = useState<string | null>(null);
  const { toast } = useToast();

  // Create new game mutation
  const newGameMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/game/new");
      return response.json() as Promise<GameSession>;
    },
    onSuccess: (data) => {
      setGameId(data.id);
      toast({
        title: "New game started!",
        description: "Battle begins against the Cultist.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create new game.",
        variant: "destructive",
      });
    },
  });

  // Get game state query
  const { data: gameSession, isLoading } = useQuery<GameSession>({
    queryKey: ["/api/game", gameId],
    enabled: !!gameId,
    refetchInterval: false,
  });

  // Play card mutation
  const playCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      const response = await apiRequest("POST", "/api/game/play-card", {
        gameId,
        cardId,
      });
      return response.json() as Promise<GameSession>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/game", gameId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to play card.",
        variant: "destructive",
      });
    },
  });

  // End turn mutation
  const endTurnMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/game/end-turn", {
        gameId,
      });
      return response.json() as Promise<GameSession>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/game", gameId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to end turn.",
        variant: "destructive",
      });
    },
  });

  // Select card mutation
  const selectCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      const response = await apiRequest("POST", "/api/game/select-card", {
        gameId,
        cardId,
      });
      return response.json() as Promise<GameSession>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/game", gameId] });
      toast({
        title: "Card added!",
        description: "The card has been added to your deck.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to select card.",
        variant: "destructive",
      });
    },
  });

  const handlePlayCard = (cardId: string) => {
    playCardMutation.mutate(cardId);
  };

  const handleEndTurn = () => {
    endTurnMutation.mutate();
  };

  const handleSelectCard = (cardId: string) => {
    selectCardMutation.mutate(cardId);
  };

  // Auto-create new game on component mount
  useEffect(() => {
    if (!gameId) {
      newGameMutation.mutate();
    }
  }, []);

  if (!gameId || isLoading || !gameSession) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-primary mb-4">Loading Game...</h1>
              <p className="text-muted-foreground font-mono">Initializing combat systems...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const gameState = gameSession?.gameState as GameState;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4 max-w-7xl">
        <GameHeader gameState={gameState} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <EnemyArea enemy={gameState.enemy} />
          <GameLog logs={gameState.logs} />
          <PlayerArea 
            player={gameState.player} 
            gameState={gameState}
            onEndTurn={handleEndTurn}
          />
        </div>

        <CardHand 
          hand={gameState.hand}
          gameState={gameState}
          onPlayCard={handlePlayCard}
          onSelectCard={handleSelectCard}
        />

        {/* Game Instructions */}
        <div className="mt-8 bg-muted/20 rounded-lg p-6 border border-border">
          <h3 className="font-semibold mb-4 text-accent">📋 GAME INSTRUCTIONS</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-sm">
            <div>
              <h4 className="font-semibold mb-2 text-primary">Combat Rules:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Each turn you draw 5 cards and get 3 energy</li>
                <li>• Click cards to play them (costs energy)</li>
                <li>• Red cards deal damage to enemies</li>
                <li>• Blue cards give you armor (blocks damage)</li>
                <li>• Purple cards have special effects</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-primary">Victory Conditions:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Reduce enemy health to 0 to win</li>
                <li>• Don't let your health reach 0</li>
                <li>• Use armor to block incoming damage</li>
                <li>• Plan your energy usage carefully</li>
              </ul>
            </div>
          </div>
        </div>

        {/* New Game Button */}
        <div className="mt-6 text-center">
          <Button 
            onClick={() => {
              setGameId(null);
              newGameMutation.mutate();
            }}
            className="font-mono"
            data-testid="button-new-game"
          >
            Start New Game
          </Button>
        </div>
      </div>
    </div>
  );
}
