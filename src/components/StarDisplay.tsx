const STAR_POINTS =
  "12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26";

function StarIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`w-[1.1em] h-[1.1em] ${className}`}
      aria-hidden="true"
    >
      <polygon points={STAR_POINTS} />
    </svg>
  );
}

function HalfStarIcon() {
  return (
    <span className="relative inline-block w-[1.1em] h-[1.1em]" aria-hidden="true">
      <StarIcon className="absolute inset-0 text-[var(--star-empty)]" />
      <span className="absolute inset-0 w-1/2 overflow-hidden">
        <StarIcon className="absolute inset-0" />
      </span>
    </span>
  );
}

export default function StarDisplay({
  rating,
  className = "text-xs",
}: {
  rating: number | null;
  className?: string;
}) {
  if (!rating) return null;
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span
      role="img"
      aria-label={`Rated ${rating} out of 5 stars`}
      className={`inline-flex items-center gap-px text-[var(--star-color)] ${className}`}
    >
      {Array.from({ length: full }, (_, i) => (
        <StarIcon key={i} />
      ))}
      {half && <HalfStarIcon />}
    </span>
  );
}
