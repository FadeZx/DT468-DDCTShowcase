import { useEffect, useState } from 'react';

interface Symbol {
  id: number;
  symbol: string;
  x: number;
  y: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
}

const symbols = [
  // Game symbols
  '🎮', '🕹️', '🎯', '🎲', '🏆', '⚡', '💎', '🔥', '⭐', '🚀',
  // Animation symbols
  '🎬', '🎭', '🎨', '✨', '🌟', '💫', '🎪', '🎊', '🎉', '🌈',
  // Math/Tech symbols
  '∞', '∑', '∆', '∇', '∫', '∂', '≈', '≠', '≤', '≥', '∈', '∉', '∪', '∩',
  // Digital Art symbols
  '🖌️', '🖍️', '🎨', '🖼️', '📐', '📏', '🔍', '💻', '⌨️', '🖱️',
  // Creative symbols
  '✏️', '📝', '💡', '🔧', '⚙️', '🔩', '🛠️', '📊', '📈', '📉'
];

const colors = [
  '#ef4444', // red-500 (DDCT logo red)
  '#2563eb', // blue-600 (DDCT logo blue)
  '#facc15', // yellow-400 (DDCT logo yellow)
  '#2dd4bf', // teal-400 (DDCT logo teal)
  '#8b5cf6', // violet-500
  '#f97316', // orange-500
  '#10b981', // emerald-500
  '#ec4899', // pink-500
];

export function FallingSymbols() {
  const [symbols_list, setSymbolsList] = useState<Symbol[]>([]);

  useEffect(() => {
    const createSymbol = (): Symbol => ({
      id: Math.random(),
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      x: Math.random() * window.innerWidth,
      y: -50,
      speed: Math.random() * 2 + 1, // 1-3 speed
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 4, // -2 to 2 rotation speed
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 20 + 15, // 15-35px size
    });

    const updateSymbols = () => {
      setSymbolsList(prev => {
        let newSymbols = prev.map(symbol => ({
          ...symbol,
          y: symbol.y + symbol.speed,
          rotation: symbol.rotation + symbol.rotationSpeed,
        })).filter(symbol => symbol.y < window.innerHeight + 50);

        // Add new symbols randomly
        if (Math.random() < 0.1 && newSymbols.length < 50) {
          newSymbols.push(createSymbol());
        }

        return newSymbols;
      });
    };

    const interval = setInterval(updateSymbols, 50);
    
    // Initial symbols
    const initialSymbols = Array.from({ length: 20 }, createSymbol);
    initialSymbols.forEach((symbol, index) => {
      symbol.y = Math.random() * window.innerHeight;
    });
    setSymbolsList(initialSymbols);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Fade overlay that gets stronger towards the bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80 z-10 pointer-events-none" />
      
      {symbols_list.map((symbol) => {
        // Calculate opacity based on vertical position - fade out in lower sections
        const fadeOpacity = symbol.y < window.innerHeight * 0.6 ? 0.4 : 
                           symbol.y < window.innerHeight * 0.8 ? 0.2 : 0.1;
        
        return (
          <div
            key={symbol.id}
            className="absolute transition-opacity duration-1000"
            style={{
              left: `${symbol.x}px`,
              top: `${symbol.y}px`,
              transform: `rotate(${symbol.rotation}deg)`,
              color: symbol.color,
              fontSize: `${symbol.size}px`,
              textShadow: '0 0 10px rgba(0,0,0,0.3)',
              opacity: fadeOpacity,
            }}
          >
            {symbol.symbol}
          </div>
        );
      })}
    </div>
  );
}