import { Card, GameState } from "@shared/schema";

interface CardHandProps {
  hand: Card[];
  gameState: GameState;
  onPlayCard: (cardId: string) => void;
  onSelectCard?: (cardId: string) => void;
}

export function CardHand({ hand, gameState, onPlayCard, onSelectCard }: CardHandProps) {
  const getCardTypeClass = (type: string) => {
    switch (type) {
      case "ATTACK":
        return "card-attack";
      case "DEFENSE":
        return "card-defense";
      case "SKILL":
        return "card-skill";
      default:
        return "";
    }
  };

  const getCardTypeColor = (type: string) => {
    switch (type) {
      case "ATTACK":
        return "bg-destructive/20 text-destructive";
      case "DEFENSE":
        return "bg-blue-500/20 text-blue-400";
      case "SKILL":
        return "bg-purple-500/20 text-purple-400";
      default:
        return "bg-muted/20 text-muted-foreground";
    }
  };

  const getCardNameColor = (type: string) => {
    switch (type) {
      case "ATTACK":
        return "text-destructive";
      case "DEFENSE":
        return "text-blue-400";
      case "SKILL":
        return "text-purple-400";
      default:
        return "text-foreground";
    }
  };

  if (gameState.phase === "VICTORY" && gameState.availableCards && onSelectCard) {
    return (
      <div className="mt-8 bg-card rounded-lg p-6 border border-border">
        <h3 className="font-semibold mb-4 text-primary">🎉 VICTORY! Choose a card to add to your deck:</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gameState.availableCards.map((card) => (
            <div 
              key={card.id}
              className={`card ${getCardTypeClass(card.type)} bg-secondary rounded-lg p-4 cursor-pointer transition-all duration-200 hover:bg-secondary/80`}
              onClick={() => onSelectCard(card.id)}
              data-testid={`card-${card.id}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="energy-cost w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  {card.cost}
                </div>
                <span className={`text-xs px-2 py-1 rounded ${getCardTypeColor(card.type)}`}>
                  {card.type}
                </span>
              </div>
              <h4 className={`font-semibold mb-2 ${getCardNameColor(card.type)}`}>
                {card.name}
              </h4>
              <p className="text-sm text-muted-foreground font-mono">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (gameState.phase === "DEFEAT") {
    return (
      <div className="mt-8 bg-card rounded-lg p-6 border border-border">
        <h3 className="font-semibold mb-4 text-destructive">💀 DEFEAT</h3>
        <p className="text-muted-foreground font-mono">The enemy has bested you. Refresh to try again!</p>
      </div>
    );
  }

  return (
    <div className="mt-8 bg-card rounded-lg p-6 border border-border">
      <h3 className="font-semibold mb-4 text-primary" data-testid="text-hand-count">
        🎴 HAND ({hand.length}/5)
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {hand.map((card) => {
          const canPlay = gameState.player.energy >= card.cost && gameState.phase === "COMBAT";
          
          return (
            <div 
              key={card.id}
              className={`card ${getCardTypeClass(card.type)} bg-secondary rounded-lg p-4 transition-all duration-200 ${
                canPlay 
                  ? "cursor-pointer hover:bg-secondary/80" 
                  : "opacity-50 cursor-not-allowed"
              }`}
              onClick={() => canPlay && onPlayCard(card.id)}
              data-testid={`card-${card.id}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="energy-cost w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  {card.cost}
                </div>
                <span className={`text-xs px-2 py-1 rounded ${getCardTypeColor(card.type)}`}>
                  {card.type}
                </span>
              </div>
              <h4 className={`font-semibold mb-2 ${getCardNameColor(card.type)}`}>
                {card.name}
              </h4>
              <p className="text-sm text-muted-foreground font-mono">
                {card.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
