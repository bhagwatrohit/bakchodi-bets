import { describe, it, expect } from "vitest";
import {
  newsForTeams,
  normalizeTeam,
  oddsViewFor,
  type WcNewsItem,
  type WcOddsEntry,
} from "@/lib/services/worldcup-feed";

function entry(partial: Partial<WcOddsEntry>): WcOddsEntry {
  return {
    home: "mexico",
    away: "south africa",
    homeLine: -150,
    awayLine: 400,
    drawLine: 280,
    details: "MEX -150",
    provider: "ESPN BET",
    ...partial,
  };
}

function article(headline: string, teams: string[]): WcNewsItem {
  return { headline, description: null, url: null, published: null, teams };
}

describe("normalizeTeam", () => {
  it("lowercases and resolves feed aliases to fixture names", () => {
    expect(normalizeTeam("USA")).toBe("united states");
    expect(normalizeTeam("Côte d'Ivoire")).toBe("ivory coast");
    expect(normalizeTeam("Türkiye")).toBe("turkey");
    expect(normalizeTeam("Korea Republic")).toBe("south korea");
    expect(normalizeTeam("Mexico")).toBe("mexico");
  });
});

describe("oddsViewFor", () => {
  it("maps home/away lines onto teamA/teamB regardless of order", () => {
    const entries = [entry({})];
    const view = oddsViewFor(entries, "Mexico", "South Africa");
    expect(view).toEqual({
      a: "-150",
      draw: "+280",
      b: "+400",
      summary: "MEX -150",
      provider: "ESPN BET",
    });

    const flipped = oddsViewFor(entries, "South Africa", "Mexico");
    expect(flipped?.a).toBe("+400");
    expect(flipped?.b).toBe("-150");
  });

  it("matches through aliases and returns null when no entry fits", () => {
    const entries = [entry({ home: "united states", away: "haiti" })];
    expect(oddsViewFor(entries, "United States", "Haiti")).not.toBeNull();
    expect(oddsViewFor(entries, "Brazil", "Morocco")).toBeNull();
  });

  it("falls back to the bookmaker summary when per-outcome lines are missing", () => {
    const entries = [entry({ homeLine: null, awayLine: null, drawLine: null })];
    const view = oddsViewFor(entries, "Mexico", "South Africa");
    expect(view?.a).toBeNull();
    expect(view?.summary).toBe("MEX -150");
  });

  it("returns null when there is nothing displayable", () => {
    const entries = [
      entry({ homeLine: null, awayLine: null, drawLine: null, details: null }),
    ];
    expect(oddsViewFor(entries, "Mexico", "South Africa")).toBeNull();
  });
});

describe("newsForTeams", () => {
  const news = [
    article("Brazil cruise past Morocco", ["Brazil", "Morocco"]),
    article("General tournament roundup", []),
    article("Mexico open with a win", ["Mexico"]),
  ];

  it("puts team-specific stories first, padded with general news", () => {
    const picked = newsForTeams(news, ["Mexico"], 2);
    expect(picked.map((n) => n.headline)).toEqual([
      "Mexico open with a win",
      "Brazil cruise past Morocco",
    ]);
  });

  it("returns top stories when no teams match", () => {
    const picked = newsForTeams(news, ["Japan"], 2);
    expect(picked).toHaveLength(2);
    expect(picked[0].headline).toBe("Brazil cruise past Morocco");
  });
});
