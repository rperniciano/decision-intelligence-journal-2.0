import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, springConfigs } from "../lib/designSystem";

type SoundWaveProps = {
  bars?: number;
  width?: number;
  height?: number;
  delay?: number;
  active?: boolean;
  color?: string;
};

export const SoundWave = ({
  bars = 5,
  width = 100,
  height = 60,
  delay = 0,
  active = true,
  color = colors.accent,
}: SoundWaveProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const delayFrames = delay * fps;

  // Entrance animation
  const entrance = spring({
    frame: frame - delayFrames,
    fps,
    config: springConfigs.snappy,
  });

  const barWidth = width / (bars * 2 - 1);
  const gap = barWidth;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap,
        height,
        opacity: entrance,
        transform: `scale(${entrance})`,
      }}
    >
      {Array.from({ length: bars }).map((_, i) => {
        // Create wave pattern with different frequencies for each bar
        const frequency = 0.15 + i * 0.05;
        const phaseOffset = i * 0.8;
        const baseHeight = 0.3 + Math.abs(i - Math.floor(bars / 2)) * 0.1;

        // Animate height based on frame
        const waveProgress = active
          ? Math.sin((frame - delayFrames) * frequency + phaseOffset)
          : 0;

        const barHeight = interpolate(
          waveProgress,
          [-1, 1],
          [baseHeight * height, height * 0.9]
        );

        // Glow intensity follows height
        const glowIntensity = interpolate(waveProgress, [-1, 1], [0.3, 1]);

        return (
          <div
            key={i}
            style={{
              width: barWidth,
              height: barHeight,
              backgroundColor: color,
              borderRadius: barWidth / 2,
              boxShadow: `0 0 ${10 * glowIntensity}px ${color}80`,
            }}
          />
        );
      })}
    </div>
  );
};

/**
 * Circular sound wave ripples emanating outward
 */
type SoundRippleProps = {
  rings?: number;
  maxRadius?: number;
  delay?: number;
  color?: string;
};

export const SoundRipple = ({
  rings = 3,
  maxRadius = 100,
  delay = 0,
  color = colors.accent,
}: SoundRippleProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const delayFrames = delay * fps;
  const cycleDuration = fps * 2; // 2 second cycle

  return (
    <div
      style={{
        position: "relative",
        width: maxRadius * 2,
        height: maxRadius * 2,
      }}
    >
      {Array.from({ length: rings }).map((_, i) => {
        // Stagger each ring
        const ringDelay = (i / rings) * cycleDuration;
        const progress =
          ((frame - delayFrames + cycleDuration - ringDelay) % cycleDuration) /
          cycleDuration;

        const radius = interpolate(progress, [0, 1], [0, maxRadius]);
        const opacity = interpolate(progress, [0, 0.2, 1], [0, 0.6, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: radius * 2,
              height: radius * 2,
              borderRadius: "50%",
              border: `2px solid ${color}`,
              opacity,
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}
    </div>
  );
};
