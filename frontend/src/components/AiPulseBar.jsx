/** Visual AI greeting strip — presentation only */
export default function AiPulseBar({ title, body, tone = 'default' }) {
  const toneClass =
    tone === 'alert'
      ? 'border-rose-400/40 bg-gradient-to-r from-rose-500/10 to-transparent threat-pulse'
      : '';

  return (
    <div className={`ai-pulse relative px-4 py-3 sm:px-5 ${toneClass}`}>
      <div className="relative z-[1] flex flex-wrap items-start gap-3">
        <span className="mt-0.5 inline-flex h-2 w-2 shrink-0 rounded-full bg-brand-500 heartbeat shadow-[0_0_12px_rgba(196,176,224,0.8)]" />
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold tracking-tight text-ink-900 dark:text-white">
            {title}
          </p>
          {body && <p className="mt-0.5 text-sm text-ink-600 dark:text-ink-300">{body}</p>}
        </div>
      </div>
    </div>
  );
}
