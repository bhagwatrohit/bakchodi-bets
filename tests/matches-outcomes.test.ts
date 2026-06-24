import { describe, it, expect } from "vitest";
import { buildOutcomeLabels } from "@/lib/services/matches";

describe("buildOutcomeLabels", () => {
  it("group stage includes a Draw between the teams", () => {
    expect(
      buildOutcomeLabels({ labelA: "India", labelB: "Pakistan", stage: "group" }),
    ).toEqual(["India", "Draw", "Pakistan"]);
  });
  it("knockout stage has no Draw", () => {
    expect(
      buildOutcomeLabels({ labelA: "France", labelB: "Spain", stage: "knockout" }),
    ).toEqual(["France", "Spain"]);
  });
});
