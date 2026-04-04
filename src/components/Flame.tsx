import { useFlameState } from '../hooks/useFlameState';

const FLAME_SVG = {
  idle: { stop1: '#e8a838', stop2: '#c05020', opacity: 0.85 },
  active: { stop1: '#ffd060', stop2: '#e8a838', opacity: 1 },
  complete: { stop1: '#90c858', stop2: '#40a828', opacity: 1 },
  error: { stop1: '#5a3020', stop2: '#3a1810', opacity: 0.5 },
} as const;

export function Flame() {
  const state = useFlameState();
  const colors = FLAME_SVG[state];
  return (
    <svg
      width="16" height="20"
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`forge-flame forge-flame--${state}`}
      aria-hidden="true"
      title="Forge"
      style={{ opacity: colors.opacity }}
    >
      <defs>
        <linearGradient id={`flame-grad-${state}`} x1="8" y1="0" x2="8" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={colors.stop1} />
          <stop offset="100%" stopColor={colors.stop2} />
        </linearGradient>
      </defs>
      {/* Outer flame body */}
      <path
        d="M8 1 C8 1 13 6 13 11 C13 15.4 10.8 18 8 19 C5.2 18 3 15.4 3 11 C3 6 8 1 8 1Z"
        fill={`url(#flame-grad-${state})`}
      />
      {/* Inner highlight */}
      <path
        d="M8 6 C8 6 11 9.5 11 12 C11 14.2 9.7 15.5 8 16 C6.3 15.5 5 14.2 5 12 C5 9.5 8 6 8 6Z"
        fill={colors.stop1}
        opacity="0.4"
      />
    </svg>
  );
}
