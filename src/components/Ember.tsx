import { useState, useCallback, useRef, useEffect } from 'react';
import { useEmberState } from '../hooks/useEmberState';
import { EmberTooltip } from './EmberTooltip';

const STORAGE_KEY = 'forge-ember-position';

function loadPosition(): { x: number; y: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { x: number; y: number };
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

function savePosition(x: number, y: number): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y }));
}

// Mouth path by state
function getMouth(state: string): string {
  switch (state) {
    case 'active': return 'M18,30 Q24,35 30,30'; // open circle
    case 'thinking': return 'M18,30 Q21,33 24,30 Q27,27 30,30'; // wavy
    case 'done': return 'M18,28 Q24,34 30,28'; // big smile
    case 'error': return 'M18,32 Q24,28 30,32'; // frown
    default: return 'M19,30 Q24,33 29,30'; // gentle smile
  }
}

// Eye shape by state
function getEyes(state: string): { ly: number; ry: number; pupilSize: number; lookUp: boolean; squint: boolean } {
  switch (state) {
    case 'active': return { ly: 18, ry: 18, pupilSize: 2.5, lookUp: false, squint: false };
    case 'thinking': return { ly: 17, ry: 17, pupilSize: 2, lookUp: true, squint: false };
    case 'done': return { ly: 20, ry: 20, pupilSize: 0, lookUp: false, squint: true };
    case 'error': return { ly: 20, ry: 20, pupilSize: 1.5, lookUp: false, squint: true };
    default: return { ly: 19, ry: 19, pupilSize: 2, lookUp: false, squint: false };
  }
}

export function Ember() {
  const state = useEmberState();
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [offset, setOffset] = useState<{ x: number; y: number }>(() => loadPosition() ?? { x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragMoved = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragging.current = true;
    dragMoved.current = false;
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  }, [offset]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      dragMoved.current = true;
      const newX = e.clientX - dragStart.current.x;
      const newY = e.clientY - dragStart.current.y;
      setOffset({ x: newX, y: newY });
    };
    const handleMouseUp = () => {
      if (dragging.current) {
        dragging.current = false;
        if (dragMoved.current) {
          setOffset((prev) => {
            savePosition(prev.x, prev.y);
            return prev;
          });
        }
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleClick = useCallback(() => {
    if (!dragMoved.current) {
      setTooltipOpen((prev) => !prev);
    }
  }, []);

  const handleDismissTooltip = useCallback(() => {
    setTooltipOpen(false);
  }, []);

  const mouth = getMouth(state);
  const eyes = getEyes(state);

  return (
    <div
      className={`ember ember--${state}`}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {tooltipOpen && (
        <EmberTooltip state={state} onDismiss={handleDismissTooltip} />
      )}
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="ember-body-grad" x1="24" y1="4" x2="24" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffd060" />
            <stop offset="50%" stopColor="#e8a838" />
            <stop offset="100%" stopColor="#c05020" />
          </linearGradient>
          <filter id="ember-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Body: flame-shaped blob */}
        <path
          d="M24 4 C24 4 38 14 38 26 C38 36 32 44 24 44 C16 44 10 36 10 26 C10 14 24 4 24 4Z"
          fill="url(#ember-body-grad)"
          filter="url(#ember-glow)"
        />

        {/* Inner highlight */}
        <path
          d="M24 12 C24 12 33 20 33 28 C33 34 29 38 24 38 C19 38 15 34 15 28 C15 20 24 12 24 12Z"
          fill="#ffd060"
          opacity="0.3"
        />

        {/* Eyes */}
        {eyes.squint ? (
          <>
            {/* Happy crescent / half-closed eyes */}
            <path d="M17,19 Q19,17 21,19" stroke="#2a1608" strokeWidth="1.5" fill="none" />
            <path d="M27,19 Q29,17 31,19" stroke="#2a1608" strokeWidth="1.5" fill="none" />
          </>
        ) : (
          <>
            {/* White sclera */}
            <circle cx="19" cy={eyes.ly} r="3.5" fill="white" />
            <circle cx="29" cy={eyes.ry} r="3.5" fill="white" />
            {/* Pupils */}
            <circle cx="19" cy={eyes.lookUp ? eyes.ly - 1 : eyes.ly} r={eyes.pupilSize} fill="#2a1608" />
            <circle cx="29" cy={eyes.lookUp ? eyes.ry - 1 : eyes.ry} r={eyes.pupilSize} fill="#2a1608" />
          </>
        )}

        {/* Mouth */}
        <path d={mouth} stroke="#2a1608" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}
