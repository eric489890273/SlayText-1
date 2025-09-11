import { useEffect, useRef } from "react";

interface GameLogProps {
  logs: string[];
}

export function GameLog({ logs }: GameLogProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="lg:col-span-1 bg-card rounded-lg border border-border">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-primary">Combat Log</h3>
      </div>
      <div 
        ref={logContainerRef}
        className="h-80 overflow-y-auto p-4 space-y-1 font-mono text-sm"
        data-testid="game-log"
      >
        {logs.map((log, index) => (
          <div 
            key={index}
            className={`log-entry p-2 rounded ${index % 2 === 0 ? 'bg-muted/10' : ''}`}
            data-testid={`log-entry-${index}`}
          >
            <span className="text-foreground">{log}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
