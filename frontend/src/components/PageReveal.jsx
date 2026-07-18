import { useLocation } from 'react-router-dom';

/** Cinematic page swap with splash-echo bloom — visual only */
export default function PageReveal({ children }) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="page-reveal page-bloom">
      <div className="page-bloom__flash" aria-hidden="true" />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
