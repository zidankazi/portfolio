'use client';

import { motion, type Variants } from 'framer-motion';
import React from 'react';

const CHARACTER_ANIMATION: Variants = {
  initial: {
    opacity: 0,
    y: 5,
  },
  animate: (charCount: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: charCount === 1 ? 0.25 : 1,
      ease: [0.2, 0.65, 0.3, 0.9],
    },
  }),
};

interface AnimatedTextProps {
  text: string;
  element?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'i';
  className?: string;
  delay?: number;
  wave?: boolean;
}

export function AnimatedText({
  text,
  element = 'span',
  className,
  delay = 0,
  wave = false,
}: AnimatedTextProps) {
  let globalCharIndex = 0;

  const splitWords = text.split(' ');
  const words = splitWords.map((word, wordIndex) => {
    const wordChars = [...word].map((char, charIndex) => {
      const currentGlobalIndex = globalCharIndex++;
      return (
        <motion.span
          key={charIndex}
          className="inline-block"
          aria-hidden="true"
          custom={word.length}
          variants={CHARACTER_ANIMATION}
        >
          {wave ? (
            <span
              className="inline-block"
              style={{
                animation: 'char-float 3s ease-in-out infinite',
                animationDelay: `${1.5 + currentGlobalIndex * 0.12}s`,
              }}
            >
              {char}
            </span>
          ) : (
            char
          )}
        </motion.span>
      );
    });

    return (
      <motion.span
        key={wordIndex}
        className={`inline-block whitespace-nowrap will-change-transform ${wordIndex < splitWords.length - 1 ? 'mr-[0.25em]' : ''}`}
        aria-hidden="true"
        initial="initial"
        animate="animate"
        transition={{
          delayChildren: wordIndex * 0.25 + delay,
          staggerChildren: 0.025,
        }}
      >
        {wordChars}
      </motion.span>
    );
  });

  return React.createElement(element, { className }, words);
}
