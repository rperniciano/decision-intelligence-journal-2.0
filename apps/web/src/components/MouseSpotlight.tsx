import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface MouseSpotlightProps {
  /** Size of the spotlight gradient in pixels */
  size?: number;
  /** Color of the spotlight (should include alpha) */
  color?: string;
  /** Intensity of the spotlight (0-1) */
  intensity?: number;
  /** Smoothing factor for lerp animation (0-1, higher = faster follow) */
  smoothing?: number;
  /** Additional CSS class */
  className?: string;
  /** Whether the spotlight is enabled */
  enabled?: boolean;
}

/**
 * MouseSpotlight - Interactive gradient that follows the cursor
 *
 * Features:
 * - Smooth lerp animation for natural follow
 * - Respects prefers-reduced-motion
 * - Automatically disabled on touch devices
 * - Uses pointer-events: none to not interfere with interactions
 */
export function MouseSpotlight({
  size = 600,
  color = 'rgba(0, 212, 170, 0.15)',
  intensity = 1,
  smoothing = 0.15,
  className = '',
  enabled = true,
}: MouseSpotlightProps) {
  // Current smoothed position
  const [position, setPosition] = useState({ x: -1000, y: -1000 });

  // Target position (raw mouse position)
  const targetRef = useRef({ x: -1000, y: -1000 });

  // Animation frame reference
  const rafRef = useRef<number | null>(null);

  // Check for reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Detect touch device
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Track if mouse has entered the viewport
  const [isActive, setIsActive] = useState(false);

  // Check for reduced motion preference on mount
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Detect touch device
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0
      );
    };

    checkTouch();

    // Also check on first touch
    const handleFirstTouch = () => {
      setIsTouchDevice(true);
      window.removeEventListener('touchstart', handleFirstTouch);
    };

    window.addEventListener('touchstart', handleFirstTouch, { passive: true });
    return () => window.removeEventListener('touchstart', handleFirstTouch);
  }, []);

  // Lerp animation loop
  const animate = useCallback(() => {
    if (prefersReducedMotion) {
      // Skip animation for reduced motion - instant follow
      setPosition({ ...targetRef.current });
      rafRef.current = requestAnimationFrame(animate);
      return;
    }

    setPosition(prev => {
      const dx = targetRef.current.x - prev.x;
      const dy = targetRef.current.y - prev.y;

      // Stop animating if very close to target
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
        return { x: targetRef.current.x, y: targetRef.current.y };
      }

      return {
        x: prev.x + dx * smoothing,
        y: prev.y + dy * smoothing,
      };
    });

    rafRef.current = requestAnimationFrame(animate);
  }, [smoothing, prefersReducedMotion]);

  // Start/stop animation loop
  useEffect(() => {
    if (!enabled || isTouchDevice) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [animate, enabled, isTouchDevice]);

  // Mouse move handler
  useEffect(() => {
    if (!enabled || isTouchDevice) return;

    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
      if (!isActive) setIsActive(true);
    };

    const handleMouseLeave = () => {
      setIsActive(false);
      // Move spotlight off-screen when mouse leaves
      targetRef.current = { x: -1000, y: -1000 };
    };

    const handleMouseEnter = () => {
      setIsActive(true);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [enabled, isTouchDevice, isActive]);

  // Calculate gradient style
  const spotlightStyle = useMemo(() => {
    const opacity = isActive ? intensity : 0;

    return {
      position: 'fixed' as const,
      inset: 0,
      background: `radial-gradient(
        ${size}px circle at ${position.x}px ${position.y}px,
        ${color},
        transparent 40%
      )`,
      pointerEvents: 'none' as const,
      opacity,
      transition: isActive ? 'opacity 0.3s ease-out' : 'opacity 0.5s ease-out',
      zIndex: 1,
    };
  }, [position.x, position.y, size, color, intensity, isActive]);

  // Don't render on touch devices or when disabled
  if (!enabled || isTouchDevice) {
    return null;
  }

  return (
    <div
      className={className}
      style={spotlightStyle}
      aria-hidden="true"
    />
  );
}

/**
 * Hook to use mouse spotlight data in custom implementations
 */
export function useMousePosition(smoothing = 0.15) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      setPosition(prev => ({
        x: prev.x + (targetRef.current.x - prev.x) * smoothing,
        y: prev.y + (targetRef.current.y - prev.y) * smoothing,
      }));
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [smoothing]);

  return position;
}
