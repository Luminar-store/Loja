'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'motion/react';
import Image from 'next/image';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
  duration?: number;
  fullWidth?: boolean;
}

export function FadeIn({ children, delay = 0, direction = 'up', className = '', duration = 0.6, fullWidth = false }: FadeInProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  const directionOffsets = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
    none: { x: 0, y: 0 }
  };

  const initialOffset = directionOffsets[direction];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...initialOffset }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...initialOffset }}
      transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={`${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
}

interface ParallaxProps {
  children: React.ReactNode;
  offset?: number;
  className?: string;
}

export function Parallax({ children, offset = 50, className = '' }: ParallaxProps) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset]);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div style={{ y }} className="w-full h-full relative">
        {children}
      </motion.div>
    </div>
  );
}

export function HoverImage({ src, alt, className = '', priority = false, fill = true, width, height }: { src: string, alt: string, className?: string, priority?: boolean, fill?: boolean, width?: number, height?: number }) {
  return (
    <motion.div 
      className={`overflow-hidden relative w-full h-full ${className}`}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {fill ? (
        <Image src={src} alt={alt} fill className="object-cover" priority={priority} referrerPolicy="no-referrer" />
      ) : (
        <Image src={src} alt={alt} width={width || 800} height={height || 800} className="object-cover w-full h-full" priority={priority} referrerPolicy="no-referrer" />
      )}
    </motion.div>
  );
}

