import { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors } from "../lib/designSystem";

type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  delay: number;
};

type ParticleFieldProps = {
  count?: number;
  color?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  seed?: string;
};

export const ParticleField = ({
  count = 30,
  color = colors.accent,
  minSize = 2,
  maxSize = 6,
  speed = 1,
  seed = "particles",
}: ParticleFieldProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  // Generate particles deterministically
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: random(`${seed}-x-${i}`) * width,
      y: random(`${seed}-y-${i}`) * height,
      size: minSize + random(`${seed}-size-${i}`) * (maxSize - minSize),
      speedX: (random(`${seed}-speedX-${i}`) - 0.5) * 2 * speed,
      speedY: (random(`${seed}-speedY-${i}`) - 0.5) * 2 * speed,
      opacity: 0.3 + random(`${seed}-opacity-${i}`) * 0.5,
      delay: random(`${seed}-delay-${i}`) * fps,
    }));
  }, [count, width, height, minSize, maxSize, speed, seed, fps]);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {particles.map((particle) => {
        // Entrance fade
        const entranceOpacity = interpolate(
          frame,
          [particle.delay, particle.delay + fps * 0.5],
          [0, particle.opacity],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        // Calculate position with wrapping
        const time = frame / fps;
        let x = particle.x + particle.speedX * time * 50;
        let y = particle.y + particle.speedY * time * 50;

        // Wrap around edges
        x = ((x % width) + width) % width;
        y = ((y % height) + height) % height;

        // Gentle floating motion
        const floatOffset = Math.sin(frame * 0.02 + particle.id) * 10;

        return (
          <div
            key={particle.id}
            style={{
              position: "absolute",
              left: x,
              top: y + floatOffset,
              width: particle.size,
              height: particle.size,
              borderRadius: "50%",
              backgroundColor: color,
              opacity: entranceOpacity,
              boxShadow: `0 0 ${particle.size * 2}px ${color}60`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * Connecting particles that form a network pattern
 */
type NetworkParticleFieldProps = ParticleFieldProps & {
  connectionDistance?: number;
  connectionOpacity?: number;
};

export const NetworkParticleField = ({
  count = 20,
  color = colors.accent,
  minSize = 3,
  maxSize = 5,
  speed = 0.5,
  seed = "network",
  connectionDistance = 150,
  connectionOpacity = 0.2,
}: NetworkParticleFieldProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Generate particles
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: random(`${seed}-x-${i}`) * width,
      y: random(`${seed}-y-${i}`) * height,
      size: minSize + random(`${seed}-size-${i}`) * (maxSize - minSize),
      speedX: (random(`${seed}-speedX-${i}`) - 0.5) * 2 * speed,
      speedY: (random(`${seed}-speedY-${i}`) - 0.5) * 2 * speed,
      opacity: 0.5 + random(`${seed}-opacity-${i}`) * 0.5,
      delay: random(`${seed}-delay-${i}`) * fps * 0.5,
    }));
  }, [count, width, height, minSize, maxSize, speed, seed, fps]);

  // Calculate current positions
  const positions = particles.map((particle) => {
    const time = frame / fps;
    let x = particle.x + particle.speedX * time * 30;
    let y = particle.y + particle.speedY * time * 30;

    // Bounce off edges
    const bounceX = Math.floor(x / width);
    const bounceY = Math.floor(y / height);
    x = bounceX % 2 === 0 ? x % width : width - (x % width);
    y = bounceY % 2 === 0 ? y % height : height - (y % height);

    // Ensure positive
    x = Math.abs(x);
    y = Math.abs(y);

    return { x, y, particle };
  });

  // Find connections
  const connections: { from: number; to: number; distance: number }[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const dx = positions[i].x - positions[j].x;
      const dy = positions[i].y - positions[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < connectionDistance) {
        connections.push({ from: i, to: j, distance });
      }
    }
  }

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* Connection lines */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {connections.map(({ from, to, distance }, i) => {
          const opacity =
            connectionOpacity * (1 - distance / connectionDistance);
          return (
            <line
              key={`${from}-${to}`}
              x1={positions[from].x}
              y1={positions[from].y}
              x2={positions[to].x}
              y2={positions[to].y}
              stroke={color}
              strokeWidth={1}
              opacity={opacity}
            />
          );
        })}
      </svg>

      {/* Particles */}
      {positions.map(({ x, y, particle }) => {
        const entranceOpacity = interpolate(
          frame,
          [particle.delay, particle.delay + fps * 0.3],
          [0, particle.opacity],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return (
          <div
            key={particle.id}
            style={{
              position: "absolute",
              left: x - particle.size / 2,
              top: y - particle.size / 2,
              width: particle.size,
              height: particle.size,
              borderRadius: "50%",
              backgroundColor: color,
              opacity: entranceOpacity,
              boxShadow: `0 0 ${particle.size * 2}px ${color}60`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
