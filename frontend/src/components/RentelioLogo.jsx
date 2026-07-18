/**
 * Three-arrow circular loop used as the "O" in Rentelio.
 * Perfectly symmetric: one arrow geometry rotated 0° / 120° / 240°.
 * Represents rental cycle: pickup → usage → return.
 */
export function CycleMark({
  className = 'h-[0.92em] w-[0.92em]',
  color = 'currentColor',
  spin = false,
}) {
  // Shared geometry — arc spans 100° (20° gaps), centered on top when rotation = 0.
  // Circle center (40,40), radius 26. Rotations guarantee equal spacing & size.
  const Arrow = () => (
    <g stroke={color} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* Arc through top: -140° → -40° (CCW), 100° span / 20° gaps */}
      <path d="M 20.083 23.288 A 26 26 0 0 1 59.917 23.288" />
      {/* Arrowhead at arc end — symmetric about the tangent */}
      <path d="M 52.062 21.394 L 59.917 23.288 L 59.416 15.224" />
    </g>
  );

  return (
    <svg
      className={`${className}${spin ? ' cycle-spin' : ''}`}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ verticalAlign: '-0.14em' }}
    >
      <g transform="rotate(0 40 40)">
        <Arrow />
      </g>
      <g transform="rotate(120 40 40)">
        <Arrow />
      </g>
      <g transform="rotate(240 40 40)">
        <Arrow />
      </g>
    </svg>
  );
}

/**
 * Rentelio wordmark — letter "O" replaced by the cycle loop icon.
 */
export default function RentelioLogo({
  size = 'md',
  className = '',
  colorClass = 'text-white',
  showTagline = false,
  taglineClass = '',
  centered = false,
  spin = false,
}) {
  const sizes = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl',
    xl: 'text-6xl md:text-7xl',
    hero: 'text-5xl sm:text-7xl md:text-8xl',
  };

  return (
    <div className={`${centered ? 'text-center' : ''} ${className}`}>
      <div
        className={`font-display font-bold uppercase tracking-[0.06em] leading-none ${sizes[size] || sizes.md} ${colorClass}`}
        aria-label="RENTELIO"
      >
        <span>Renteli</span>
        <CycleMark spin={spin} className="inline-block h-[0.95em] w-[0.95em] mx-[0.02em]" />
      </div>
      {showTagline && (
        <p
          className={`mt-3 font-sans font-medium tracking-[0.04em] text-brand-200/85 ${
            size === 'xl' || size === 'lg' || size === 'hero' ? 'text-sm md:text-base' : 'text-xs'
          } ${taglineClass}`}
        >
          Don&apos;t get Mental, Just do Rental
        </p>
      )}
    </div>
  );
}
