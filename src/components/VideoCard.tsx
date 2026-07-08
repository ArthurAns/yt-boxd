import Link from "next/link";
import Image from "next/image";

/** Poster-style video card used in browse grids. */
export default function VideoCard({
  youtubeId,
  title,
  thumbnailUrl,
  channelName,
  duration,
  footer,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw",
}: {
  youtubeId: string;
  title: string;
  thumbnailUrl: string | null;
  channelName?: string | null;
  duration?: string | null;
  footer?: React.ReactNode;
  sizes?: string;
}) {
  return (
    <Link href={`/video/${youtubeId}`} className="group space-y-2">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-card ring-1 ring-white/5 transition-shadow group-hover:ring-2 group-hover:ring-primary/70">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes={sizes}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-faint">
            No thumbnail
          </div>
        )}
        {duration && (
          <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
            {duration}
          </span>
        )}
      </div>
      <div>
        <p className="line-clamp-2 text-sm font-medium leading-snug transition-colors group-hover:text-primary">
          {title}
        </p>
        {channelName && (
          <p className="mt-0.5 truncate text-xs text-faint">{channelName}</p>
        )}
        {footer}
      </div>
    </Link>
  );
}
