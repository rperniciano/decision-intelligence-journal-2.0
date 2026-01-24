import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, springConfigs } from "../../lib/designSystem";

/**
 * Patterns Animation - Step 3 video
 * Shows data points connecting to reveal patterns
 * Duration: 6 seconds at 30fps = 180 frames (looping)
 */
export const PatternsAnimation = () => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${colors.bgDeep} 0%, ${colors.bgGradient} 100%)`,
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 350,
          height: 350,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.accent}10 0%, transparent 70%)`,
          filter: "blur(50px)",
        }}
      />

      {/* Mini chart */}
      <Sequence from={0} premountFor={fps}>
        <AbsoluteFill className="flex items-center justify-center">
          <MiniChart />
        </AbsoluteFill>
      </Sequence>

      {/* Data points connecting */}
      <Sequence from={fps * 0.5} premountFor={fps}>
        <ConnectingDataPoints />
      </Sequence>

      {/* Insight lightbulb moment */}
      <Sequence from={fps * 3} premountFor={fps}>
        <InsightMoment />
      </Sequence>

      {/* Pattern icon */}
      <Sequence from={fps * 0.2} premountFor={fps}>
        <AbsoluteFill className="flex items-center justify-center">
          <div style={{ marginTop: -120 }}>
            <PatternIcon />
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

/**
 * Central pattern/chart icon
 */
const PatternIcon = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame: frame - fps * 0.2,
    fps,
    config: springConfigs.bouncy,
  });

  return (
    <div
      style={{
        width: 60,
        height: 60,
        borderRadius: "50%",
        backgroundColor: `${colors.accent}20`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${entrance})`,
        opacity: entrance,
        boxShadow: `0 0 30px ${colors.accent}40`,
      }}
    >
      <svg
        width={32}
        height={32}
        viewBox="0 0 24 24"
        fill="none"
        stroke={colors.accent}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 12l3-3 3 3 4-4" />
        <path d="M8 21l4-4 4 4" />
        <path d="M3 4h18" />
        <path d="M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    </div>
  );
};

/**
 * Animated mini line chart
 */
const MiniChart = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const chartWidth = 200;
  const chartHeight = 100;

  // Data points for the chart
  const dataPoints = [
    { x: 0, y: 60 },
    { x: 40, y: 35 },
    { x: 80, y: 50 },
    { x: 120, y: 25 },
    { x: 160, y: 40 },
    { x: 200, y: 15 },
  ];

  // Animate the line drawing
  const cycleDuration = fps * 4;
  const cycleFrame = frame % cycleDuration;
  const drawProgress = interpolate(
    cycleFrame,
    [0, cycleDuration * 0.6, cycleDuration * 0.9, cycleDuration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Create SVG path
  const pathData = dataPoints
    .map((point, i) => {
      const command = i === 0 ? "M" : "L";
      return `${command} ${point.x} ${point.y}`;
    })
    .join(" ");

  // Calculate path length for animation
  const pathLength = 300; // Approximate

  return (
    <div
      style={{
        position: "relative",
        width: chartWidth,
        height: chartHeight,
        marginTop: 60,
      }}
    >
      {/* Grid lines */}
      <svg
        width={chartWidth}
        height={chartHeight}
        style={{ position: "absolute", opacity: 0.2 }}
      >
        {[0, 25, 50, 75, 100].map((y) => (
          <line
            key={y}
            x1={0}
            y1={y}
            x2={chartWidth}
            y2={y}
            stroke={colors.textSecondary}
            strokeWidth={1}
          />
        ))}
      </svg>

      {/* Animated line */}
      <svg
        width={chartWidth}
        height={chartHeight}
        style={{ position: "absolute" }}
      >
        <path
          d={pathData}
          fill="none"
          stroke={colors.accent}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength * (1 - drawProgress)}
        />
      </svg>

      {/* Data points */}
      {dataPoints.map((point, i) => {
        const pointDelay = (i / dataPoints.length) * 0.6;
        const pointProgress = interpolate(
          drawProgress,
          [pointDelay, pointDelay + 0.1],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: point.x - 4,
              top: point.y - 4,
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: colors.accent,
              transform: `scale(${pointProgress})`,
              boxShadow: `0 0 8px ${colors.accent}80`,
            }}
          />
        );
      })}
    </div>
  );
};

/**
 * Data points that connect with lines
 */
const ConnectingDataPoints = () => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const points = [
    { x: width * 0.15, y: height * 0.25 },
    { x: width * 0.85, y: height * 0.3 },
    { x: width * 0.2, y: height * 0.75 },
    { x: width * 0.8, y: height * 0.8 },
    { x: width * 0.5, y: height * 0.5 },
  ];

  // Connections between points
  const connections = [
    [0, 4],
    [1, 4],
    [2, 4],
    [3, 4],
    [0, 2],
    [1, 3],
  ];

  const cycleDuration = fps * 4;
  const cycleFrame = (frame - fps * 0.5) % cycleDuration;
  const progress = cycleFrame / cycleDuration;

  return (
    <>
      {/* Connection lines */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {connections.map(([from, to], i) => {
          const lineDelay = i * 0.08;
          const lineProgress = interpolate(
            progress,
            [lineDelay, lineDelay + 0.15, 0.85, 1],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <line
              key={`${from}-${to}`}
              x1={points[from].x}
              y1={points[from].y}
              x2={points[to].x}
              y2={points[to].y}
              stroke={colors.accent}
              strokeWidth={1}
              opacity={lineProgress * 0.4}
            />
          );
        })}
      </svg>

      {/* Points */}
      {points.map((point, i) => {
        const pointDelay = i * 0.05;
        const pointProgress = interpolate(
          progress,
          [pointDelay, pointDelay + 0.1, 0.9, 1],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        const size = i === 4 ? 10 : 6; // Center point is larger

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: point.x - size / 2,
              top: point.y - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              backgroundColor: i === 4 ? colors.accent : colors.textSecondary,
              transform: `scale(${pointProgress})`,
              boxShadow:
                i === 4
                  ? `0 0 15px ${colors.accent}80`
                  : `0 0 8px ${colors.textSecondary}40`,
            }}
          />
        );
      })}
    </>
  );
};

/**
 * Insight "aha" moment with lightbulb
 */
const InsightMoment = () => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const cycleDuration = fps * 4;
  const cycleFrame = (frame - fps * 3) % cycleDuration;
  const progress = cycleFrame / cycleDuration;

  // Lightbulb appears briefly
  const bulbProgress = interpolate(
    progress,
    [0, 0.1, 0.3, 0.5],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const scale = interpolate(bulbProgress, [0, 1], [0.5, 1]);

  return (
    <div
      style={{
        position: "absolute",
        right: width * 0.15,
        top: height * 0.15,
        transform: `scale(${scale})`,
        opacity: bulbProgress,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          backgroundColor: colors.warning,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 30px ${colors.warning}80`,
        }}
      >
        <svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          stroke={colors.bgDeep}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14" />
        </svg>
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 10,
          color: colors.warning,
          textAlign: "center",
          fontWeight: 600,
        }}
      >
        Insight!
      </div>
    </div>
  );
};
