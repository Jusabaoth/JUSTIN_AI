import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';

const particleData = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  size: `${Math.random() * 3 + 1}px`,
  duration: `${Math.random() * 20 + 15}s`,
  delay: `${Math.random() * 15}s`,
  color: i % 2 === 0 ? '#00D4FF' : '#A855F7',
}));

export default function AuroraBackground() {
  return (
    <div className="aurora-bg">
      <div className="aurora-orb-1" />
      {particleData.map(p => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            bottom: '-10px',
            width: p.size,
            height: p.size,
            background: p.color,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}
