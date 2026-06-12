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
      className={`text-[var(--star-color)] tracking-tight ${className}`}
    >
      {"★".repeat(full)}
      {half ? "½" : ""}
    </span>
  );
}
