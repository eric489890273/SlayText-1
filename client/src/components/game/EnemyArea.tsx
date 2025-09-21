import { Enemy } from "@shared/schema";

interface EnemyAreaProps {
  enemy: Enemy;
}

const ENEMY_ASCII_ART: Record<string, string> = {
  cultist: `     /\\   /\\
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
  spider: `    /\\   /\\   /\\
   (  o ) ( o  )
    \\  \\_/  /
     ) --- (
    /  ___  \\
   |  /___\\  |
    \\ \\___/ /
     \\     /
      |___|`,
  elite_guard: `     [===]
     |[o]|
   ___|||___
  |  |||  |
  |  |||  |
  |  /|\\  |
  | / | \\ |
  |/  |  \\|
     /|\\
    / | \\`
};

export function EnemyArea({ enemy }: EnemyAreaProps) {
  const healthPercentage = (enemy.health / enemy.maxHealth) * 100;

  return (
    <div className="lg:col-span-3 bg-card rounded-lg p-6 border border-border">
      <h2 className="text-xl font-semibold mb-4 text-destructive" data-testid="text-enemy-name">
        🗡️ ENEMY: {enemy.name}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Enemy ASCII Art */}
        <div className="bg-secondary rounded-lg p-4">
          <div className="ascii-art text-destructive text-center text-sm">
            {ENEMY_ASCII_ART[enemy.typeId] || ENEMY_ASCII_ART.cultist}
          </div>
        </div>

        {/* Enemy Stats */}
        <div className="space-y-4">
          {/* Health Bar */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-mono">Health</span>
              <span className="text-sm font-mono" data-testid="text-enemy-health">
                {enemy.health}/{enemy.maxHealth}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-4">
              <div 
                className="health-bar h-4 rounded-full" 
                style={{ width: `${healthPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Armor */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-mono">Armor</span>
              <span className="text-sm font-mono" data-testid="text-enemy-armor">
                {enemy.armor}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="armor-bar h-3 rounded-full" 
                style={{ width: enemy.armor > 0 ? "100%" : "0%" }}
              ></div>
            </div>
          </div>

          {/* Enemy Intent */}
          <div className="bg-destructive/20 rounded-lg p-3 border border-destructive/30">
            <h4 className="font-semibold text-destructive mb-2">Next Action:</h4>
            <p className="font-mono text-sm" data-testid="text-enemy-intent">
              {enemy.nextActionDescription}
            </p>
          </div>

          {/* Status Effects */}
          <div className="flex flex-wrap gap-2" data-testid="enemy-status-effects">
            {enemy.statusEffects.map((effect, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-purple-900/50 text-purple-300 rounded text-xs font-mono"
                data-testid={`status-${effect.name.toLowerCase()}`}
              >
                {effect.name} ({effect.value})
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
