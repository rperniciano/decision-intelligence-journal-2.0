import { useEffect, useState } from 'react';

type VideoBackgroundProps = {
  /** Base name of video file without extension (e.g., "hero-animation") */
  src: string;
  /** Optional className for the container */
  className?: string;
  /** Whether the video is decorative (hidden from screen readers) */
  decorative?: boolean;
  /** Fallback content when video can't play */
  fallback?: React.ReactNode;
  /** Opacity of the video (0-1) */
  opacity?: number;
};

/**
 * VideoBackground component for rendering looping background videos
 * Respects prefers-reduced-motion and provides WebM/MP4 fallback
 */
export const VideoBackground = ({
  src,
  className = '',
  decorative = true,
  fallback,
  opacity = 1,
}: VideoBackgroundProps) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Don't render video if user prefers reduced motion or there's an error
  if (prefersReducedMotion || hasError) {
    return fallback ? <>{fallback}</> : null;
  }

  const webmSrc = `/videos/${src}.webm`;
  const mp4Src = `/videos/${src}.mp4`;

  return (
    <div
      className={`absolute inset-0 overflow-hidden ${className}`}
      aria-hidden={decorative}
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        onError={() => setHasError(true)}
        style={{ opacity }}
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={webmSrc} type="video/webm" />
        <source src={mp4Src} type="video/mp4" />
      </video>
    </div>
  );
};

type StepVideoProps = {
  /** Base name of video file without extension */
  src: string;
  /** Size of the video container */
  size?: number;
  /** Optional className */
  className?: string;
};

/**
 * StepVideo component for inline step animation videos
 */
export const StepVideo = ({
  src,
  size = 200,
  className = '',
}: StepVideoProps) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Return placeholder if reduced motion or error
  if (prefersReducedMotion || hasError) {
    return (
      <div
        className={`rounded-xl bg-accent/10 ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    );
  }

  const webmSrc = `/videos/${src}.webm`;
  const mp4Src = `/videos/${src}.mp4`;

  return (
    <div
      className={`overflow-hidden rounded-xl ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
      >
        <source src={webmSrc} type="video/webm" />
        <source src={mp4Src} type="video/mp4" />
      </video>
    </div>
  );
};
