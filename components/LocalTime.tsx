"use client";

import { useEffect, useState } from "react";

/**
 * Renders an instant in the VIEWER's local timezone. The server paints a stable
 * UTC label (so there's no hydration mismatch), then the browser swaps to local
 * time after mount. This is why an Indian player sees IST, not the server's
 * timezone — and why "locks at kickoff" lines up with the clock they're reading.
 */
export function LocalTime({
  value,
  dateStyle,
  timeStyle,
  className,
}: {
  value: Date | string;
  dateStyle?: Intl.DateTimeFormatOptions["dateStyle"];
  timeStyle?: Intl.DateTimeFormatOptions["timeStyle"];
  className?: string;
}) {
  const iso = typeof value === "string" ? value : value.toISOString();
  // Default to date + time only when the caller specifies neither, so passing
  // just `timeStyle` (or just `dateStyle`) renders that part alone.
  const ds = dateStyle === undefined && timeStyle === undefined ? "medium" : dateStyle;
  const ts = dateStyle === undefined && timeStyle === undefined ? "short" : timeStyle;
  const [text, setText] = useState(
    () =>
      new Intl.DateTimeFormat("en-US", { dateStyle: ds, timeStyle: ts, timeZone: "UTC" }).format(
        new Date(iso),
      ) + " UTC",
  );

  useEffect(() => {
    setText(new Intl.DateTimeFormat(undefined, { dateStyle: ds, timeStyle: ts }).format(new Date(iso)));
  }, [iso, ds, ts]);

  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {text}
    </time>
  );
}
