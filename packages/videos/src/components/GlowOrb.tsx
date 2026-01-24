import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, springConfigs } from "../lib/designSystem";

type GlowOrbProps = {
  size?: number;
  delay?: number;
  pulseIntensity?: number;
};

export const GlowOrb = ({
  size = 96,
  delay = 0,
  pulseIntensity = 0.1,
}: GlowOrbProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance animation
  const entrance = spring({
    frame: frame - delay * fps,
    fps,
    config: springConfigs.bouncy,
  });

  // Continuous pulse animation (loop every 3 seconds)
  const pulseCycle = (frame / fps) % 3;
  const pulseProgress = Math.sin((pulseCycle / 3) * Math.PI * 2);
  const scale = 1 + pulseProgress * pulseIntensity;
  const opacity = interpolate(pulseProgress, [-1, 1], [0.85, 1]);

  // Glow intensity follows the pulse
  const glowSize = interpolate(pulseProgress, [-1, 1], [30, 50]);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accent700} 100%)`,
        transform: `scale(${entrance * scale})`,
        opacity: entrance * opacity,
        boxShadow: `
          0 0 ${glowSize}px ${colors.accent}80,
          0 0 ${glowSize * 2}px ${colors.accent}40,
          0 0 ${glowSize * 3}px ${colors.accent}20
        `,
      }}
    />
  );
};

/**
 * Centered GlowOrb with absolute positioning
 */
export const CenteredGlowOrb = (props: GlowOrbProps) => {
  return (
    <AbsoluteFill className="flex items-center justify-center">
      <GlowOrb {...props} />
    </AbsoluteFill>
  );
};
