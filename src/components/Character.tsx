import { motion, AnimatePresence } from "motion/react";

interface CharacterProps {
  happiness: number; // 0 to 1
  isPuzzled?: boolean;
}

export default function Character({ happiness, isPuzzled }: CharacterProps) {
  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Body */}
      <motion.div
        animate={{
          scale: 1 + happiness * 0.1,
          rotate: isPuzzled ? [0, -5, 5, 0] : happiness * 5,
          backgroundColor: isPuzzled ? "#E1BEE7" : (happiness > 0.8 ? "#FFEB3B" : "#ffffff"),
        }}
        transition={{
          rotate: isPuzzled ? { repeat: Infinity, duration: 2 } : { duration: 0.5 }
        }}
        className="w-48 h-48 brutal-border rounded-full flex flex-col items-center justify-center relative overflow-hidden"
      >
        {/* Eyes */}
        <div className="flex gap-8 mb-4">
          <Eye happiness={happiness} isPuzzled={isPuzzled} />
          <Eye happiness={happiness} isPuzzled={isPuzzled} />
        </div>

        {/* Mouth */}
        <motion.div
          animate={{
            height: isPuzzled ? 4 : (happiness > 0.5 ? 20 : 4),
            width: isPuzzled ? 10 : (happiness > 0.5 ? 40 : 20),
            borderRadius: happiness > 0.5 ? "0 0 40px 40px" : "2px",
          }}
          className="bg-black"
        />

        {/* Question Mark for Puzzled */}
        <AnimatePresence>
          {isPuzzled && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: -40 }}
              exit={{ opacity: 0 }}
              className="absolute font-display text-4xl text-accent"
            >
              ?
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function Eye({ happiness, isPuzzled }: { happiness: number; isPuzzled?: boolean }) {
  return (
    <motion.div
      animate={{
        height: isPuzzled ? 4 : (happiness > 0.8 ? 12 : 8),
        scaleY: isPuzzled ? 1 : (happiness < 0.3 ? 0.2 : 1),
      }}
      className="w-4 bg-black rounded-full"
    />
  );
}
