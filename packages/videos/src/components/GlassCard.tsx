import { ReactNode } from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, springConfigs } from "../lib/designSystem";

type GlassCardProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  width?: number | string;
  height?: number | string;
  glowOnEntrance?: boolean;
};

export const GlassCard = ({
  children,
  delay = 0,
  className = "",
  width = "auto",
  height = "auto",
  glowOnEntrance = true,
}: GlassCardProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const delayFrames = delay * fps;

  // Entrance scale and opacity
  const entrance = spring({
    frame: frame - delayFrames,
    fps,
    config: springConfigs.snappy,
  });

  // Y translation for slide-up effect
  const translateY = interpolate(entrance, [0, 1], [20, 0]);

  // Glow effect that fades after entrance
  const glowOpacity = glowOnEntrance
    ? interpolate(frame - delayFrames, [0, fps * 0.5, fps * 1.5], [0, 0.6, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <div
      className={className}
      style={{
        width,
        height,
        padding: "24px",
        borderRadius: "16px",
        background: colors.surface,
        backdropFilter: "blur(20px)",
        border: `1px solid rgba(255, 255, 255, 0.1)`,
        transform: `translateY(${translateY}px)`,
        opacity: entrance,
        boxShadow: glowOnEntrance
          ? `0 0 30px ${colors.accent}${Math.round(glowOpacity * 255)
              .toString(16)
              .padStart(2, "0")}`
          : "none",
      }}
    >
      {children}
    </div>
  );
};
