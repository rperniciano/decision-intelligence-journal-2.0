import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface FloatingActionButtonProps {
  to: string;
  icon?: React.ReactNode;
  ariaLabel?: string;
}

export function FloatingActionButton({
  to,
  icon,
  ariaLabel = 'Quick action'
}: FloatingActionButtonProps) {
  return (
    <Link to={to}>
      <motion.button
        className="fixed bottom-24 right-6 w-14 h-14 bg-accent rounded-full shadow-lg flex items-center justify-center z-50 glow-accent"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
        aria-label={ariaLabel}
      >
        {icon || (
          <svg
            className="w-6 h-6 text-bg-deep"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        )}
      </motion.button>
    </Link>
  );
}

export default FloatingActionButton;
