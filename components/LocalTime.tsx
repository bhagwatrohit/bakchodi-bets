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
  dateStyle = "medium",
  timeStyle = "short",
  className,
}: {
  value: Date | string;
  dateStyle?: Intl.DateTimeFormatOptions["dateStyle"];
  timeStyle?: Intl.DateTimeFormatOptions["timeStyle"];
  className?: string;
}) {
  const iso = typeof value === "string" ? value : value.toISOString();
  const [text, setText] = useState(
    () =>
      new Intl.DateTimeFormat("en-US", { dateStyle, timeStyle, timeZone: "UTC" }).format(
        new Date(iso),
      ) + " UTC",
  );

  useEffect(() => {
    setText(new Intl.DateTimeFormat(undefined, { dateStyle, timeStyle }).format(new Date(iso)));
  }, [iso, dateStyle, timeStyle]);

  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {text}
    </time>
  );
}
