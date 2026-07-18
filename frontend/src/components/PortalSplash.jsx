import { useEffect, useState } from 'react';
import RentelioLogo from './RentelioLogo';

/**
 * Short portal entry bloom — plays every time the portal shell mounts (e.g. after login).
 */
export default function PortalSplash({ portal = 'app', label = 'Rentelio' }) {
  const [phase, setPhase] = useState('enter');

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('bloom'), 280),
      setTimeout(() => setPhase('settle'), 780),
      setTimeout(() => setPhase('done'), 1200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [portal]);

  if (phase === 'done') return null;

  return (
    <div
      className={`portal-bloom fixed inset-0 z-[90] flex items-center justify-center overflow-hidden
        ${phase === 'settle' ? 'portal-bloom--out' : ''}`}
      role="presentation"
      aria-hidden="true"
    >
      <div className="absolute inset-0 portal-bloom__veil" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="portal-bloom__orb portal-bloom__orb--a" />
        <div className="portal-bloom__orb portal-bloom__orb--b" />
        <div className={`portal-bloom__ring ${phase === 'bloom' || phase === 'settle' ? 'portal-bloom__ring--go' : ''}`} />
      </div>

      <div
        className={`relative z-10 flex flex-col items-center
          ${phase === 'enter' ? 'portal-bloom__mark--in' : ''}
          ${phase === 'bloom' ? 'portal-bloom__mark--pulse' : ''}
          ${phase === 'settle' ? 'portal-bloom__mark--out' : ''}`}
      >
        <RentelioLogo
          size="lg"
          centered
          spin
          colorClass="text-white"
          showTagline
          taglineClass="!text-brand-300"
        />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.28em] text-white/55">
          {label}
        </p>
      </div>
    </div>
  );
}
