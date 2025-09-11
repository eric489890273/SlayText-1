import { Player, GameState } from "@shared/schema";

interface PlayerAreaProps {
  player: Player;
  gameState: GameState;
  onEndTurn: () => void;
}

export function PlayerArea({ player, gameState, onEndTurn }: PlayerAreaProps) {
  const healthPercentage = (player.health / player.maxHealth) * 100;

  return (
    <div className="lg:col-span-2 space-y-6">
      {/* Player Stats */}
      <div className="bg-card rounded-lg p-4 border border-border">
        <h3 className="font-semibold mb-4 text-primary">⚔️ PLAYER STATUS</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Health */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-mono">Health</span>
              <span className="text-sm font-mono" data-testid="text-player-health">
                {player.health}/{player.maxHealth}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-4">
              <div 
                className="health-bar h-4 rounded-full" 
                style={{ width: `${healthPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Energy */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-mono">Energy</span>
              <span className="text-sm font-mono" data-testid="text-player-energy">
                {player.energy}/{player.maxEnergy}
              </span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: player.maxEnergy }, (_, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i < player.energy
                      ? "energy-cost"
                      : "bg-muted text-muted-foreground"
                  }`}
                  data-testid={`energy-orb-${i}`}
                >
                  {player.maxEnergy - i}
                </div>
              ))}
            </div>
          </div>

          {/* Armor */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-mono">Armor</span>
              <span className="text-sm font-mono" data-testid="text-player-armor">
                {player.armor}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="armor-bar h-3 rounded-full" 
                style={{ width: player.armor > 0 ? "100%" : "0%" }}
              ></div>
            </div>
          </div>
        </div>

        {/* Status Effects */}
        <div className="mt-4 flex flex-wrap gap-2" data-testid="player-status-effects">
          {player.statusEffects.map((effect, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-green-900/50 text-green-300 rounded text-xs font-mono"
              data-testid={`status-${effect.name.toLowerCase()}`}
            >
              {effect.name} +{effect.value}
            </span>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-card rounded-lg p-4 border border-border">
        <div className="flex flex-wrap gap-3">
          <button 
            className="px-4 py-2 bg-primary text-primary-foreground rounded font-mono hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onEndTurn}
            disabled={gameState.phase !== "COMBAT"}
            data-testid="button-end-turn"
          >
            End Turn
          </button>
          <button 
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded font-mono hover:bg-secondary/90 transition-colors" 
            disabled
            data-testid="button-view-deck"
          >
            View Deck ({gameState.deck.length + gameState.hand.length + gameState.discardPile.length})
          </button>
          <button 
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded font-mono hover:bg-secondary/90 transition-colors"
            disabled
            data-testid="button-view-discard"
          >
            Discard ({gameState.discardPile.length})
          </button>
        </div>
      </div>
    </div>
  );
}
