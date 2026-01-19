/**
 * SkipLink component for keyboard accessibility
 *
 * This component provides a "Skip to main content" link that:
 * - Is visually hidden by default (off-screen)
 * - Becomes visible when focused via keyboard (Tab)
 * - Allows keyboard users to skip navigation and jump directly to main content
 *
 * Usage: Add <SkipLink /> at the very beginning of page components
 * and ensure the main content has id="main-content"
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-bg-deep focus:rounded-lg focus:font-medium focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent-400 focus:ring-offset-2 focus:ring-offset-bg-deep"
    >
      Skip to main content
    </a>
  );
}

export default SkipLink;
