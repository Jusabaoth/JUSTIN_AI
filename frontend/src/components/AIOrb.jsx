import { motion } from 'framer-motion';

export default function AIOrb({ isActive }) {
  return (
    <div className="orb-wrapper">
      <div className={`orb-container ${isActive ? 'orb-active' : ''}`}>
        <div className="orb-glow" />
        <div className="orb-ring orb-ring-2" />
        <div className="orb-ring orb-ring-1" />
        <motion.div
          className="orb-core"
          animate={isActive
            ? { scale: [1, 1.15, 1], filter: ['brightness(1)', 'brightness(1.4)', 'brightness(1)'] }
            : { scale: [1, 1.06, 1], filter: ['brightness(1)', 'brightness(1.15)', 'brightness(1)'] }
          }
          transition={{ duration: isActive ? 0.8 : 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <motion.p
        className="orb-label"
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        JUSTIN AI
      </motion.p>
      <p className="orb-sub">
        {isActive ? 'PROCESSING...' : 'READY'}
      </p>
    </div>
  );
}
