import { useEffect, useState } from 'react';
import RentelioLogo from './RentelioLogo';

/**
 * Premium splash: entrance → hold → expand into app → reveal auth.
 */
export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('enter'); // enter | hold | expand | exit

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('hold'), 350),
      setTimeout(() => setPhase('expand'), 800),
      setTimeout(() => setPhase('exit'), 1650),
      setTimeout(() => onComplete?.(), 2050),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div
      className={`splash-root fixed inset-0 z-[100] flex items-center justify-center overflow-hidden
        ${phase === 'exit' ? 'splash-exit' : ''}`}
      role="presentation"
      aria-hidden={phase === 'exit'}
    >
      {/* Purple–black gradient base */}
      <div className="absolute inset-0 splash-bg" />

      {/* Soft glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="splash-orb splash-orb-a" />
        <div className="splash-orb splash-orb-b" />
      </div>

      {/* Expanding logo stage */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center
          splash-logo-stage splash-logo-${phase}`}
      >
        <div className="splash-glow-ring" />
        <RentelioLogo
          size="xl"
          centered
          spin
          showTagline
          colorClass="text-white"
          taglineClass="splash-tagline"
        />
      </div>
    </div>
  );
}
