/** Decorative living atmosphere — no business logic */
export default function AmbientField() {
  return (
    <div className="living-atmosphere" aria-hidden="true">
      <div className="living-atmosphere__base" />
      <div className="living-atmosphere__aurora" />
      <div className="living-atmosphere__grid" />
      <div className="living-atmosphere__orb living-atmosphere__orb--a" />
      <div className="living-atmosphere__orb living-atmosphere__orb--b" />
      <div className="living-atmosphere__particles" />
    </div>
  );
}
