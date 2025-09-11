import { GameState } from "@shared/schema";

interface GameHeaderProps {
  gameState: GameState;
}

export function GameHeader({ gameState }: GameHeaderProps) {
  return (
    <header className="mb-6 text-center">
      <h1 className="text-4xl font-bold mb-2 terminal-glow text-primary">SLAY THE SPIRE</h1>
      <p className="text-muted-foreground font-mono">Text-Based Card Battle System</p>
      <div className="mt-4 flex justify-center items-center gap-4">
        <span className="px-3 py-1 bg-secondary rounded text-secondary-foreground" data-testid="text-current-turn">
          Turn: {gameState.turn}
        </span>
        <span className="px-3 py-1 bg-accent text-accent-foreground rounded" data-testid="text-game-phase">
          Phase: {gameState.phase}
        </span>
      </div>
    </header>
  );
}
