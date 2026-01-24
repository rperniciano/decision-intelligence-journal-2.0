import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, springConfigs } from "../lib/designSystem";

type TextRevealProps = {
  text: string;
  delay?: number;
  fontSize?: number;
  color?: string;
  className?: string;
  charDelay?: number; // Delay between each character in seconds
};

/**
 * Typewriter-style text reveal animation
 */
export const TextReveal = ({
  text,
  delay = 0,
  fontSize = 24,
  color = colors.textPrimary,
  className = "",
  charDelay = 0.03,
}: TextRevealProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const delayFrames = delay * fps;
  const charDelayFrames = charDelay * fps;

  // Calculate how many characters to show
  const elapsedFrames = Math.max(0, frame - delayFrames);
  const charsToShow = Math.min(
    text.length,
    Math.floor(elapsedFrames / charDelayFrames)
  );

  const visibleText = text.slice(0, charsToShow);

  // Cursor blink
  const cursorVisible =
    charsToShow < text.length ? Math.floor(frame / 15) % 2 === 0 : false;

  return (
    <span
      className={className}
      style={{
        fontSize,
        color,
        fontFamily: "inherit",
      }}
    >
      {visibleText}
      {cursorVisible && (
        <span style={{ color: colors.accent, marginLeft: 2 }}>|</span>
      )}
    </span>
  );
};

/**
 * Word-by-word reveal with spring animation
 */
type WordRevealProps = {
  text: string;
  delay?: number;
  fontSize?: number;
  color?: string;
  className?: string;
  wordDelay?: number; // Delay between each word in seconds
};

export const WordReveal = ({
  text,
  delay = 0,
  fontSize = 24,
  color = colors.textPrimary,
  className = "",
  wordDelay = 0.1,
}: WordRevealProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = text.split(" ");
  const delayFrames = delay * fps;
  const wordDelayFrames = wordDelay * fps;

  return (
    <span
      className={className}
      style={{
        fontSize,
        color,
        fontFamily: "inherit",
        display: "inline-flex",
        flexWrap: "wrap",
        gap: "0.3em",
      }}
    >
      {words.map((word, i) => {
        const wordStartFrame = delayFrames + i * wordDelayFrames;

        const entrance = spring({
          frame: frame - wordStartFrame,
          fps,
          config: springConfigs.snappy,
        });

        const translateY = interpolate(entrance, [0, 1], [20, 0]);
        const opacity = entrance;

        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transform: `translateY(${translateY}px)`,
              opacity,
            }}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
};

/**
 * Fade in text with optional gradient highlight
 */
type FadeTextProps = {
  text: string;
  delay?: number;
  fontSize?: number;
  color?: string;
  highlightColor?: string;
  className?: string;
};

export const FadeText = ({
  text,
  delay = 0,
  fontSize = 24,
  color = colors.textPrimary,
  highlightColor,
  className = "",
}: FadeTextProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame: frame - delay * fps,
    fps,
    config: springConfigs.smooth,
  });

  const translateY = interpolate(entrance, [0, 1], [10, 0]);

  return (
    <span
      className={className}
      style={{
        fontSize,
        color: highlightColor || color,
        fontFamily: "inherit",
        display: "inline-block",
        transform: `translateY(${translateY}px)`,
        opacity: entrance,
        ...(highlightColor && {
          background: `linear-gradient(135deg, ${highlightColor}, ${colors.accent700})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }),
      }}
    >
      {text}
    </span>
  );
};
