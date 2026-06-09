"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Tiny box that navigates to /join/[code] with the entered invite code. */
export function JoinByCodeBox() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    router.push(`/join/${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <Input
        name="code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Invite code"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        className="uppercase tracking-wider"
        aria-label="Clan invite code"
      />
      <Button type="submit" variant="outline" disabled={!code.trim()}>
        Join
      </Button>
    </form>
  );
}
