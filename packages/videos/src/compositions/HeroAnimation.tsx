import { useMemo } from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  random,
  Easing,
} from "remotion";
import { colors, springConfigs } from "../lib/designSystem";

/**
 * Hero Animation - Enhanced background video for landing page
 * Features:
 * - Prominent pulsating teal orb with dramatic glow
 * - Expanding concentric waves with improved timing
 * - Particles attracted toward the center
 * - Dynamic gradient background rotation
 * - Emanating rays/lines from center
 *
 * Duration: 10 seconds at 30fps = 300 frames (looping)
 */
export const HeroAnimation = () => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  // Dynamic background gradient animation - rotating slowly
  const gradientAngle = interpolate(
    frame,
    [0, durationInFrames],
    [135, 135 + 45],
    { extrapolateRight: "clamp" }
  );

  // Background color shift for more dynamism
  const colorShift = interpolate(
    frame,
    [0, durationInFrames / 2, durationInFrames],
    [0, 0.15, 0]
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradientAngle}deg,
          ${colors.bgDeep} 0%,
          hsl(240, 20%, ${8 + colorShift * 5}%) 40%,
          ${colors.bgGradient} 70%,
          ${colors.bgDeep} 100%)`,
      }}
    >
      {/* Deep ambient glow in background */}
      <AbsoluteFill style={{ opacity: 0.4 }}>
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 800,
            height: 800,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${colors.accent}25 0%, ${colors.accent}10 30%, transparent 70%)`,
            filter: "blur(80px)",
          }}
        />
      </AbsoluteFill>

      {/* Emanating rays from center */}
      <Sequence from={Math.floor(fps * 0.5)} premountFor={fps}>
        <EmanatingRays />
      </Sequence>

      {/* Expanding concentric waves */}
      <Sequence from={Math.floor(fps)} premountFor={fps}>
        <ConcentricWaves />
      </Sequence>

      {/* Particles attracted toward center */}
      <Sequence from={0} premountFor={fps}>
        <AttractingParticles
          count={50}
          seed="hero-attract"
        />
      </Sequence>

      {/* Central composition */}
      <AbsoluteFill className="flex items-center justify-center">
        {/* Outer ring indicators */}
        <Sequence from={0} premountFor={fps}>
          <PulsingRings />
        </Sequence>

        {/* Central dramatic orb */}
        <Sequence from={0} premountFor={fps}>
          <DramaticOrb size={140} />
        </Sequence>
      </AbsoluteFill>

      {/* Floating accent elements */}
      <Sequence from={fps} premountFor={fps}>
        <FloatingElements />
      </Sequence>

      {/* Vignette overlay for depth */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 60% at center, transparent 20%, ${colors.bgDeep}95 100%)`,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * Dramatic central orb with enhanced pulse and glow
 */
const DramaticOrb = ({ size = 120 }: { size?: number }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Smooth entrance
  const entrance = spring({
    frame,
    fps,
    config: { ...springConfigs.natural, mass: 1.5 },
  });

  // Main pulse cycle (3 seconds for dramatic effect)
  const pulseCycle = fps * 3;
  const pulseFrame = frame % pulseCycle;
  const pulseProgress = pulseFrame / pulseCycle;

  // Non-linear pulse for more dramatic effect
  const pulseWave = Math.sin(pulseProgress * Math.PI * 2);
  const sharpPulse = Math.pow(Math.abs(Math.sin(pulseProgress * Math.PI)), 0.5) * Math.sign(pulseWave);

  const scale = 1 + sharpPulse * 0.12;
  const opacity = interpolate(sharpPulse, [-1, 1], [0.8, 1]);

  // Glow intensity follows pulse with exaggeration
  const glowIntensity = interpolate(sharpPulse, [-1, 1], [40, 80]);
  const glowSpread = interpolate(sharpPulse, [-1, 1], [60, 120]);

  // Inner light animation
  const innerGlow = interpolate(pulseProgress, [0, 0.5, 1], [0.6, 1, 0.6]);

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
      }}
    >
      {/* Outer glow layer */}
      <div
        style={{
          position: "absolute",
          inset: -40,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.accent}40 0%, transparent 70%)`,
          filter: `blur(${glowSpread * 0.5}px)`,
          opacity: entrance * opacity,
          transform: `scale(${scale * 1.2})`,
        }}
      />

      {/* Main orb */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `radial-gradient(circle at 35% 35%,
            ${colors.accent100} 0%,
            ${colors.accent} 40%,
            ${colors.accent700} 100%)`,
          transform: `scale(${entrance * scale})`,
          opacity: entrance * opacity,
          boxShadow: `
            0 0 ${glowIntensity}px ${colors.accent}90,
            0 0 ${glowIntensity * 1.5}px ${colors.accent}60,
            0 0 ${glowIntensity * 2.5}px ${colors.accent}30,
            inset 0 0 ${size * 0.3}px ${colors.accent100}${Math.floor(innerGlow * 80).toString(16).padStart(2, '0')}
          `,
        }}
      />

      {/* Inner bright spot */}
      <div
        style={{
          position: "absolute",
          top: "25%",
          left: "25%",
          width: size * 0.25,
          height: size * 0.25,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.accent50}90 0%, transparent 70%)`,
          opacity: entrance * innerGlow * 0.8,
          filter: "blur(4px)",
        }}
      />
    </div>
  );
};

/**
 * Pulsing concentric rings around the orb
 */
const PulsingRings = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rings = [
    { radius: 180, delay: 0, width: 1.5 },
    { radius: 260, delay: fps * 0.4, width: 1 },
    { radius: 350, delay: fps * 0.8, width: 0.5 },
  ];

  return (
    <>
      {rings.map((ring, i) => {
        // Staggered entrance
        const entrance = spring({
          frame: frame - ring.delay,
          fps,
          config: springConfigs.smooth,
        });

        // Looping pulse animation with phase offset
        const cycleDuration = fps * 4;
        const cycleFrame = (frame + ring.delay) % cycleDuration;
        const pulseProgress = cycleFrame / cycleDuration;

        const scale = interpolate(
          Math.sin(pulseProgress * Math.PI * 2),
          [-1, 1],
          [0.96, 1.04]
        );
        const opacity = interpolate(
          Math.sin(pulseProgress * Math.PI * 2),
          [-1, 1],
          [0.1, 0.3]
        );

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: ring.radius * 2,
              height: ring.radius * 2,
              borderRadius: "50%",
              border: `${ring.width}px solid ${colors.accent}`,
              opacity: entrance * opacity,
              transform: `scale(${scale})`,
              boxShadow: `0 0 20px ${colors.accent}20`,
            }}
          />
        );
      })}
    </>
  );
};

/**
 * Expanding concentric waves emanating from center
 */
const ConcentricWaves = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const waves = [
    { startFrame: 0, duration: fps * 4 },
    { startFrame: fps * 1.3, duration: fps * 4 },
    { startFrame: fps * 2.6, duration: fps * 4 },
    { startFrame: fps * 4, duration: fps * 4 },
    { startFrame: fps * 5.3, duration: fps * 4 },
  ];

  const maxRadius = Math.max(width, height) * 0.8;

  return (
    <AbsoluteFill className="flex items-center justify-center">
      {waves.map((wave, i) => {
        // Looping frame calculation
        const loopDuration = fps * 6.6;
        const loopFrame = frame % loopDuration;
        const waveFrame = loopFrame - wave.startFrame;

        if (waveFrame < 0 || waveFrame > wave.duration) return null;

        const progress = waveFrame / wave.duration;

        // Eased expansion
        const easedProgress = Easing.out(Easing.cubic)(progress);
        const radius = easedProgress * maxRadius;

        // Fade out as it expands
        const opacity = interpolate(
          progress,
          [0, 0.2, 0.8, 1],
          [0, 0.4, 0.15, 0]
        );

        // Decrease stroke width as it expands
        const strokeWidth = interpolate(progress, [0, 1], [3, 0.5]);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: radius * 2,
              height: radius * 2,
              borderRadius: "50%",
              border: `${strokeWidth}px solid ${colors.accent}`,
              opacity,
              boxShadow: `0 0 ${30 * (1 - progress)}px ${colors.accent}30`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * Rays emanating from the center
 */
const EmanatingRays = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const rayCount = 12;
  const maxLength = Math.max(width, height) * 0.6;

  // Entrance animation
  const entrance = spring({
    frame,
    fps,
    config: springConfigs.smooth,
  });

  return (
    <AbsoluteFill className="flex items-center justify-center">
      <svg
        width={width}
        height={height}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {Array.from({ length: rayCount }).map((_, i) => {
          const angle = (i / rayCount) * Math.PI * 2;
          const angleOffset = (frame * 0.002) % (Math.PI * 2);
          const currentAngle = angle + angleOffset;

          // Pulsing length
          const pulseCycle = (frame + i * 10) % (fps * 3);
          const pulseProgress = pulseCycle / (fps * 3);
          const lengthMultiplier = 0.7 + Math.sin(pulseProgress * Math.PI * 2) * 0.3;
          const length = maxLength * lengthMultiplier;

          // Starting position (from center orb edge)
          const startDistance = 80;
          const startX = width / 2 + Math.cos(currentAngle) * startDistance;
          const startY = height / 2 + Math.sin(currentAngle) * startDistance;

          const endX = width / 2 + Math.cos(currentAngle) * length;
          const endY = height / 2 + Math.sin(currentAngle) * length;

          // Opacity varies per ray
          const opacity = interpolate(
            Math.sin(pulseProgress * Math.PI * 2),
            [-1, 1],
            [0.03, 0.12]
          ) * entrance;

          return (
            <line
              key={i}
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke={`url(#rayGradient${i})`}
              strokeWidth={2}
              opacity={opacity}
            />
          );
        })}
        {/* Gradient definitions for rays */}
        <defs>
          {Array.from({ length: rayCount }).map((_, i) => (
            <linearGradient
              key={i}
              id={`rayGradient${i}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor={colors.accent} stopOpacity={0.8} />
              <stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
      </svg>
    </AbsoluteFill>
  );
};

/**
 * Particles that are attracted toward the center
 */
type AttractingParticle = {
  id: number;
  startX: number;
  startY: number;
  size: number;
  speed: number;
  angle: number;
  delay: number;
  opacity: number;
};

const AttractingParticles = ({
  count = 40,
  seed = "attract",
}: {
  count?: number;
  seed?: string;
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const centerX = width / 2;
  const centerY = height / 2;

  // Generate particles that spawn from edges and move toward center
  const particles = useMemo<AttractingParticle[]>(() => {
    return Array.from({ length: count }).map((_, i) => {
      // Spawn from edge of screen
      const angle = random(`${seed}-angle-${i}`) * Math.PI * 2;
      const distance = Math.max(width, height) * (0.5 + random(`${seed}-dist-${i}`) * 0.3);

      return {
        id: i,
        startX: centerX + Math.cos(angle) * distance,
        startY: centerY + Math.sin(angle) * distance,
        size: 2 + random(`${seed}-size-${i}`) * 4,
        speed: 0.3 + random(`${seed}-speed-${i}`) * 0.5,
        angle,
        delay: random(`${seed}-delay-${i}`) * durationInFrames * 0.5,
        opacity: 0.3 + random(`${seed}-opacity-${i}`) * 0.5,
      };
    });
  }, [count, seed, width, height, centerX, centerY, durationInFrames]);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {particles.map((particle) => {
        // Calculate particle journey
        const journeyDuration = fps * 8;
        const particleFrame = (frame + particle.delay) % journeyDuration;
        const journeyProgress = particleFrame / journeyDuration;

        // Eased movement toward center
        const easedProgress = Easing.in(Easing.quad)(journeyProgress);

        // Current position - moving from start toward center
        const currentX = interpolate(easedProgress, [0, 1], [particle.startX, centerX]);
        const currentY = interpolate(easedProgress, [0, 1], [particle.startY, centerY]);

        // Distance from center for opacity calculation
        const distFromCenter = Math.sqrt(
          Math.pow(currentX - centerX, 2) + Math.pow(currentY - centerY, 2)
        );
        const maxDist = Math.max(width, height) * 0.7;

        // Fade in from edge, fade out near center
        const fadeOpacity = interpolate(
          distFromCenter,
          [50, 150, maxDist * 0.7, maxDist],
          [0, particle.opacity, particle.opacity * 0.8, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        // Size increases slightly as particle approaches center
        const sizeMultiplier = interpolate(easedProgress, [0, 1], [0.8, 1.3]);

        // Add subtle wobble
        const wobbleX = Math.sin(frame * 0.1 + particle.id) * 3;
        const wobbleY = Math.cos(frame * 0.08 + particle.id * 1.5) * 3;

        return (
          <div
            key={particle.id}
            style={{
              position: "absolute",
              left: currentX + wobbleX,
              top: currentY + wobbleY,
              width: particle.size * sizeMultiplier,
              height: particle.size * sizeMultiplier,
              borderRadius: "50%",
              backgroundColor: colors.accent,
              opacity: fadeOpacity,
              boxShadow: `0 0 ${particle.size * 3}px ${colors.accent}60`,
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * Small floating accent elements around the scene
 */
const FloatingElements = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const elements = [
    { x: width * 0.12, y: height * 0.2, size: 8, delay: 0 },
    { x: width * 0.88, y: height * 0.25, size: 6, delay: fps * 0.2 },
    { x: width * 0.15, y: height * 0.75, size: 10, delay: fps * 0.4 },
    { x: width * 0.85, y: height * 0.8, size: 7, delay: fps * 0.6 },
    { x: width * 0.08, y: height * 0.45, size: 5, delay: fps * 0.8 },
    { x: width * 0.92, y: height * 0.5, size: 9, delay: fps },
    { x: width * 0.25, y: height * 0.15, size: 4, delay: fps * 1.2 },
    { x: width * 0.75, y: height * 0.85, size: 6, delay: fps * 1.4 },
  ];

  return (
    <>
      {elements.map((el, i) => {
        const entrance = spring({
          frame: frame - el.delay,
          fps,
          config: springConfigs.bouncy,
        });

        // Orbital floating motion
        const floatY = Math.sin(frame * 0.025 + i * 2.5) * 20;
        const floatX = Math.cos(frame * 0.018 + i * 1.8) * 15;

        // Subtle pulse
        const pulse = 1 + Math.sin(frame * 0.05 + i * 3) * 0.15;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: el.x + floatX,
              top: el.y + floatY,
              width: el.size * pulse,
              height: el.size * pulse,
              borderRadius: "50%",
              backgroundColor: colors.accent,
              opacity: entrance * 0.5,
              transform: `scale(${entrance})`,
              boxShadow: `0 0 ${el.size * 2.5}px ${colors.accent}70`,
            }}
          />
        );
      })}
    </>
  );
};
