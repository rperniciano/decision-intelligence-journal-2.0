import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, springConfigs } from "../../lib/designSystem";
import { SoundWave, SoundRipple } from "../../components/SoundWave";

/**
 * Speak Animation - Step 1 video
 * Shows microphone icon with animated sound waves
 * Duration: 6 seconds at 30fps = 180 frames (looping)
 */
export const SpeakAnimation = () => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  // Background gradient
  const gradientProgress = interpolate(
    frame,
    [0, durationInFrames],
    [0, 360]
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${135 + Math.sin(gradientProgress * 0.01) * 10}deg, ${colors.bgDeep} 0%, ${colors.bgGradient} 100%)`,
      }}
    >
      {/* Ambient background glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.accent}15 0%, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />

      {/* Sound ripples */}
      <Sequence from={fps * 0.5} premountFor={fps}>
        <AbsoluteFill className="flex items-center justify-center">
          <SoundRipple
            rings={4}
            maxRadius={180}
            delay={0.5}
            color={colors.accent}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Central microphone icon */}
      <Sequence from={0} premountFor={fps}>
        <AbsoluteFill className="flex items-center justify-center">
          <MicrophoneIcon />
        </AbsoluteFill>
      </Sequence>

      {/* Sound wave bars */}
      <Sequence from={fps * 0.3} premountFor={fps}>
        <AbsoluteFill className="flex items-center justify-center">
          <div style={{ marginTop: 140 }}>
            <SoundWave
              bars={5}
              width={120}
              height={50}
              delay={0.3}
              color={colors.accent}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Floating words */}
      <Sequence from={fps} premountFor={fps}>
        <FloatingWords />
      </Sequence>
    </AbsoluteFill>
  );
};

/**
 * Animated microphone icon
 */
const MicrophoneIcon = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: springConfigs.bouncy,
  });

  // Subtle pulse
  const pulse = Math.sin(frame * 0.1) * 0.05 + 1;

  return (
    <div
      style={{
        width: 80,
        height: 80,
        borderRadius: "50%",
        backgroundColor: `${colors.accent}20`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${entrance * pulse})`,
        opacity: entrance,
        boxShadow: `0 0 40px ${colors.accent}40`,
      }}
    >
      <svg
        width={40}
        height={40}
        viewBox="0 0 24 24"
        fill="none"
        stroke={colors.accent}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    </div>
  );
};

/**
 * Words that float up and fade
 */
const FloatingWords = () => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const words = ["thinking...", "considering", "weighing", "deciding"];
  const cycleDuration = fps * 3;

  return (
    <>
      {words.map((word, i) => {
        const wordDelay = (i / words.length) * cycleDuration;
        const cycleFrame =
          (frame - fps + durationInFrames - wordDelay) % durationInFrames;
        const progress = cycleFrame / cycleDuration;

        if (progress < 0 || progress > 1) return null;

        const y = interpolate(progress, [0, 1], [height * 0.6, height * 0.2]);
        const x = width * 0.5 + Math.sin(i * 2) * 60;
        const opacity = interpolate(
          progress,
          [0, 0.2, 0.8, 1],
          [0, 0.7, 0.7, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return (
          <div
            key={`${word}-${i}`}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: "translateX(-50%)",
              color: colors.textSecondary,
              fontSize: 14,
              fontStyle: "italic",
              opacity,
            }}
          >
            {word}
          </div>
        );
      })}
    </>
  );
};
