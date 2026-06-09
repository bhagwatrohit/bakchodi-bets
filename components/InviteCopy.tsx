"use client";

import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Shows the invite code + a "Copy invite link" button.
 * Builds the link from the live origin so it works on any host.
 */
export function InviteCopy({
  inviteCode,
  currencyLabel = "invite",
}: {
  inviteCode: string;
  currencyLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/join/${inviteCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Invite link copied — go round up your crew.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Long-press the code to grab it.");
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-muted-foreground" />
        <code className="rounded-md bg-muted px-2.5 py-1 text-sm font-bold tracking-widest">
          {inviteCode}
        </code>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={copyLink} aria-label={currencyLabel}>
        {copied ? (
          <>
            <Check className="h-4 w-4" /> Copied
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" /> Copy invite link
          </>
        )}
      </Button>
    </div>
  );
}
