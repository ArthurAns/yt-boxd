import { cn } from "@/lib/utils";

/** Consistent page title block used by every listing page. */
export default function PageHeader({
  title,
  subtitle,
  action,
  maxWidth = "max-w-6xl",
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  maxWidth?: string;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto px-4 pt-10 pb-6", maxWidth, className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
