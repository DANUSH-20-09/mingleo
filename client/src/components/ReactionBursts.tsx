import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReactionItem {
  id: string;
  emoji: string;
  x: number;
}

interface ReactionBurstsProps {
  reaction: { emoji: string; id: string } | null;
}

export const ReactionBursts: React.FC<ReactionBurstsProps> = ({ reaction }) => {
  const [items, setItems] = useState<ReactionItem[]>([]);

  useEffect(() => {
    if (!reaction) return;

    // Spawn 5 floating particles around random horizontal positions
    const newItems: ReactionItem[] = Array.from({ length: 5 }).map((_, i) => ({
      id: `${reaction.id}_${i}_${Math.random()}`,
      emoji: reaction.emoji,
      x: 40 + (Math.random() * 50 - 25), // percent
    }));

    setItems(prev => [...prev.slice(-15), ...newItems]);

    const timer = setTimeout(() => {
      setItems(prev => prev.filter(item => !newItems.some(ni => ni.id === item.id)));
    }, 2000);

    return () => clearTimeout(timer);
  }, [reaction]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      <AnimatePresence>
        {items.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 1, y: '80%', x: `${item.x}%`, scale: 0.5 }}
            animate={{
              opacity: 0,
              y: '20%',
              x: `${item.x + (Math.random() * 10 - 5)}%`,
              scale: [0.8, 1.6, 1.2],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
            className="absolute text-4xl select-none"
          >
            {item.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
