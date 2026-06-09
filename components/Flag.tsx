import { flagSrc } from "@/lib/flags";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-4 w-6",
  md: "h-6 w-9",
  lg: "h-9 w-14",
  xl: "h-12 w-[4.5rem]",
} as const;

/**
 * A team's national flag. Pixel-bordered to fit the arcade theme.
 * Teams without a flag (e.g. demo sides) get a "?" tile fallback.
 */
export function Flag({
  team,
  size = "md",
  className,
}: {
  team: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const src = flagSrc(team);
  const box = SIZES[size];

  if (!src) {
    return (
      <span
        aria-hidden
        className={cn(
          "inline-flex items-center justify-center border-2 border-current bg-black/40 font-pixel text-[0.5rem] leading-none",
          box,
          className,
        )}
      >
        ?
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${team} flag`}
      loading="lazy"
      className={cn("inline-block border-2 border-current object-cover", box, className)}
    />
  );
}
