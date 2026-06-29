import { motion } from 'framer-motion';

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3" aria-label="Assistant is typing">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-muted-foreground/60"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}
