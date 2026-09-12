import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface MotionRevealProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    direction?: 'up' | 'left' | 'right';
}

export const MotionReveal: React.FC<MotionRevealProps> = ({
    children,
    className,
    delay = 0,
    direction = 'up',
}) => {
    const prefersReducedMotion = useReducedMotion();
    const offset = direction === 'left' ? -18 : direction === 'right' ? 18 : 18;

    return (
        <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, x: direction === 'up' ? 0 : offset, y: direction === 'up' ? offset : 0 }}
            whileInView={prefersReducedMotion ? undefined : { opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, amount: 0.16 }}
            transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
};