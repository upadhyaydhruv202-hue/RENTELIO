import { useEffect, useState } from 'react';

export default function AnimatedCounter({ value = 0, prefix = '', duration = 800 }) {
  const [display, setDisplay] = useState(0);
  const target = Number(value) || 0;

  useEffect(() => {
    let frame;
    const start = performance.now();
    const from = display;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(from + (target - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return (
    <span className="stat-glow tabular-nums">
      {prefix}
      {display.toLocaleString('en-IN')}
    </span>
  );
}
