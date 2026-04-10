import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full mt-2 left-1/2 -translate-x-1/2';
      case 'left':
        return 'right-full mr-2 top-1/2 -translate-y-1/2';
      case 'right':
        return 'left-full ml-2 top-1/2 -translate-y-1/2';
      case 'top':
      default:
        return 'bottom-full mb-2 left-1/2 -translate-x-1/2';
    }
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: position === 'top' ? 4 : -4 }}
            className={`absolute z-[1000] px-3 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-2xl pointer-events-none whitespace-nowrap border border-white/10 ${getPositionClasses()}`}
          >
            {content}
            {/* Arrow */}
            <div className={`absolute w-2 h-2 bg-slate-900 border-white/10 rotate-45 ${
              position === 'bottom' ? '-top-1 border-t border-l left-1/2 -translate-x-1/2' :
              position === 'left' ? '-right-1 border-t border-r top-1/2 -translate-y-1/2' :
              position === 'right' ? '-left-1 border-b border-l top-1/2 -translate-y-1/2' :
              '-bottom-1 border-b border-r left-1/2 -translate-x-1/2' // default top
            }`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
