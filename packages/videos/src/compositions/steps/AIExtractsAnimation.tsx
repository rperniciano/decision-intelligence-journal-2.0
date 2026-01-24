import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, springConfigs } from "../../lib/designSystem";
import { GlassCard } from "../../components/GlassCard";
import { NetworkParticleField } from "../../components/ParticleField";

/**
 * AI Extracts Animation - Step 2 video
 * Shows text transforming into structured data cards
 * Duration: 6 seconds at 30fps = 180 frames (looping)
 */
export const AIExtractsAnimation = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${colors.bgDeep} 0%, ${colors.bgGradient} 100%)`,
      }}
    >
      {/* Neural network background */}
      <Sequence from={0} premountFor={fps}>
        <div style={{ opacity: 0.4 }}>
          <NetworkParticleField
            count={15}
            color={colors.accent}
            connectionDistance={120}
            connectionOpacity={0.3}
            speed={0.2}
            seed="ai-network"
          />
        </div>
      </Sequence>

      {/* Central AI icon */}
      <Sequence from={0} premountFor={fps}>
        <AbsoluteFill className="flex items-center justify-center">
          <AIIcon />
        </AbsoluteFill>
      </Sequence>

      {/* Raw text transforming */}
      <Sequence from={fps * 0.5} premountFor={fps}>
        <RawTextToStructured />
      </Sequence>

      {/* Extracted data cards */}
      <Sequence from={fps * 2} premountFor={fps}>
        <ExtractedCards />
      </Sequence>
    </AbsoluteFill>
  );
};

/**
 * AI brain/lightbulb icon
 */
const AIIcon = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: springConfigs.bouncy,
  });

  // Pulsing glow
  const glowIntensity = interpolate(
    Math.sin(frame * 0.15),
    [-1, 1],
    [0.4, 0.8]
  );

  return (
    <div
      style={{
        width: 70,
        height: 70,
        borderRadius: "50%",
        backgroundColor: `${colors.accent}25`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${entrance})`,
        opacity: entrance,
        boxShadow: `0 0 ${30 * glowIntensity}px ${colors.accent}60`,
      }}
    >
      <svg
        width={36}
        height={36}
        viewBox="0 0 24 24"
        fill="none"
        stroke={colors.accent}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    </div>
  );
};

/**
 * Text that transforms into structured format
 */
const RawTextToStructured = () => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const cycleDuration = fps * 4;
  const cycleFrame = frame % cycleDuration;
  const progress = cycleFrame / cycleDuration;

  // Raw text fades out
  const rawOpacity = interpolate(
    progress,
    [0, 0.2, 0.4],
    [0, 0.8, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Structured text fades in
  const structuredOpacity = interpolate(
    progress,
    [0.3, 0.5, 0.9, 1],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const rawText = '"Should I take the new job offer..."';
  const structuredItems = ["Option A", "Option B", "Pros", "Cons"];

  return (
    <>
      {/* Raw text */}
      <div
        style={{
          position: "absolute",
          top: height * 0.15,
          left: "50%",
          transform: "translateX(-50%)",
          color: colors.textSecondary,
          fontSize: 13,
          fontStyle: "italic",
          opacity: rawOpacity,
          textAlign: "center",
          maxWidth: width * 0.8,
        }}
      >
        {rawText}
      </div>

      {/* Structured items appearing */}
      <div
        style={{
          position: "absolute",
          bottom: height * 0.12,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: "center",
          opacity: structuredOpacity,
        }}
      >
        {structuredItems.map((item, i) => {
          const itemDelay = i * 0.1;
          const itemProgress = interpolate(
            progress,
            [0.35 + itemDelay, 0.45 + itemDelay],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <div
              key={item}
              style={{
                padding: "4px 10px",
                borderRadius: 12,
                backgroundColor: `${colors.accent}20`,
                border: `1px solid ${colors.accent}40`,
                color: colors.accent,
                fontSize: 11,
                transform: `scale(${itemProgress})`,
                opacity: itemProgress,
              }}
            >
              {item}
            </div>
          );
        })}
      </div>
    </>
  );
};

/**
 * Small cards representing extracted data
 */
const ExtractedCards = () => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const cards = [
    { label: "Options", value: "2", x: -70, y: -60 },
    { label: "Pros", value: "5", x: 70, y: -60 },
    { label: "Cons", value: "3", x: -70, y: 60 },
    { label: "Mood", value: "Calm", x: 70, y: 60 },
  ];

  const cycleDuration = fps * 4;
  const cycleFrame = (frame - fps * 2) % cycleDuration;
  const cycleProgress = cycleFrame / cycleDuration;

  return (
    <AbsoluteFill className="flex items-center justify-center">
      {cards.map((card, i) => {
        const cardDelay = i * 0.08;
        const entrance = interpolate(
          cycleProgress,
          [cardDelay, cardDelay + 0.15, 0.85, 1],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        const scale = interpolate(entrance, [0, 1], [0.5, 1]);
        const opacity = entrance;

        return (
          <div
            key={card.label}
            style={{
              position: "absolute",
              left: `calc(50% + ${card.x}px)`,
              top: `calc(50% + ${card.y}px)`,
              transform: `translate(-50%, -50%) scale(${scale})`,
              opacity,
              padding: "8px 12px",
              borderRadius: 8,
              backgroundColor: colors.surface,
              border: `1px solid rgba(255, 255, 255, 0.1)`,
              textAlign: "center",
              minWidth: 60,
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: colors.textSecondary,
                marginBottom: 2,
              }}
            >
              {card.label}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: colors.accent,
              }}
            >
              {card.value}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
